import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import {
  consolidatePatientClinicalHistory,
  validateMedicalHistoryInput,
} from "@/server/domain/encounter-state";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: {
        user: true,
        allergies: { orderBy: { recordedAt: "desc" } },
        medicalHistories: { orderBy: { diagnosedYear: "desc" } },
        prescriptions: {
          include: { items: { include: { medicine: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        errorResponse("EMR_PATIENT_NOT_FOUND", "Patient record not found"),
        { status: 404 }
      );
    }

    const consolidated = consolidatePatientClinicalHistory(
      patient.allergies,
      patient.medicalHistories,
      patient.prescriptions
    );

    const result = {
      patientId: patient.id,
      patientName: patient.user?.name || "Patient",
      patientMrn: patient.mrn,
      ...consolidated,
    };

    return NextResponse.json(
      successResponse(
        result,
        `Retrieved clinical history: ${consolidated.allergiesCount} allergies, ${consolidated.medicalConditionsCount} conditions, ${consolidated.activeMedicationsCount} active medications`
      )
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        "EMR_HISTORY_FETCH_FAILED",
        "Failed to retrieve patient clinical history",
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
    const patientId = params.id;
    const body = await req.json();

    const validation = validateMedicalHistoryInput({
      patientId,
      condition: body.condition,
      diagnosedYear: body.diagnosedYear ? Number(body.diagnosedYear) : undefined,
      notes: body.notes,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        errorResponse(
          validation.errorCode || "VALIDATION_FAILED",
          validation.errorMessage || "Invalid medical history input"
        ),
        { status: 400 }
      );
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        errorResponse("EMR_PATIENT_NOT_FOUND", "Patient record not found"),
        { status: 404 }
      );
    }

    const record = await prisma.medicalHistory.create({
      data: {
        patientId,
        condition: body.condition,
        diagnosedYear: body.diagnosedYear ? Number(body.diagnosedYear) : null,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(
      successResponse(
        {
          id: record.id,
          patientId: record.patientId,
          condition: record.condition,
          diagnosedYear: record.diagnosedYear,
          notes: record.notes,
        },
        "Medical history condition recorded successfully"
      ),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        "EMR_HISTORY_CREATE_FAILED",
        "Failed to record patient medical history",
        { error: String(error) }
      ),
      { status: 500 }
    );
  }
}
