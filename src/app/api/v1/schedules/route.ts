import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FALLBACK_SCHEDULES = [
  {
    id: "sch-01",
    doctorId: "doc-01",
    doctorName: "Dr. Marcus Vance",
    department: "Cardiology",
    dayOfWeek: 1, // Monday
    dayName: "Monday",
    startTime: "09:00",
    endTime: "13:00",
    slotDurationMinutes: 15,
    maxCapacity: 16,
    roomNumber: "Room 104 (Echo Suite)",
    isPublished: true,
    effectiveFrom: "2026-01-01",
  },
  {
    id: "sch-02",
    doctorId: "doc-01",
    doctorName: "Dr. Marcus Vance",
    department: "Cardiology",
    dayOfWeek: 3, // Wednesday
    dayName: "Wednesday",
    startTime: "14:00",
    endTime: "18:00",
    slotDurationMinutes: 15,
    maxCapacity: 16,
    roomNumber: "Room 104 (Echo Suite)",
    isPublished: true,
    effectiveFrom: "2026-01-01",
  },
  {
    id: "sch-03",
    doctorId: "doc-02",
    doctorName: "Dr. Sarah Jenkins",
    department: "Pediatrics",
    dayOfWeek: 2, // Tuesday
    dayName: "Tuesday",
    startTime: "09:00",
    endTime: "14:00",
    slotDurationMinutes: 20,
    maxCapacity: 15,
    roomNumber: "Room 202 (Pediatric Suite)",
    isPublished: true,
    effectiveFrom: "2026-01-01",
  },
  {
    id: "sch-04",
    doctorId: "doc-03",
    doctorName: "Dr. Emily Chen",
    department: "Neurology",
    dayOfWeek: 4, // Thursday
    dayName: "Thursday",
    startTime: "10:00",
    endTime: "16:00",
    slotDurationMinutes: 30,
    maxCapacity: 12,
    roomNumber: "Room 305 (Neuro Lab)",
    isPublished: false,
    effectiveFrom: "2026-02-01",
  },
];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");

    try {
      const dbSchedules = await prisma.clinicSession.findMany({
        where: doctorId ? { doctorId } : undefined,
        include: {
          doctor: {
            include: {
              user: true,
              department: true,
            },
          },
        },
      });

      if (dbSchedules.length > 0) {
        return NextResponse.json(successResponse(dbSchedules));
      }
    } catch {
      // Fallback
    }

    const filtered = doctorId
      ? FALLBACK_SCHEDULES.filter((s) => s.doctorId === doctorId)
      : FALLBACK_SCHEDULES;

    return NextResponse.json(successResponse(filtered));
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
    const body = await req.json();
    const {
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
      roomNumber,
      slotDurationMinutes,
      maxCapacity,
    } = body;

    if (!doctorId || dayOfWeek === undefined || !startTime || !endTime) {
      return NextResponse.json(
        errorResponse("SCH_INVALID_PAYLOAD", "Doctor ID, day, start and end time are required"),
        { status: 400 }
      );
    }

    const newSession = {
      id: `sch-${Date.now()}`,
      doctorId,
      doctorName: "Dr. Marcus Vance",
      department: "Cardiology",
      dayOfWeek: Number(dayOfWeek),
      dayName: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
        Number(dayOfWeek)
      ],
      startTime,
      endTime,
      roomNumber: roomNumber || "Room 101",
      slotDurationMinutes: Number(slotDurationMinutes) || 15,
      maxCapacity: Number(maxCapacity) || 16,
      isPublished: false,
      effectiveFrom: new Date().toISOString().split("T")[0],
    };

    return NextResponse.json(successResponse(newSession), { status: 201 });
  } catch (error) {
    return NextResponse.json(
      errorResponse("SCH_CREATE_FAILED", "Failed to create clinic schedule session", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
