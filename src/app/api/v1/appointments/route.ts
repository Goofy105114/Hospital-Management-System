import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { AppointmentService } from "@/server/services/appointment.service";
import { getAuthUser, requireRole } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { AppointmentStatus, AppointmentType, UserRole } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get("patientId");
  const doctorId = searchParams.get("doctorId");
  const status = searchParams.get("status") as AppointmentStatus | null;
  const upcoming = searchParams.get("upcoming") === "true";

  const now = new Date();

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(patientId ? { patientId } : {}),
      ...(doctorId ? { doctorId } : {}),
      ...(status ? { status } : {}),
      ...(upcoming ? { slotStart: { gte: now } } : {}),
    },
    include: {
      patient: { select: { mrn: true, user: { select: { name: true } } } },
      doctor: {
        select: {
          id: true,
          specialization: true,
          photoUrl: true,
          roomNumber: true,
          user: { select: { name: true } },
        },
      },
      department: { select: { name: true, code: true } },
      queueToken: true,
    },
    orderBy: { slotStart: "asc" },
  });

  const formatted = appointments.map((a) => ({
    id: a.id,
    appointmentNumber: a.appointmentNumber,
    patientId: a.patientId,
    patientName: a.patient.user.name,
    patientMrn: a.patient.mrn,
    doctorId: a.doctorId,
    doctorName: a.doctor.user.name,
    doctorPhoto: a.doctor.photoUrl,
    doctorSpecialization: a.doctor.specialization,
    roomNumber: a.doctor.roomNumber,
    departmentName: a.department.name,
    appointmentType: a.appointmentType,
    slotStart: a.slotStart.toISOString(),
    slotEnd: a.slotEnd.toISOString(),
    status: a.status,
    notes: a.notes,
    queueToken: a.queueToken
      ? {
          id: a.queueToken.id,
          tokenNumber: a.queueToken.tokenNumber,
          status: a.queueToken.status,
          position: a.queueToken.position,
          estimatedWaitMinutes: a.queueToken.estimatedWaitMinutes,
        }
      : null,
  }));

  return apiSuccess(formatted);
}

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return apiError("UNAUTHENTICATED", "Authentication required", 401);
    if (!requireRole(auth, [UserRole.PATIENT, UserRole.RECEPTIONIST])) {
      return apiError("UNAUTHORIZED_ROLE", "Role cannot book appointments", 403);
    }
    const body = await req.json();

    const { patientId, doctorId, serviceId, slotStart, slotEnd, appointmentType, notes } = body;

    if (!patientId || !doctorId || !slotStart || !slotEnd) {
      return apiError(
        "APT_MISSING_REQUIRED_FIELDS",
        "patientId, doctorId, slotStart and slotEnd are required",
        400
      );
    }

    if (auth.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        select: { userId: true },
      });
      if (patient?.userId !== auth.sub) {
        return apiError("APT_PATIENT_SCOPE_DENIED", "Patients may only book for themselves", 403);
      }
    }

    const result = await AppointmentService.bookAppointment({
      patientId,
      doctorId,
      serviceId,
      slotStart,
      slotEnd,
      appointmentType: appointmentType as AppointmentType,
      notes,
      actorId: auth?.sub,
      actorRole: auth?.role,
    });

    if (!result.success) {
      return apiError(
        result.code || "APPOINTMENT_ERROR",
        "Appointment booking failed",
        result.status || 400
      );
    }

    return apiSuccess(result.data, undefined, 201);
  } catch (err) {
    console.error("[APPOINTMENT POST ERROR]", err);
    return apiError("INTERNAL_SERVER_ERROR", "Failed to book appointment", 500);
  }
}
