import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import {
  validateAdmissionRequestInput,
  generateAdmissionNumber,
} from "@/server/domain/inpatient-care";
import { BedStatus, AdmissionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");

    const admissions = await prisma.admission.findMany({
      where: {
        ...(status ? { status: status as AdmissionStatus } : {}),
        ...(patientId ? { patientId } : {}),
      },
      include: {
        patient: { include: { user: true } },
        admittingDoctor: { include: { user: true } },
        bed: { include: { ward: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = admissions.map((adm) => ({
      id: adm.id,
      admissionNumber: adm.admissionNumber,
      patientId: adm.patientId,
      patientName: adm.patient?.user?.name || "Patient",
      patientMrn: adm.patient?.mrn || "MRN-UNKNOWN",
      admittingDoctorId: adm.admittingDoctorId,
      doctorName: adm.admittingDoctor?.user?.name || "Doctor",
      bedId: adm.bedId,
      bedNumber: adm.bed?.bedNumber || "Unassigned",
      wardName: adm.bed?.ward?.name || "General",
      dailyRate: Number(adm.bed?.dailyRate) || 250.0,
      admissionDate: adm.admissionDate.toISOString(),
      dischargeDate: adm.dischargeDate?.toISOString() || null,
      admissionDiagnosis: adm.admissionDiagnosis,
      dischargeSummary: adm.dischargeSummary,
      status: adm.status,
      createdAt: adm.createdAt.toISOString(),
    }));

    return NextResponse.json(
      successResponse(formatted, `Retrieved ${formatted.length} admissions`)
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("IPD_FETCH_FAILED", "Failed to fetch admissions", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateAdmissionRequestInput({
      patientId: body.patientId,
      encounterId: body.encounterId,
      admittingDoctorId: body.admittingDoctorId,
      reasonForAdmission: body.reasonForAdmission,
      admittingDiagnosis: body.admittingDiagnosis,
      preferredWardType: body.preferredWardType,
      priority: body.priority,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        errorResponse(
          validation.errorCode || "VALIDATION_FAILED",
          validation.errorMessage || "Invalid admission request input"
        ),
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { id: body.patientId },
      include: { user: true },
    });

    if (!patient) {
      return NextResponse.json(
        errorResponse("IPD_PATIENT_NOT_FOUND", "Patient not found"),
        { status: 404 }
      );
    }

    // Check doctor or assign first available doctor if not specified
    let doctorId = body.admittingDoctorId;
    if (!doctorId) {
      const firstDoc = await prisma.doctor.findFirst();
      if (!firstDoc) {
        return NextResponse.json(
          errorResponse("IPD_DOCTOR_NOT_FOUND", "No attending doctor available"),
          { status: 400 }
        );
      }
      doctorId = firstDoc.id;
    }

    // Find available bed
    let bedId = body.bedId;
    if (!bedId) {
      const availableBed = await prisma.bed.findFirst({
        where: { status: BedStatus.AVAILABLE },
        include: { ward: true },
      });
      if (!availableBed) {
        return NextResponse.json(
          errorResponse(
            "IPD_NO_BEDS_AVAILABLE",
            "No available beds found for inpatient admission request"
          ),
          { status: 409 }
        );
      }
      bedId = availableBed.id;
    } else {
      const specifiedBed = await prisma.bed.findUnique({ where: { id: bedId } });
      if (!specifiedBed || specifiedBed.status !== BedStatus.AVAILABLE) {
        return NextResponse.json(
          errorResponse(
            "IPD_BED_UNAVAILABLE",
            "Specified bed is not available for admission"
          ),
          { status: 409 }
        );
      }
    }

    const admissionNumber = generateAdmissionNumber();

    // Create admission and mark bed OCCUPIED
    const [admission] = await prisma.$transaction([
      prisma.admission.create({
        data: {
          admissionNumber,
          patientId: patient.id,
          admittingDoctorId: doctorId,
          bedId,
          admissionDiagnosis: body.admittingDiagnosis || body.reasonForAdmission,
          status: AdmissionStatus.ADMITTED,
        },
        include: {
          patient: { include: { user: true } },
          admittingDoctor: { include: { user: true } },
          bed: { include: { ward: true } },
        },
      }),
      prisma.bed.update({
        where: { id: bedId },
        data: { status: BedStatus.OCCUPIED },
      }),
    ]);

    return NextResponse.json(
      successResponse(
        {
          id: admission.id,
          admissionNumber: admission.admissionNumber,
          patientId: admission.patientId,
          patientName: admission.patient?.user?.name || "Patient",
          patientMrn: admission.patient?.mrn || "MRN-UNKNOWN",
          admittingDoctorId: admission.admittingDoctorId,
          doctorName: admission.admittingDoctor?.user?.name || "Doctor",
          bedId: admission.bedId,
          bedNumber: admission.bed?.bedNumber || "Assigned",
          wardName: admission.bed?.ward?.name || "General Ward",
          dailyRate: Number(admission.bed?.dailyRate) || 250.0,
          admissionDate: admission.admissionDate.toISOString(),
          admissionDiagnosis: admission.admissionDiagnosis,
          status: admission.status,
          createdAt: admission.createdAt.toISOString(),
        },
        "Inpatient admission request processed and admitted successfully"
      ),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("IPD_ADMISSION_FAILED", "Failed to process admission request", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
