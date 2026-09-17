import { AuditAction, DiagnosticOrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export class DiagnosticReportService {
  static async recordResult(input: {
    orderId: string;
    testId: string;
    numericValue?: number;
    textValue?: string;
    referenceRange?: string;
    isAbnormal: boolean;
    isCritical: boolean;
    actorId: string;
    actorRole: string;
  }) {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.diagnosticOrder.findUnique({ where: { id: input.orderId } });
      if (!order) throw new DiagnosticReportError("DIA_ORDER_NOT_FOUND", 404);
      const created = await tx.diagnosticResult.create({
        data: {
          orderId: input.orderId,
          testId: input.testId,
          numericValue: input.numericValue,
          textValue: input.textValue,
          referenceRange: input.referenceRange,
          isAbnormal: input.isAbnormal,
          isCritical: input.isCritical,
          criticalNotifiedAt: input.isCritical ? new Date() : null,
        },
      });
      if (input.isCritical) {
        await tx.outboxEvent.create({
          data: {
            topic: "diagnostics.critical-result",
            aggregateType: "DiagnosticResult",
            aggregateId: created.id,
            payload: {
              orderId: order.id,
              orderingDoctorId: order.doctorId,
              patientId: order.patientId,
            },
          },
        });
      }
      await tx.auditLog.create({
        data: {
          actorId: input.actorId,
          actorRole: input.actorRole,
          action: AuditAction.CREATE,
          entityType: "DiagnosticResult",
          entityId: created.id,
          changes: { after: { isCritical: input.isCritical, isAbnormal: input.isAbnormal } },
        },
      });
      return created;
    });
    return { success: true as const, data: result };
  }

  static async generate(orderId: string, actorId: string, actorRole: string) {
    try {
      const report = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "DiagnosticOrder" WHERE id = ${orderId} FOR UPDATE`;
        const order = await tx.diagnosticOrder.findUnique({
          where: { id: orderId },
          include: {
            patient: { include: { user: true } },
            items: { include: { test: true } },
            results: { include: { test: true } },
            reports: true,
          },
        });
        if (!order) throw new DiagnosticReportError("DIA_ORDER_NOT_FOUND", 404);
        if (
          order.status !== DiagnosticOrderStatus.VERIFIED ||
          order.results.some((result) => !result.verifiedAt)
        ) {
          throw new DiagnosticReportError("DIA_RESULTS_NOT_VERIFIED", 422);
        }
        const version = Math.max(0, ...order.reports.map((item) => item.version)) + 1;
        const structuredData = {
          orderNumber: order.orderNumber,
          patient: { id: order.patient.id, mrn: order.patient.mrn, name: order.patient.user.name },
          results: order.results.map((result) => ({
            test: result.test.name,
            value: result.numericValue?.toString() ?? result.textValue,
            referenceRange: result.referenceRange,
            isAbnormal: result.isAbnormal,
            isCritical: result.isCritical,
            verifiedAt: result.verifiedAt?.toISOString(),
          })),
        } as Prisma.InputJsonObject;
        const created = await tx.diagnosticReport.create({
          data: {
            orderId,
            patientId: order.patientId,
            version,
            title: `Diagnostic Report ${order.orderNumber}`,
            structuredData,
            generatedBy: actorId,
          },
        });
        await tx.auditLog.create({
          data: {
            actorId,
            actorRole,
            action: AuditAction.CREATE,
            entityType: "DiagnosticReport",
            entityId: created.id,
            changes: { after: { orderId, version } },
          },
        });
        return created;
      });
      return { success: true as const, data: report };
    } catch (error) {
      return this.error(error);
    }
  }

  static async release(orderId: string, actorId: string, actorRole: string) {
    try {
      const report = await prisma.$transaction(async (tx) => {
        const current = await tx.diagnosticReport.findFirst({
          where: { orderId },
          orderBy: { version: "desc" },
        });
        if (!current) throw new DiagnosticReportError("DIA_REPORT_NOT_FOUND", 404);
        const releasedAt = current.releasedAt ?? new Date();
        const updated = await tx.diagnosticReport.update({
          where: { id: current.id },
          data: { releasedAt, releasedBy: actorId },
        });
        await tx.auditLog.create({
          data: {
            actorId,
            actorRole,
            action: AuditAction.APPROVE,
            entityType: "DiagnosticReport",
            entityId: updated.id,
            changes: { after: { releasedAt } },
          },
        });
        await tx.outboxEvent.create({
          data: {
            topic: "diagnostics.report-released",
            aggregateType: "DiagnosticReport",
            aggregateId: updated.id,
            payload: { patientId: updated.patientId, orderId },
          },
        });
        return updated;
      });
      return { success: true as const, data: report };
    } catch (error) {
      return this.error(error);
    }
  }

  private static error(error: unknown) {
    if (error instanceof DiagnosticReportError)
      return { success: false as const, code: error.code, status: error.status };
    throw error;
  }
}

class DiagnosticReportError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number
  ) {
    super(code);
  }
}
