import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { calculateQueuePositionAndEstimate } from "@/server/domain/queue-state";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tokenId = params.id;

    const token = await prisma.queueToken.findUnique({
      where: { id: tokenId },
      include: {
        patient: { include: { user: true } },
        doctor: { include: { user: true, department: true } },
      },
    });

    if (!token) {
      return NextResponse.json(
        errorResponse("QUE_TOKEN_NOT_FOUND", "Queue token not found"),
        { status: 404 }
      );
    }

    const waitingTokens = await prisma.queueToken.findMany({
      where: {
        doctorId: token.doctorId,
        status: "WAITING",
      },
      orderBy: [{ priorityTier: "desc" }, { position: "asc" }],
      select: {
        id: true,
        priorityTier: true,
        position: true,
      },
    });

    const positionInfo = calculateQueuePositionAndEstimate(waitingTokens, token.id);

    const result = {
      tokenId: token.id,
      tokenNumber: token.tokenNumber,
      patientId: token.patientId,
      patientName: token.patient?.user?.name || "Patient",
      patientMrn: token.patient?.mrn || "MRN-UNKNOWN",
      doctorName: token.doctor?.user?.name || "Doctor",
      roomNumber: token.doctor?.roomNumber || "Consultation Room",
      departmentName: token.doctor?.department?.name || "Outpatient Department",
      priority: token.priorityTier,
      status: token.status,
      positionInQueue: positionInfo.positionInQueue,
      patientsAhead: positionInfo.patientsAhead,
      estimatedWaitMinutes: positionInfo.estimatedWaitMinutes,
      issuedAt: token.checkedInAt.toISOString(),
      calledAt: token.calledAt?.toISOString() || null,
    };

    return NextResponse.json(
      successResponse(result, "Patient live queue status retrieved successfully")
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("QUE_STATUS_FETCH_FAILED", "Failed to retrieve patient queue status", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
