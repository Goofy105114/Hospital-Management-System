import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appointmentNumber = searchParams.get("appointmentNumber");
    const mrn = searchParams.get("mrn");
    const phone = searchParams.get("phone");

    if (!appointmentNumber && !mrn && !phone) {
      return apiError(
        "QUE_MISSING_LOOKUP_PARAM",
        "At least one search parameter (appointmentNumber, mrn, or phone) is required",
        400
      );
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        ...(appointmentNumber ? { appointmentNumber } : {}),
        ...(mrn ? { patient: { mrn } } : {}),
        ...(phone ? { patient: { user: { phone } } } : {}),
      },
      include: {
        patient: {
          include: {
            user: {
              select: { id: true, name: true, phone: true, email: true },
            },
          },
        },
        doctor: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        department: {
          select: { id: true, name: true, code: true },
        },
        queueToken: {
          select: {
            id: true,
            tokenNumber: true,
            status: true,
            position: true,
            estimatedWaitMinutes: true,
          },
        },
      },
      orderBy: { slotStart: "asc" },
    });

    return apiSuccess(appointments);
  } catch (error) {
    return apiError("QUE_LOOKUP_FAILED", "Failed to look up appointments", 500, {
      error: String(error),
    });
  }
}
