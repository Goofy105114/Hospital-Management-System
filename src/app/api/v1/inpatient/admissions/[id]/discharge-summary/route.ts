import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { validateDischargeSummaryInput } from "@/server/domain/inpatient-care";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admissionId = params.id;

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: {
        patient: { include: { user: true } },
        admittingDoctor: { include: { user: true } },
      },
    });

    if (!admission) {
      return NextResponse.json(
        errorResponse("IPD_ADMISSION_NOT_FOUND", "Inpatient admission not found"),
        { status: 404 }
      );
    }

    const summaryData = {
      admissionId: admission.id,
      patientId: admission.patientId,
      patientName: admission.patient?.user?.name || "Patient",
      patientMrn: admission.patient?.mrn || "MRN-UNKNOWN",
      doctorId: admission.admittingDoctorId,
      doctorName:
        admission.admittingDoctor?.user?.name || "Attending Physician",
      admittingDiagnosis:
        admission.admissionDiagnosis || "Acute clinical condition",
      finalDiagnosis:
        admission.dischargeSummary ||
        admission.admissionDiagnosis ||
        "Resolved on treatment",
      treatmentSummary:
        admission.dischargeSummary ||
        "Inpatient monitoring, therapeutic care, and clinical stabilization completed.",
      dischargeCondition: "Stable / Recovered",
      hasDischargeSummary: !!admission.dischargeSummary,
      dischargeReadinessConfirmed: !!admission.dischargeSummary,
      followUpInstructions:
        "Take prescribed home medications as directed. Schedule outpatient follow-up in 7 days.",
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    return NextResponse.json(successResponse(summaryData));
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        "IPD_DISCHARGE_SUMMARY_FETCH_FAILED",
        "Failed to retrieve discharge summary",
        { error: String(error) }
      ),
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admissionId = params.id;
    const body = await req.json();
    const {
      summaryText,
      admittingDiagnosis,
      finalDiagnosis,
      treatmentSummary,
      dischargeCondition,
      followUpInstructions,
      followUpDate,
      authorRole = "DOCTOR",
    } = body;

    const validation = validateDischargeSummaryInput({
      admissionId,
      summaryText: summaryText || treatmentSummary,
      authorRole,
      followUpInstructions,
      followUpDate,
    });

    if (!validation.isValid) {
      const status = validation.errorCode === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json(
        errorResponse(
          validation.errorCode || "IPD_INVALID_DISCHARGE_SUMMARY",
          validation.errorMessage || "Invalid discharge summary payload"
        ),
        { status }
      );
    }

    const clinicalSummary =
      summaryText ||
      `Final Diagnosis: ${finalDiagnosis || "Clinically stable"}. Treatment: ${treatmentSummary || "Managed"}. Condition: ${dischargeCondition || "Good"}. Instructions: ${followUpInstructions || "Follow-up"}`;

    const updatedAdmission = await prisma.admission.update({
      where: { id: admissionId },
      data: {
        dischargeSummary: clinicalSummary,
      },
      include: {
        patient: { include: { user: true } },
        admittingDoctor: { include: { user: true } },
      },
    });

    return NextResponse.json(
      successResponse(
        {
          id: `ds-${Date.now()}`,
          admissionId: updatedAdmission.id,
          patientId: updatedAdmission.patientId,
          patientName: updatedAdmission.patient?.user?.name || "Patient",
          patientMrn: updatedAdmission.patient?.mrn || "MRN-UNKNOWN",
          doctorId: updatedAdmission.admittingDoctorId,
          doctorName:
            updatedAdmission.admittingDoctor?.user?.name ||
            "Attending Physician",
          admittingDiagnosis:
            admittingDiagnosis ||
            updatedAdmission.admissionDiagnosis ||
            "Clinical admission",
          finalDiagnosis: finalDiagnosis || "Resolved on treatment",
          treatmentSummary: clinicalSummary,
          dischargeCondition: dischargeCondition || "Stable",
          followUpInstructions:
            followUpInstructions || "Routine follow-up in 1 week",
          followUpDate: followUpDate || null,
          createdAt: new Date().toISOString(),
        },
        "Discharge summary authored and saved successfully"
      ),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        "IPD_DISCHARGE_SUMMARY_SAVE_FAILED",
        "Failed to save discharge summary",
        { error: String(error) }
      ),
      { status: 500 }
    );
  }
}
