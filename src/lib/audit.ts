import { prisma } from "./prisma";
import { AuditAction } from "@prisma/client";

export interface LogAuditParams {
  actorId?: string;
  actorRole?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  changes?: {
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
  } | null;
  ipAddress?: string;
  requestId?: string;
}

export async function logAuditEvent(params: LogAuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: params.actorId || null,
        actorRole: params.actorRole || "SYSTEM",
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        changes: (params.changes as object) || {},
        ipAddress: params.ipAddress || null,
        requestId: params.requestId || null,
      },
    });
  } catch (err) {
    // Non-blocking catch to prevent transaction abort on audit failure, but log to console
    console.error("[AUDIT LOG ERROR]", err);
  }
}

export const recordAuditLog = logAuditEvent;
