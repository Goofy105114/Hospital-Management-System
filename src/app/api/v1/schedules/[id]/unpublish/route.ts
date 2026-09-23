import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, UserRole } from "@prisma/client";

/**
 * SCH-04 — POST /api/v1/schedules/:id/unpublish
 *
 * Sets isActive = false on the ClinicSession, making it invisible to APT-02's
 * slot-availability query (which filters on { isActive: true }).
 *
 * Roles allowed: ADMIN, SUPER_ADMIN.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.ADMIN])) {
    return apiError("UNAUTHORIZED_ROLE", "Only admins may unpublish schedules", 403);
  }

  try {
    const { id } = params;

    const session = await prisma.clinicSession.findUnique({ where: { id } });

    if (!session) {
      return apiError("SCH_SESSION_NOT_FOUND", "Clinic session not found", 404);
    }

    await prisma.clinicSession.update({
      where: { id },
      data: { isActive: false },
    });

    await logAuditEvent({
      actorId: user.sub,
      actorRole: user.role,
      action: AuditAction.UPDATE,
      entityType: "ClinicSession",
      entityId: id,
      changes: {
        before: { isActive: session?.isActive ?? true },
        after: { isActive: false, published: false },
      },
    });

    return apiSuccess({ id, published: false });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to unpublish schedule", 500);
  }
}
