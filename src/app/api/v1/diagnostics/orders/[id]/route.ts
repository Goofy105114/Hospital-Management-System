import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getAuthUser(request);
    if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);

    const order = await prisma.diagnosticOrder.findFirst({
      where: {
        OR: [{ id: params.id }, { orderNumber: params.id }],
      },
      include: {
        patient: { include: { user: true } },
        items: { include: { test: true } },
        results: { include: { test: true } },
      },
    });

    if (!order) {
      return apiError("ORDER_NOT_FOUND", "Diagnostic order not found", 404);
    }

    // Lookup doctor if doctorId is present
    let doctorName = "Attending Physician";
    if (order.doctorId) {
      const doc = await prisma.doctor.findUnique({
        where: { id: order.doctorId },
        include: { user: true },
      });
      if (doc?.user?.name) doctorName = doc.user.name;
    }

    const testItem = order.items[0]?.test;

    const formatted = {
      id: order.id,
      orderNumber: order.orderNumber,
      testName: testItem?.name || "Diagnostic Analysis",
      patientName: order.patient.user.name,
      patientMrn: order.patient.mrn,
      doctorName,
      orderedAt: order.createdAt.toISOString().replace("T", " ").slice(0, 16),
      specimenBarcode: `BAR-${order.orderNumber.slice(-5)}`,
      specimenCollectedAt: order.createdAt.toISOString().replace("T", " ").slice(0, 16),
      technicianName: "Alex Morgan, MLS(ASCP)",
      status: order.status,
      analytes: order.results.map((r) => ({
        id: r.id,
        name: r.test.name,
        value: r.numericValue ? String(r.numericValue) : r.textValue || "0",
        unit: (r.test as any).unit || "mg/dL",
        referenceRange: r.referenceRange || "Standard",
        status: r.isCritical ? "CRITICAL" : r.isAbnormal ? "HIGH" : "NORMAL",
      })),
    };

    return apiSuccess(formatted);
  } catch (error: any) {
    return apiError("ORDER_FETCH_FAILED", error.message || "Failed to retrieve order", 500);
  }
}
