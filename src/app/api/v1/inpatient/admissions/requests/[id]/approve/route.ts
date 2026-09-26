import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { validateAdmissionApproval } from "@/server/domain/inpatient-care";
import { BedStatus, AdmissionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admissionId = params.id;
    const body = await req.json().catch(() => ({}));

    const validation = validateAdmissionApproval({
      requestId: admissionId,
      approverRole: body.approverRole || "DOCTOR",
      approverId: body.approverId,
      bedId: body.bedId,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        errorResponse(
          validation.errorCode || "VALIDATION_FAILED",
          validation.errorMessage || "Admission approval validation failed"
        ),
        { status: 400 }
      );
    }

    const admission = await prisma.admission.findUnique({
      where: { id: admissionId },
      include: { bed: true, patient: { include: { user: true } } },
    });

    if (!admission) {
      return NextResponse.json(
        errorResponse("IPD_ADMISSION_NOT_FOUND", "Admission record not found"),
        { status: 404 }
      );
    }

    // Check if new bed assignment is requested
    let bedId = body.bedId || admission.bedId;
    if (body.bedId && body.bedId !== admission.bedId) {
      const targetBed = await prisma.bed.findUnique({ where: { id: body.bedId } });
      if (!targetBed || targetBed.status !== BedStatus.AVAILABLE) {
        return NextResponse.json(
          errorResponse("IPD_BED_UNAVAILABLE", "Target bed is not available"),
          { status: 409 }
        );
      }
    }

    const updated = await prisma.$transaction([
      prisma.bed.update({
        where: { id: bedId },
        data: { status: BedStatus.OCCUPIED },
      }),
      prisma.admission.update({
        where: { id: admissionId },
        data: {
          bedId,
          status: AdmissionStatus.ADMITTED,
          ...(body.admissionDiagnosis
            ? { admissionDiagnosis: body.admissionDiagnosis }
            : {}),
        },
        include: {
          patient: { include: { user: true } },
          admittingDoctor: { include: { user: true } },
          bed: { include: { ward: true } },
        },
      }),
    ]);

    const updatedAdmission = updated[1];

    return NextResponse.json(
      successResponse(
        {
          id: updatedAdmission.id,
          admissionNumber: updatedAdmission.admissionNumber,
          patientId: updatedAdmission.patientId,
          patientName: updatedAdmission.patient?.user?.name || "Patient",
          status: updatedAdmission.status,
          bedId: updatedAdmission.bedId,
          bedNumber: updatedAdmission.bed?.bedNumber,
          wardName: updatedAdmission.bed?.ward?.name,
          message: "Admission successfully approved and bed confirmed",
        },
        "Admission approved successfully"
      )
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("IPD_APPROVAL_FAILED", "Failed to approve admission", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
