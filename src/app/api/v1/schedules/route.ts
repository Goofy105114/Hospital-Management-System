import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import {
  validateClinicSession,
  detectSessionOverlap,
  ClinicSessionInput,
} from "@/server/domain/doctor-schedule";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const dayOfWeekParam = searchParams.get("dayOfWeek");
    const dayOfWeek = dayOfWeekParam !== null ? Number(dayOfWeekParam) : undefined;

    const dbSchedules = await prisma.clinicSession.findMany({
      where: {
        ...(doctorId ? { doctorId } : {}),
        ...(dayOfWeek !== undefined ? { dayOfWeek } : {}),
        isActive: true,
      },
      include: {
        doctor: {
          include: {
            user: true,
            department: true,
          },
        },
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    return NextResponse.json(successResponse(dbSchedules));
  } catch (error) {
    return NextResponse.json(
      errorResponse("SCH_FETCH_FAILED", "Failed to retrieve doctor schedules", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json(
        errorResponse("UNAUTHORIZED", "Authentication required to create clinic sessions"),
        { status: 401 }
      );
    }

    const allowed = requireRole(auth, ["ADMIN", "SUPER_ADMIN", "DOCTOR"]);
    if (!allowed) {
      return NextResponse.json(
        errorResponse("SCH_FORBIDDEN", "Insufficient permissions to manage clinic schedules"),
        { status: 403 }
      );
    }

    const body = await req.json();
    const validation = validateClinicSession(body);
    if (!validation.isValid) {
      return NextResponse.json(
        errorResponse(
          validation.errorCode || "SCH_INVALID_PAYLOAD",
          validation.errorMessage || "Invalid clinic session data"
        ),
        { status: 400 }
      );
    }

    const sessionInput: ClinicSessionInput = {
      doctorId: body.doctorId,
      dayOfWeek: Number(body.dayOfWeek),
      startTime: body.startTime,
      endTime: body.endTime,
      roomNumber: body.roomNumber || null,
      slotDurationMinutes: body.slotDurationMinutes ? Number(body.slotDurationMinutes) : 15,
      maxCapacity: body.maxCapacity ? Number(body.maxCapacity) : 30,
      isActive: true,
    };

    // Check for overlapping sessions for this doctor on this day
    const existingSessions = await prisma.clinicSession.findMany({
      where: {
        doctorId: sessionInput.doctorId,
        dayOfWeek: sessionInput.dayOfWeek,
        isActive: true,
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
        dayOfWeek: sessionInput.dayOfWeek,
        startTime: sessionInput.startTime,
        endTime: sessionInput.endTime,
      },
      existingSessions
    );

    if (hasOverlap) {
      return NextResponse.json(
        errorResponse(
          "SCH_SESSION_OVERLAP",
          "Doctor already has an active clinic session scheduled during this time window",
          {
            doctorId: sessionInput.doctorId,
            dayOfWeek: sessionInput.dayOfWeek,
            startTime: sessionInput.startTime,
            endTime: sessionInput.endTime,
          }
        ),
        { status: 409 }
      );
    }

    const createdSession = await prisma.clinicSession.create({
      data: {
        doctorId: sessionInput.doctorId,
        dayOfWeek: sessionInput.dayOfWeek,
        startTime: sessionInput.startTime,
        endTime: sessionInput.endTime,
        roomNumber: sessionInput.roomNumber,
        slotDurationMinutes: sessionInput.slotDurationMinutes,
        maxCapacity: sessionInput.maxCapacity,
        isActive: true,
      },
      include: {
        doctor: {
          include: { user: true, department: true },
        },
      },
    });

    await logAuditEvent({
      actorId: auth.sub,
      actorRole: auth.role,
      action: AuditAction.CREATE,
      entityType: "ClinicSession",
      entityId: createdSession.id,
      changes: { after: createdSession },
    });

    return NextResponse.json(successResponse(createdSession), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      errorResponse("SCH_CREATE_FAILED", "Failed to create clinic schedule session", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
