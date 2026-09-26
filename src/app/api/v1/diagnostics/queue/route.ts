import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { calculateSpecimenSlaRemaining } from "@/server/domain/diagnostic-report";
import { DiagnosticOrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const orders = await prisma.diagnosticOrder.findMany({
      where: {
        ...(status ? { status: status as DiagnosticOrderStatus } : {}),
      },
      include: {
        patient: { include: { user: true } },
        items: { include: { test: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const queue = orders.map((ord) => {
      const sla = calculateSpecimenSlaRemaining(ord.createdAt, 24);
      return {
        orderId: ord.id,
        orderNumber: ord.orderNumber,
        patientId: ord.patientId,
        patientName: ord.patient?.user?.name || "Patient",
        patientMrn: ord.patient?.mrn || "MRN-UNKNOWN",
        status: ord.status,
        tests: ord.items.map((i) => i.test?.name || i.testId),
        priority: (ord.status === DiagnosticOrderStatus.ORDERED ? "URGENT" : "ROUTINE") as "ROUTINE" | "URGENT" | "STAT",
        orderedAt: ord.createdAt.toISOString(),
        slaRemainingHours: sla.remainingHours,
        isSlaBreached: sla.isBreached,
      };
    });

    return NextResponse.json(
      successResponse(queue, `Retrieved ${queue.length} diagnostic work queue items`)
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("DIA_QUEUE_FETCH_FAILED", "Failed to fetch diagnostic work queue", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
