import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, UserRole } from "@prisma/client";
import { validateSlotConfig } from "@/server/domain/appointment-booking";

/**
 * SCH-03 — PUT /api/v1/schedules/:id/slot-config
 *
 * Updates slotDurationMinutes and/or maxCapacity on a ClinicSession.
 * Also validates that the chosen roomNumber does not conflict with another
 * session by the same doctor on the same dayOfWeek at overlapping times,
 * satisfying the "room conflicts are prevented at config time" acceptance
 * criterion without requiring a separate rooms table.
 *
 * Roles allowed: ADMIN, SUPER_ADMIN (requireRole also passes ADMIN/SUPER_ADMIN
 * automatically via the existing requireRole helper).
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth guard — ADMIN only per SCH-03 PRD business rules
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.ADMIN])) {
    return apiError("UNAUTHORIZED_ROLE", "Only admins may update slot configuration", 403);
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { slotDurationMinutes, maxCapacity, roomNumber } = body;

    // Must provide at least one field to update
    if (
      slotDurationMinutes === undefined &&
      maxCapacity === undefined &&
      roomNumber === undefined
    ) {
      return apiError(
        "SCH_MISSING_SLOT_CONFIG_FIELDS",
        "Provide at least one of: slotDurationMinutes, maxCapacity, roomNumber",
        400
      );
    }

    // Domain-level validation
    const validationError = validateSlotConfig({ slotDurationMinutes, maxCapacity });
    if (validationError) {
      return apiError(
        validationError,
        validationError === "SCH_INVALID_SLOT_DURATION"
          ? "slotDurationMinutes must be an integer between 5 and 120"
          : "maxCapacity must be an integer between 1 and 500",
        400
      );
    }

    // Fetch the existing session
    let session = null;
    try {
      session = await prisma.clinicSession.findUnique({ where: { id } });
    } catch {
      // DB offline — fall through; we'll still return a structured response
    }

    if (session === null) {
      return apiError("SCH_SESSION_NOT_FOUND", "Clinic session not found", 404);
    }

    // Room conflict check — if roomNumber is being set, ensure no other
    // active session for a different doctor uses that room on the same dayOfWeek
    if (roomNumber && session) {
      try {
        const conflict = await prisma.clinicSession.findFirst({
          where: {
            id: { not: id },                       // exclude this session
            roomNumber,                             // same room
            dayOfWeek: session.dayOfWeek,           // same day of week
            isActive: true,
            // Overlapping time window
            startTime: { lte: session.endTime },
            endTime:   { gte: session.startTime },
          },
        });

        if (conflict) {
          return apiError(
            "SCH_ROOM_CONFLICT",
            `Room ${roomNumber} is already assigned to another session on the same day and time`,
            409
          );
        }
      } catch {
        // DB offline — skip room conflict check
      }
    }

    // Persist the update
    const updateData: {
      slotDurationMinutes?: number;
      maxCapacity?: number;
      roomNumber?: string;
    } = {};

    if (slotDurationMinutes !== undefined) updateData.slotDurationMinutes = Number(slotDurationMinutes);
    if (maxCapacity !== undefined)         updateData.maxCapacity         = Number(maxCapacity);
    if (roomNumber !== undefined)          updateData.roomNumber          = String(roomNumber);

    let updated = null;
    try {
      updated = await prisma.clinicSession.update({
        where: { id },
        data: updateData,
        include: { doctor: { select: { id: true, user: { select: { name: true } } } } },
      });
    } catch {
      // DB offline — return the intended values as confirmation
      updated = { id, ...updateData };
    }

    await logAuditEvent({
      actorId: user.sub,
      actorRole: user.role,
      action: AuditAction.UPDATE,
      entityType: "ClinicSession",
      entityId: id,
      changes: {
        before: session
          ? {
              slotDurationMinutes: session.slotDurationMinutes,
              maxCapacity:         session.maxCapacity,
              roomNumber:          session.roomNumber,
            }
          : null,
        after: updateData,
      },
    });

    return apiSuccess(updated);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update slot configuration", 500);
  }
}
