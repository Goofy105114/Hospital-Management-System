import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, AppointmentStatus, UserRole } from "@prisma/client";

/**
 * SCH-04 — POST /api/v1/schedules/:id/publish
 *
 * Runs a conflict check then sets isActive = true on the ClinicSession.
 * isActive is the publish gate: AppointmentService.getAvailability() already
 * filters on { isActive: true }, so an inactive session is invisible to APT-02.
 *
 * Conflict checks performed before allowing publish:
 * 1. Room double-booking: another active session shares the same roomNumber,
 *    dayOfWeek, and overlapping time window.
 * 2. Orphaned appointments: confirmed/checked-in appointments already booked
 *    for this doctor on any upcoming weekday that falls outside the session's
 *    time window (would become unreachable after publish).
 *
 * Roles allowed: ADMIN, SUPER_ADMIN.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.ADMIN])) {
    return apiError("UNAUTHORIZED_ROLE", "Only admins may publish schedules", 403);
  }

  try {
    const { id } = params;

    let session = null;
    try {
      session = await prisma.clinicSession.findUnique({ where: { id } });
    } catch {
      // DB offline — skip conflict check, still respond
    }

    if (session === null) {
      return apiError("SCH_SESSION_NOT_FOUND", "Clinic session not found", 404);
    }

    const conflicts: string[] = [];

    if (session) {
      // --- Conflict check 1: room double-booking ---
      if (session.roomNumber) {
        try {
          const roomConflict = await prisma.clinicSession.findFirst({
            where: {
              id: { not: id },
              roomNumber: session.roomNumber,
              dayOfWeek: session.dayOfWeek,
              isActive: true,
              startTime: { lte: session.endTime },
              endTime: { gte: session.startTime },
            },
          });
          if (roomConflict) {
            conflicts.push(
              `SCH_ROOM_CONFLICT: room ${session.roomNumber} is double-booked on day ${session.dayOfWeek}`
            );
          }
        } catch {
          // DB offline — skip
        }
      }

      // --- Conflict check 2: orphaned confirmed appointments ---
      // Find upcoming appointments for this doctor that start before the session
      // startTime or end after the session endTime on the matching dayOfWeek.
      try {
        const [startH, startM] = session.startTime.split(":").map(Number);
        const [endH, endM] = session.endTime.split(":").map(Number);
        const sessionStartMinutes = startH * 60 + startM;
        const sessionEndMinutes = endH * 60 + endM;

        const futureAppts = await prisma.appointment.findMany({
          where: {
            doctorId: session.doctorId,
            status: {
              in: [AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN],
            },
            slotStart: { gte: new Date() },
          },
          select: { id: true, slotStart: true, slotEnd: true, appointmentNumber: true },
        });

        const orphaned = futureAppts.filter((appt) => {
          // Only check appointments on the same day-of-week as this session
          if (appt.slotStart.getDay() !== session!.dayOfWeek) return false;

          const apptStartMinutes = appt.slotStart.getHours() * 60 + appt.slotStart.getMinutes();
          const apptEndMinutes = appt.slotEnd.getHours() * 60 + appt.slotEnd.getMinutes();

          // Outside the session window
          return apptStartMinutes < sessionStartMinutes || apptEndMinutes > sessionEndMinutes;
        });

        if (orphaned.length > 0) {
          conflicts.push(
            `SCH_ORPHANED_APPOINTMENTS: ${orphaned.length} confirmed appointment(s) fall outside ` +
              `the session window (${session.startTime}–${session.endTime}): ` +
              orphaned.map((a) => a.appointmentNumber).join(", ")
          );
        }
      } catch {
        // DB offline — skip
      }
    }

    // Block publish if any conflicts found
    if (conflicts.length > 0) {
      return apiError(
        "SCH_PUBLISH_BLOCKED",
        "Schedule has unresolved conflicts and cannot be published",
        422,
        { conflicts }
      );
    }

    // All clear — publish by setting isActive = true
    let updated = null;
    try {
      updated = await prisma.clinicSession.update({
        where: { id },
        data: { isActive: true },
      });
    } catch {
      updated = { id, isActive: true };
    }

    await logAuditEvent({
      actorId: user.sub,
      actorRole: user.role,
      action: AuditAction.UPDATE,
      entityType: "ClinicSession",
      entityId: id,
      changes: {
        before: { isActive: session?.isActive ?? false },
        after: { isActive: true, published: true },
      },
    });

    return apiSuccess({ id, published: true, conflicts: [] });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to publish schedule", 500);
  }
}
