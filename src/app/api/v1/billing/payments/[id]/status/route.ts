import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, InvoiceStatus } from "@prisma/client";
import { authorizeBillingStaff } from "../../../route-auth";

const VALID_PAYMENT_STATUSES = ["SUCCESS", "FAILED"] as const;
type PaymentConfirmStatus = (typeof VALID_PAYMENT_STATUSES)[number];

/**
 * BIL-04 — PATCH /api/v1/billing/payments/:id/status
 *
 * Confirms or fails a pending payment.
 *
 * On SUCCESS:
 *   - Recomputes invoice.paidAmount = SUM of all payments on that invoice.
 *   - Sets invoice.balanceAmount = netAmount - paidAmount.
 *   - Sets invoice.status:
 *       paidAmount >= netAmount  → PAID
 *       paidAmount > 0           → PARTIALLY_PAID
 *       else                     → ISSUED  (unchanged)
 *
 * On FAILED:
 *   - No invoice mutation. Audit event only.
 *
 * Roles: BILLING_STAFF, ADMIN.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = authorizeBillingStaff(request);
  if (auth.error || !auth.user) return auth.error;

  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_PAYMENT_STATUSES.includes(status as PaymentConfirmStatus)) {
      return apiError(
        "BIL_INVALID_PAYMENT_STATUS",
        `status must be one of: ${VALID_PAYMENT_STATUSES.join(", ")}`,
        400
      );
    }

    const confirmStatus = status as PaymentConfirmStatus;

    // Fetch the payment
    const payment = await prisma.payment.findUnique({ where: { id } });

    if (!payment) {
      return apiError("BIL_PAYMENT_NOT_FOUND", "Payment record not found", 404);
    }

    let updatedInvoiceStatus: InvoiceStatus | null = null;

    if (confirmStatus === "SUCCESS") {
      // Recompute invoice totals from all payments
      const [allPayments, invoice] = await Promise.all([
        prisma.payment.findMany({
          where: { invoiceId: payment.invoiceId },
          select: { amount: true },
        }),
        prisma.invoice.findUnique({ where: { id: payment.invoiceId } }),
      ]);

      if (invoice) {
        // Include this payment's amount in the sum
        // (already persisted — just sum all existing payments)
        const totalPaid = allPayments.reduce(
          (sum, p) => sum + Number(p.amount),
          0
        );
        const netAmount = Number(invoice.netAmount);
        const balanceAmount = Math.max(0, netAmount - totalPaid);

        let newStatus: InvoiceStatus;
        if (totalPaid >= netAmount) {
          newStatus = InvoiceStatus.PAID;
        } else if (totalPaid > 0) {
          newStatus = InvoiceStatus.PARTIALLY_PAID;
        } else {
          newStatus = InvoiceStatus.ISSUED;
        }

        await prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            paidAmount: totalPaid,
            balanceAmount,
            status: newStatus,
          },
        });

        updatedInvoiceStatus = newStatus;
      }
    }

    // Audit — record the status confirmation
    await logAuditEvent({
      actorId: auth.user.sub,
      actorRole: auth.user.role,
      action: AuditAction.UPDATE,
      entityType: "Payment",
      entityId: id,
      changes: {
        before: { status: "PENDING" },
        after: {
          status: confirmStatus,
          invoiceStatus: updatedInvoiceStatus ?? "unchanged",
          confirmedBy: auth.user.sub,
          confirmedAt: new Date().toISOString(),
        },
      },
    });

    return apiSuccess({
      paymentId: id,
      status: confirmStatus,
      invoiceId: payment?.invoiceId ?? null,
      invoiceStatus: updatedInvoiceStatus ?? null,
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update payment status", 500);
  }
}
