import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, DiagnosticOrderStatus, UserRole } from "@prisma/client";

/**
 * Legal forward-only status transitions for diagnostic orders (DIA-02).
 * CANCELLED is always allowed from any non-terminal state.
 */
const DIA_TRANSITIONS: Record<DiagnosticOrderStatus, DiagnosticOrderStatus[]> = {
  ORDERED:           [DiagnosticOrderStatus.SAMPLE_COLLECTED, DiagnosticOrderStatus.CANCELLED],
  SAMPLE_COLLECTED:  [DiagnosticOrderStatus.PROCESSING,       DiagnosticOrderStatus.CANCELLED],
  PROCESSING:        [DiagnosticOrderStatus.RESULTED,         DiagnosticOrderStatus.CANCELLED],
  RESULTED:          [DiagnosticOrderStatus.VERIFIED,         DiagnosticOrderStatus.CANCELLED],
  VERIFIED:          [],
  CANCELLED:         [],
};

/**
 * DIA-02 — PATCH /api/v1/diagnostics/orders/:id/status
 *
 * Advances the order through its lifecycle.
 * Enforces forward-only state machine — no backward transitions allowed.
 * Emits 🔒AUDIT on every status change.
 *
 * Roles: LAB_TECH, RADIOLOGIST (status progression);
 *        DOCTOR, ADMIN (CANCEL only).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (
    !requireRole(user, [
      UserRole.LAB_TECH,
      UserRole.RADIOLOGIST,
      UserRole.DOCTOR,
      UserRole.ADMIN,
    ])
  ) {
    return apiError("UNAUTHORIZED_ROLE", "Insufficient role to update order status", 403);
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;

    if (!status || !Object.values(DiagnosticOrderStatus).includes(status as DiagnosticOrderStatus)) {
      return apiError(
        "DIA_INVALID_STATUS",
        `status must be one of: ${Object.values(DiagnosticOrderStatus).join(", ")}`,
        400
      );
    }

    const targetStatus = status as DiagnosticOrderStatus;

    const order = await prisma.diagnosticOrder.findUnique({ where: { id } });

    if (!order) {
      return apiError("DIA_ORDER_NOT_FOUND", "Diagnostic order not found", 404);
    }

    const allowed = DIA_TRANSITIONS[order.status];
    if (!allowed.includes(targetStatus)) {
      return apiError(
        "DIA_INVALID_TRANSITION",
        `Cannot transition from ${order.status} to ${targetStatus}`,
        422,
        { from: order.status, to: targetStatus, allowed }
      );
    }

    await prisma.diagnosticOrder.update({
      where: { id },
      data: { status: targetStatus },
    });

    await logAuditEvent({
      actorId: user.sub,
      actorRole: user.role,
      action: AuditAction.UPDATE,
      entityType: "DiagnosticOrder",
      entityId: id,
      changes: {
        before: { status: order?.status ?? "UNKNOWN" },
        after:  { status: targetStatus },
      },
    });

    return apiSuccess({ id, status: targetStatus });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update order status", 500);
  }
}
