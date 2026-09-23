import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, UserRole } from "@prisma/client";

/**
 * SCH-04 — POST /api/v1/schedules/:id/exceptions
 *
 * Records a one-off date exception for a clinic session (e.g. "this Wednesday
 * only, doctor unavailable 2–4 pm"). Implemented by creating a DoctorLeave row
 * scoped to the single exception date — this re-uses the existing leave model
 * and is automatically respected by APT-02's availability query, which already
 * excludes dates where an approved leave exists.
 *
 * Roles allowed: ADMIN, SUPER_ADMIN.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.ADMIN])) {
    return apiError("UNAUTHORIZED_ROLE", "Only admins may add schedule exceptions", 403);
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { date, reason } = body;

    if (!date) {
      return apiError("SCH_EXCEPTION_MISSING_DATE", "date is required (YYYY-MM-DD)", 400);
    }

    const exceptionDate = new Date(date);
    if (isNaN(exceptionDate.getTime())) {
      return apiError(
        "SCH_EXCEPTION_INVALID_DATE",
        "date must be a valid ISO date (YYYY-MM-DD)",
        400
      );
    }

    // Fetch session to get the doctorId
    const session = await prisma.clinicSession.findUnique({ where: { id } });

    if (!session) {
      return apiError("SCH_SESSION_NOT_FOUND", "Clinic session not found", 404);
    }

    // Normalise to start-of-day / end-of-day for the exception date
    const dayStart = new Date(exceptionDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(exceptionDate);
    dayEnd.setHours(23, 59, 59, 999);

    const leave = await prisma.doctorLeave.create({
      data: {
        doctorId: session.doctorId,
        startDate: dayStart,
        endDate: dayEnd,
        reason: reason || "SCHEDULE_EXCEPTION",
        status: "APPROVED",
      },
    });

    await logAuditEvent({
      actorId: user.sub,
      actorRole: user.role,
      action: AuditAction.CREATE,
      entityType: "ScheduleException",
      entityId: id,
      changes: {
        after: { sessionId: id, date, reason: reason || "SCHEDULE_EXCEPTION" },
      },
    });

    return apiSuccess({ sessionId: id, exception: leave }, undefined, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to create schedule exception", 500);
  }
}
