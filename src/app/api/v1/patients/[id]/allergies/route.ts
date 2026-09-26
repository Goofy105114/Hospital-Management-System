import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { validateAllergyInput } from "@/server/domain/encounter-state";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const patientId = params.id;

    const allergies = await prisma.allergy.findMany({
      where: { patientId },
      orderBy: { recordedAt: "desc" },
    });

    const formatted = allergies.map((a) => ({
      id: a.id,
      patientId: a.patientId,
      allergen: a.allergen,
      severity: a.severity,
      reaction: a.reaction,
      recordedAt: a.recordedAt.toISOString(),
    }));

    return NextResponse.json(
      successResponse(formatted, `Retrieved ${formatted.length} documented allergies`)
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("EMR_ALLERGIES_FETCH_FAILED", "Failed to retrieve allergies", {
        error: String(error),
      }),
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

    const validation = validateAllergyInput({
      patientId,
      allergen: body.allergen,
      severity: body.severity,
      reaction: body.reaction,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        errorResponse(
          validation.errorCode || "VALIDATION_FAILED",
          validation.errorMessage || "Invalid allergy record input"
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

    const created = await prisma.allergy.create({
      data: {
        patientId,
        allergen: body.allergen,
        severity: body.severity ? body.severity.toUpperCase() : "MODERATE",
        reaction: body.reaction || null,
      },
    });

    return NextResponse.json(
      successResponse(
        {
          id: created.id,
          patientId: created.patientId,
          allergen: created.allergen,
          severity: created.severity,
          reaction: created.reaction,
          recordedAt: created.recordedAt.toISOString(),
        },
        "Patient allergy documented successfully"
      ),
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse("EMR_ALLERGY_CREATE_FAILED", "Failed to document allergy", {
        error: String(error),
      }),
      { status: 500 }
    );
  }
}
