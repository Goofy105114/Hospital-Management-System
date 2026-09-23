import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, DiagnosticOrderStatus, UserRole } from "@prisma/client";

/**
 * DIA-02 — POST /api/v1/diagnostics/orders/:id/schedule
 *
 * Records the scheduled slot for a diagnostic order.
 * The schema has no dedicated scheduledAt column, so slotStart is stored
 * as a prefix in the notes field: "scheduled:ISO8601|<original notes>".
 * Status remains ORDERED (no SCHEDULED enum value in the schema).
 *
 * Roles: LAB_TECH, RECEPTIONIST, ADMIN.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.LAB_TECH, UserRole.RECEPTIONIST, UserRole.ADMIN])) {
    return apiError(
      "UNAUTHORIZED_ROLE",
      "Lab tech, receptionist or admin role required to schedule orders",
      403
    );
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { slotStart } = body;

    if (!slotStart) {
      return apiError("DIA_MISSING_SLOT", "slotStart (ISO8601) is required", 400);
    }

    const slotDate = new Date(slotStart);
    if (isNaN(slotDate.getTime())) {
      return apiError("DIA_INVALID_SLOT", "slotStart must be a valid ISO8601 datetime", 400);
    }

    const order = await prisma.diagnosticOrder.findUnique({ where: { id } });

    if (!order) {
      return apiError("DIA_ORDER_NOT_FOUND", "Diagnostic order not found", 404);
    }

    if (order.status === DiagnosticOrderStatus.CANCELLED) {
      return apiError("DIA_ORDER_CANCELLED", "Cannot schedule a cancelled order", 422);
    }

    // Encode slotStart into notes: "scheduled:ISO|<prev notes>"
    const existingNotes = order.notes ?? "";
    const cleanNotes = existingNotes.replace(/^scheduled:[^|]*\|?/, "");
    const updatedNotes = `scheduled:${slotDate.toISOString()}|${cleanNotes}`.replace(/\|$/, "");

    await prisma.diagnosticOrder.update({
      where: { id },
      data: { notes: updatedNotes },
    });

    await logAuditEvent({
      actorId: user.sub,
      actorRole: user.role,
      action: AuditAction.UPDATE,
      entityType: "DiagnosticOrder",
      entityId: id,
      changes: {
        before: { scheduledAt: null },
        after: { scheduledAt: slotDate.toISOString(), scheduledBy: user.sub },
      },
    });

    return apiSuccess({
      id,
      status: order?.status ?? "ORDERED",
      scheduledAt: slotDate.toISOString(),
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to schedule diagnostic order", 500);
  }
}
