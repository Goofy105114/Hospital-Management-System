import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { QueueTokenStatus, AppointmentStatus } from "@prisma/client";
import { QueueService } from "@/server/services/queue.service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const status = searchParams.get("status") as QueueTokenStatus | null;

    let resolvedDoctorId = doctorId;
    if (doctorId) {
      const doc = await prisma.doctor.findFirst({
        where: { OR: [{ id: doctorId }, { userId: doctorId }] },
        select: { id: true },
      });
      if (doc) resolvedDoctorId = doc.id;
    }

    // Auto-sync any confirmed appointments that don't have a queue token yet
    try {
      const unlinkedAppts = await prisma.appointment.findMany({
        where: {
          status: { in: [AppointmentStatus.CONFIRMED, AppointmentStatus.CHECKED_IN] },
          queueToken: null,
          ...(resolvedDoctorId ? { doctorId: resolvedDoctorId } : {}),
        },
        take: 20,
      });
      for (const appt of unlinkedAppts) {
        await QueueService.checkIn({
          appointmentId: appt.id,
          patientId: appt.patientId,
          doctorId: appt.doctorId,
          allowOverride: true,
        }).catch(() => {});
      }
    } catch {
      // Best-effort auto-sync
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tokens = await prisma.queueToken.findMany({
      where: {
        ...(status
          ? { status }
          : {
              OR: [
                { checkedInAt: { gte: todayStart } },
                {
                  status: {
                    in: [
                      QueueTokenStatus.WAITING,
                      QueueTokenStatus.CALLED,
                      QueueTokenStatus.IN_CONSULTATION,
                    ],
                  },
                },
              ],
            }),
        ...(resolvedDoctorId ? { doctorId: resolvedDoctorId } : {}),
      },
      include: {
        appointment: {
          select: {
            id: true,
            notes: true,
            appointmentType: true,
            slotStart: true,
          },
        },
        patient: {
          select: {
            id: true,
            mrn: true,
            dob: true,
            gender: true,
            bloodGroup: true,
            allergies: true,
            user: { select: { name: true, phone: true } },
            vitalSigns: { orderBy: { recordedAt: "desc" }, take: 1 },
          },
        },
        doctor: {
          select: {
            id: true,
            roomNumber: true,
            specialization: true,
            user: { select: { name: true } },
            department: { select: { name: true, code: true } },
          },
        },
      },
      orderBy: [
        { priorityTier: "desc" },
        { position: "asc" },
        { checkedInAt: "asc" },
      ],
    });

    const formatted = tokens.map((t) => {
      const birthDate = t.patient.dob ? new Date(t.patient.dob) : null;
      const age = birthDate
        ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : 38;
      const vs = t.patient.vitalSigns?.[0];

      return {
        id: t.id,
        tokenNumber: t.tokenNumber,
        patientId: t.patientId,
        patientName: t.patient.user.name,
        patientMrn: t.patient.mrn,
        mrn: t.patient.mrn,
        doctorId: t.doctorId,
        doctorName: t.doctor.user.name,
        departmentName: t.doctor.department.name,
        department: t.doctor.department.name,
        roomNumber: t.doctor.roomNumber,
        room: t.doctor.roomNumber,
        priorityTier: t.priorityTier,
        source: t.source,
        status: t.status,
        position: t.position,
        estimatedWaitMinutes: t.estimatedWaitMinutes,
        checkedInAt: t.checkedInAt.toISOString(),
        calledAt: t.calledAt ? t.calledAt.toISOString() : null,
        completedAt: t.completedAt ? t.completedAt.toISOString() : null,
        reason: t.notes || t.appointment?.notes || "Consultation & clinical evaluation",
        vitalSigns: vs ? [vs] : [],
        patient: {
          id: t.patient.id,
          name: t.patient.user.name,
          mrn: t.patient.mrn,
          age,
          gender: t.patient.gender || "Other",
          bloodGroup: t.patient.bloodGroup || "O+",
          allergies: t.patient.allergies || [],
          phone: t.patient.user.phone,
          vitalSigns: vs ? [vs] : [],
        },
      };
    });

    return apiSuccess(formatted);
  } catch (error: any) {
    console.error("[QUEUE_TOKENS_GET_ERROR]", error);
    return apiError(
      "QUEUE_TOKENS_FETCH_FAILED",
      error.message || "Failed to fetch queue tokens",
      500
    );
  }
}
