import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { formatLiveDisplayBoard } from "@/server/domain/queue-state";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const doctorId = searchParams.get("doctorId");

    const tokens = await prisma.queueToken.findMany({
      where: {
        ...(doctorId ? { doctorId } : {}),
        status: { in: ["WAITING", "CALLED", "IN_CONSULTATION"] },
      },
      include: {
        doctor: {
          include: {
            user: true,
            department: true,
          },
        },
      },
      orderBy: [{ priorityTier: "desc" }, { position: "asc" }],
    });

    const displayItems = tokens.map((t) => ({
      tokenNumber: t.tokenNumber,
      status: t.status,
      priority: t.priorityTier,
      roomNumber: t.doctor?.roomNumber || "Room 1",
      doctorName: t.doctor?.user?.name || "Attending Physician",
      sequenceNumber: t.position,
    }));

    const formattedBoard = formatLiveDisplayBoard(displayItems);

    const result = {
      asOfDate: new Date().toISOString(),
      departmentId: departmentId || null,
      currentlyServing: formattedBoard.currentlyServing,
      nextWaiting: formattedBoard.nextWaiting,
      totalWaitingCount: formattedBoard.totalWaitingCount,
    };

    return NextResponse.json(
      successResponse(result, "Live queue display board retrieved successfully")
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("QUE_LIVE_FETCH_FAILED", "Failed to retrieve live queue display", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
