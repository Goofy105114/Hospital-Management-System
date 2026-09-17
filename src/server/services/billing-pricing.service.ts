import {
  ApprovalStatus,
  AuditAction,
  InvoiceAdjustmentMethod,
  InvoiceAdjustmentType,
  InvoiceStatus,
  Prisma,
  UserRole,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adjustmentAmount, calculateInvoiceTotals } from "@/server/domain/invoice-pricing";

export class BillingPricingService {
  static async applyAdjustment(input: {
    invoiceId: string;
    type: InvoiceAdjustmentType;
    method: InvoiceAdjustmentMethod;
    value: number;
    reason: string;
    invoiceItemId?: string;
    actorId: string;
    actorRole: UserRole;
  }) {
    if (!input.reason?.trim())
      return { success: false as const, code: "BIL_REASON_REQUIRED", status: 400 };
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM "Invoice" WHERE id = ${input.invoiceId} FOR UPDATE`;
          const invoice = await tx.invoice.findUnique({
            where: { id: input.invoiceId },
            include: { items: true, adjustments: true },
          });
          if (!invoice) throw new PricingError("BIL_INVOICE_NOT_FOUND", 404);
          if ([InvoiceStatus.PAID, InvoiceStatus.CANCELLED].includes(invoice.status as any)) {
            throw new PricingError("BIL_INVOICE_NOT_ADJUSTABLE", 422);
          }
          const line = input.invoiceItemId
            ? invoice.items.find((item) => item.id === input.invoiceItemId)
            : null;
          if (input.invoiceItemId && !line) throw new PricingError("BIL_LINE_ITEM_NOT_FOUND", 404);
          const eligibleAmount = line ? Number(line.totalPrice) : Number(invoice.totalAmount);
          const appliedAmount = adjustmentAmount(input.method, input.value, eligibleAmount);
          if (appliedAmount === null) throw new PricingError("BIL_INVALID_ADJUSTMENT", 422);

          let status: ApprovalStatus = ApprovalStatus.APPROVED;
          if (
            input.type === InvoiceAdjustmentType.WAIVER &&
            input.actorRole === UserRole.BILLING_STAFF
          ) {
            const setting = await tx.systemSetting.findUnique({
              where: { key: "billing.waiverApprovalThreshold" },
            });
            const threshold = typeof setting?.value === "number" ? setting.value : 500;
            if (appliedAmount > threshold) status = ApprovalStatus.PENDING_APPROVAL;
          }
          const adjustment = await tx.invoiceAdjustment.create({
            data: {
              invoiceId: invoice.id,
              invoiceItemId: input.invoiceItemId,
              type: input.type,
              method: input.method,
              value: input.value,
              appliedAmount,
              reason: input.reason,
              status,
              requestedBy: input.actorId,
              approvedBy: status === ApprovalStatus.APPROVED ? input.actorId : null,
              approvedAt: status === ApprovalStatus.APPROVED ? new Date() : null,
            },
          });
          const totals = await this.recalculate(tx, invoice.id);
          await tx.auditLog.create({
            data: {
              actorId: input.actorId,
              actorRole: input.actorRole,
              action: status === ApprovalStatus.APPROVED ? AuditAction.APPROVE : AuditAction.CREATE,
              entityType: "InvoiceAdjustment",
              entityId: adjustment.id,
              changes: {
                after: {
                  type: input.type,
                  method: input.method,
                  appliedAmount,
                  reason: input.reason,
                  status,
                },
              },
            },
          });
          return { adjustment, totals };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
      return { success: true as const, data: result };
    } catch (error) {
      return this.error(error);
    }
  }

  static async approveWaiver(
    adjustmentId: string,
    approve: boolean,
    actorId: string,
    actorRole: string
  ) {
    try {
      const result = await prisma.$transaction(async (tx) => {
        const current = await tx.invoiceAdjustment.findUnique({ where: { id: adjustmentId } });
        if (!current || current.type !== InvoiceAdjustmentType.WAIVER) {
          throw new PricingError("BIL_WAIVER_NOT_FOUND", 404);
        }
        if (current.status !== ApprovalStatus.PENDING_APPROVAL) {
          throw new PricingError("BIL_WAIVER_NOT_PENDING", 422);
        }
        const status = approve ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;
        const updated = await tx.invoiceAdjustment.update({
          where: { id: adjustmentId },
          data: { status, approvedBy: actorId, approvedAt: new Date() },
        });
        const totals = await this.recalculate(tx, current.invoiceId);
        await tx.auditLog.create({
          data: {
            actorId,
            actorRole,
            action: AuditAction.APPROVE,
            entityType: "InvoiceAdjustment",
            entityId: adjustmentId,
            changes: { after: { status } },
          },
        });
        return { adjustment: updated, totals };
      });
      return { success: true as const, data: result };
    } catch (error) {
      return this.error(error);
    }
  }

  static async setTaxRule(serviceCategory: string, ratePercent: number) {
    if (
      !serviceCategory.trim() ||
      !Number.isFinite(ratePercent) ||
      ratePercent < 0 ||
      ratePercent > 100
    ) {
      return { success: false as const, code: "BIL_INVALID_TAX_RULE", status: 400 };
    }
    const rule = await prisma.taxRule.upsert({
      where: { serviceCategory },
      create: { serviceCategory, ratePercent },
      update: { ratePercent, isActive: true },
    });
    return { success: true as const, data: rule };
  }

  private static async recalculate(tx: Prisma.TransactionClient, invoiceId: string) {
    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      include: { items: true, adjustments: { where: { status: ApprovalStatus.APPROVED } } },
    });
    const categories = invoice.items
      .map((item) => item.serviceCategory)
      .filter(Boolean) as string[];
    const taxRules = await tx.taxRule.findMany({
      where: { serviceCategory: { in: categories }, isActive: true },
    });
    const rateByCategory = new Map(
      taxRules.map((rule) => [rule.serviceCategory, Number(rule.ratePercent)])
    );
    const totals = calculateInvoiceTotals({
      lines: invoice.items.map((item) => ({
        amount: Number(item.totalPrice),
        taxRatePercent: item.serviceCategory ? rateByCategory.get(item.serviceCategory) : 0,
      })),
      discountAmounts: invoice.adjustments
        .filter((item) => item.type === InvoiceAdjustmentType.DISCOUNT)
        .map((item) => Number(item.appliedAmount)),
      waiverAmounts: invoice.adjustments
        .filter((item) => item.type === InvoiceAdjustmentType.WAIVER)
        .map((item) => Number(item.appliedAmount)),
    });
    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        totalAmount: totals.subtotal,
        discountAmount: totals.discount,
        taxAmount: totals.tax,
        netAmount: totals.finalTotal,
        balanceAmount: Math.max(0, totals.finalTotal - Number(invoice.paidAmount)),
      },
    });
    return totals;
  }

  private static error(error: unknown) {
    if (error instanceof PricingError)
      return { success: false as const, code: error.code, status: error.status };
    throw error;
  }
}

class PricingError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number
  ) {
    super(code);
  }
}
