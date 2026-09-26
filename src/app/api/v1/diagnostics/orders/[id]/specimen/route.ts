import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import {
  validateSpecimenCollection,
  canTransitionDiagnosticOrderStatus,
} from "@/server/domain/diagnostic-report";
import { DiagnosticOrderStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    const body = await req.json().catch(() => ({}));

    const validation = validateSpecimenCollection({
      orderId,
      specimenType: body.specimenType,
      barcode: body.barcode,
      collectedBy: body.collectedBy,
      collectedAt: body.collectedAt,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        errorResponse(
          validation.errorCode || "VALIDATION_FAILED",
          validation.errorMessage || "Specimen collection validation failed"
        ),
        { status: 400 }
      );
    }

    const order = await prisma.diagnosticOrder.findUnique({
      where: { id: orderId },
      include: { patient: { include: { user: true } }, items: true },
    });

    if (!order) {
      return NextResponse.json(
        errorResponse("DIA_ORDER_NOT_FOUND", "Diagnostic order not found"),
        { status: 404 }
      );
    }

    const transitionCheck = canTransitionDiagnosticOrderStatus(
      order.status,
      DiagnosticOrderStatus.SAMPLE_COLLECTED
    );

    if (!transitionCheck.allowed) {
      return NextResponse.json(
        errorResponse(
          transitionCheck.errorCode || "DIA_INVALID_TRANSITION",
          transitionCheck.reason || "Cannot collect specimen in current order status"
        ),
        { status: 400 }
      );
    }

    const now = new Date();
    const updated = await prisma.diagnosticOrder.update({
      where: { id: orderId },
      data: {
        status: DiagnosticOrderStatus.SAMPLE_COLLECTED,
      },
      include: {
        patient: { include: { user: true } },
        items: true,
      },
    });

    return NextResponse.json(
      successResponse(
        {
          orderId: updated.id,
          orderNumber: updated.orderNumber,
          patientId: updated.patientId,
          patientName: updated.patient?.user?.name || "Patient",
          status: updated.status,
          specimenType: body.specimenType,
          barcode: body.barcode,
          collectedBy: body.collectedBy || "Lab Technician",
          collectedAt: (body.collectedAt ? new Date(body.collectedAt) : now).toISOString(),
          notes: body.notes || null,
        },
        "Specimen collected and order status updated to SAMPLE_COLLECTED"
      )
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("DIA_SPECIMEN_FAILED", "Failed to record specimen collection", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
