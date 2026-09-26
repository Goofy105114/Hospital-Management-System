import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import {
  canDischargePatient,
  calculateStayDurationAndBedCharges,
} from "@/server/domain/inpatient-care";
import { BedStatus, AdmissionStatus, InvoiceStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admissionId = params.id;

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: {
        patient: { include: { user: true } },
        bed: true,
      },
    });

    if (!admission) {
      return NextResponse.json(
        errorResponse("IPD_ADMISSION_NOT_FOUND", "Inpatient admission not found"),
        { status: 404 }
      );
    }

    if (admission.status === AdmissionStatus.DISCHARGED) {
      return NextResponse.json(
        errorResponse(
          "IPD_ALREADY_DISCHARGED",
          "Patient has already been discharged from this admission"
        ),
        { status: 400 }
      );
    }

    // Enforce discharge readiness & summary existence (IPD-05 / SOW contract)
    const dischargeCheck = canDischargePatient({
      dischargeReadinessConfirmed: !!admission.dischargeSummary,
      hasDischargeSummary: !!admission.dischargeSummary,
    });

    if (!dischargeCheck.allowed) {
      return NextResponse.json(
        errorResponse(
          dischargeCheck.errorCode || "IPD_DISCHARGE_BLOCKED",
          dischargeCheck.errorMessage || "Discharge is currently blocked"
        ),
        { status: 422 }
      );
    }

    const dailyRate = Number(admission.bed?.dailyRate) || 250.0;
    const now = new Date();

    const billing = calculateStayDurationAndBedCharges({
      admittedAt: admission.admissionDate,
      dischargedAt: now,
      dailyRate,
    });

    // Generate consolidated final invoice (BIL-02 integration)
    const invoiceNumber = `INV-IPD-${Date.now().toString().slice(-6)}`;
    const finalInvoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        patientId: admission.patientId,
        totalAmount: billing.totalNetAmount,
        discountAmount: 0.0,
        taxAmount: 0.0,
        netAmount: billing.totalNetAmount,
        paidAmount: 0.0,
        balanceAmount: billing.totalNetAmount,
        status: InvoiceStatus.ISSUED,
      },
    });

    // Update admission to DISCHARGED
    await prisma.admission.update({
      where: { id: admissionId },
      data: {
        status: AdmissionStatus.DISCHARGED,
        dischargeDate: now,
      },
    });

    // Release bed status
    if (admission.bedId) {
      await prisma.bed.update({
        where: { id: admission.bedId },
        data: { status: BedStatus.AVAILABLE },
      });
    }

    return NextResponse.json(
      successResponse(
        {
          admissionId: admission.id,
          patientId: admission.patientId,
          patientName: admission.patient?.user?.name || "Patient",
          patientMrn: admission.patient?.mrn || "MRN-UNKNOWN",
          status: "DISCHARGED",
          dischargedAt: now.toISOString(),
          stayDays: billing.stayDays,
          releasedBedId: admission.bedId,
          finalInvoiceId: finalInvoice.id,
          invoiceNumber: finalInvoice.invoiceNumber,
          totalCharges: billing.totalNetAmount,
          message:
            "Patient successfully discharged, bed released, and final invoice generated.",
        },
        "Inpatient discharge completed successfully"
      )
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        "IPD_DISCHARGE_EXECUTION_FAILED",
        "Failed to execute patient discharge",
        { error: String(error) }
      ),
      { status: 500 }
    );
  }
}
