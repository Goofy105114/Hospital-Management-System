import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import { validateClinicSession, detectSessionOverlap } from "@/server/domain/doctor-schedule";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const session = await prisma.clinicSession.findUnique({
      where: { id },
      include: {
        doctor: {
          include: { user: true, department: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json(errorResponse("SCH_NOT_FOUND", "Clinic session not found"), {
        status: 404,
      });
    }

    return NextResponse.json(successResponse(session));
  } catch (error) {
    return NextResponse.json(
      errorResponse("SCH_FETCH_FAILED", "Failed to retrieve clinic session", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", "Authentication required to modify clinic sessions"),
        { status: 401 }
      );
    }

    const allowed = requireRole(auth, ["ADMIN", "SUPER_ADMIN", "DOCTOR"]);
    if (!allowed) {
      return NextResponse.json(
        errorResponse("SCH_FORBIDDEN", "Insufficient permissions to modify clinic session"),
        { status: 403 }
      );
    }

    const session = await prisma.clinicSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(errorResponse("SCH_NOT_FOUND", "Clinic session not found"), {
        status: 404,
      });
    }

    const body = await req.json();
    const updatedDayOfWeek =
      body.dayOfWeek !== undefined ? Number(body.dayOfWeek) : session.dayOfWeek;
    const updatedStartTime = body.startTime || session.startTime;
    const updatedEndTime = body.endTime || session.endTime;
    const updatedSlotDuration =
      body.slotDurationMinutes !== undefined
        ? Number(body.slotDurationMinutes)
        : session.slotDurationMinutes;
    const updatedMaxCapacity =
      body.maxCapacity !== undefined ? Number(body.maxCapacity) : session.maxCapacity;

    const validation = validateClinicSession({
      doctorId: session.doctorId,
      dayOfWeek: updatedDayOfWeek,
      startTime: updatedStartTime,
      endTime: updatedEndTime,
      slotDurationMinutes: updatedSlotDuration,
      maxCapacity: updatedMaxCapacity,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        errorResponse(
          validation.errorCode || "SCH_INVALID_PAYLOAD",
          validation.errorMessage || "Invalid clinic session update payload"
        ),
        { status: 400 }
      );
    }

    // Check for overlap excluding current session
    const existingSessions = await prisma.clinicSession.findMany({
      where: {
        doctorId: session.doctorId,
        dayOfWeek: updatedDayOfWeek,
        isActive: true,
        NOT: { id },
      },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
        isActive: true,
      },
    });

    const hasOverlap = detectSessionOverlap(
      {
        id,
        dayOfWeek: updatedDayOfWeek,
        startTime: updatedStartTime,
        endTime: updatedEndTime,
      },
      existingSessions
    );

    if (hasOverlap) {
      return NextResponse.json(
        errorResponse(
          "SCH_SESSION_OVERLAP",
          "Updated schedule overlaps with an existing clinic session for this doctor",
          { id, dayOfWeek: updatedDayOfWeek, startTime: updatedStartTime, endTime: updatedEndTime }
        ),
        { status: 409 }
      );
    }

    const updated = await prisma.clinicSession.update({
      where: { id },
      data: {
        dayOfWeek: updatedDayOfWeek,
        startTime: updatedStartTime,
        endTime: updatedEndTime,
        roomNumber: body.roomNumber !== undefined ? body.roomNumber : session.roomNumber,
        slotDurationMinutes: updatedSlotDuration,
        maxCapacity: updatedMaxCapacity,
        isActive: body.isActive !== undefined ? Boolean(body.isActive) : session.isActive,
      },
    });

    await logAuditEvent({
      actorId: auth.sub,
      actorRole: auth.role,
      action: AuditAction.UPDATE,
      entityType: "ClinicSession",
      entityId: id,
      changes: {
        before: session as unknown as Record<string, unknown>,
        after: updated as unknown as Record<string, unknown>,
      },
    });

    return NextResponse.json(successResponse(updated));
  } catch (error) {
    return NextResponse.json(
      errorResponse("SCH_UPDATE_FAILED", "Failed to update clinic session", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", "Authentication required to delete clinic sessions"),
        { status: 401 }
      );
    }

    const allowed = requireRole(auth, ["ADMIN", "SUPER_ADMIN"]);
    if (!allowed) {
      return NextResponse.json(
        errorResponse("SCH_FORBIDDEN", "Only administrators can delete clinic sessions"),
        { status: 403 }
      );
    }

    const session = await prisma.clinicSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(errorResponse("SCH_NOT_FOUND", "Clinic session not found"), {
        status: 404,
      });
    }

    await prisma.clinicSession.update({
      where: { id },
      data: { isActive: false },
    });

    await logAuditEvent({
      actorId: auth.sub,
      actorRole: auth.role,
      action: AuditAction.DELETE,
      entityType: "ClinicSession",
      entityId: id,
      changes: { before: session as unknown as Record<string, unknown> },
    });

    return NextResponse.json(successResponse({ id, deleted: true }));
  } catch (error) {
    return NextResponse.json(
      errorResponse("SCH_DELETE_FAILED", "Failed to deactivate clinic session", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
