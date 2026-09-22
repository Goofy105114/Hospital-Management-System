import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { QueueTokenStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const status = searchParams.get("status") as QueueTokenStatus | null;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const tokens = await prisma.queueToken.findMany({
      where: {
        checkedInAt: { gte: todayStart },
        ...(doctorId ? { doctorId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        patient: {
          select: {
            id: true,
            mrn: true,
            dob: true,
            bloodGroup: true,
            user: { select: { name: true, phone: true } },
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

    const formatted = tokens.map((t) => ({
      id: t.id,
      tokenNumber: t.tokenNumber,
      patientId: t.patientId,
      patientName: t.patient.user.name,
      patientMrn: t.patient.mrn,
      doctorId: t.doctorId,
      doctorName: t.doctor.user.name,
      departmentName: t.doctor.department.name,
      roomNumber: t.doctor.roomNumber,
      priorityTier: t.priorityTier,
      source: t.source,
      status: t.status,
      position: t.position,
      estimatedWaitMinutes: t.estimatedWaitMinutes,
      checkedInAt: t.checkedInAt.toISOString(),
      calledAt: t.calledAt ? t.calledAt.toISOString() : null,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
    }));

    return apiSuccess(formatted);
  } catch (error: any) {
    console.error("[QUEUE_TOKENS_GET_ERROR]", error);
    return apiError("QUEUE_TOKENS_FETCH_FAILED", error.message || "Failed to fetch queue tokens", 500);
  }
}
