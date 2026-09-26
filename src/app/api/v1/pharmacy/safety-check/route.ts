import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-envelope";
import { SafetyCheckService } from "@/lib/safety-check";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const medicines = Array.isArray(body.medicines) ? body.medicines : [];
    if (medicines.length === 0) {
      return NextResponse.json(
        errorResponse(
          "PHA_MEDICINES_REQUIRED",
          "At least one medicine is required to perform clinical safety checks"
        ),
        { status: 400 }
      );
    }

    let patientAllergies: Array<{ allergen: string; severity: string }> = Array.isArray(
      body.allergies
    )
      ? body.allergies
      : [];

    let existingMedications: string[] = Array.isArray(body.existingMedications)
      ? body.existingMedications
      : [];

    // If patientId provided, load real documented allergies and active prescriptions
    if (body.patientId) {
      const patient = await prisma.patient.findUnique({
        where: { id: body.patientId },
        include: {
          allergies: true,
          prescriptions: {
            where: {
              status: { in: ["FINALIZED", "DISPENSED", "PARTIALLY_DISPENSED"] },
            },
            include: { items: { include: { medicine: true } } },
            take: 5,
          },
        },
      });

      if (patient) {
        if (patientAllergies.length === 0 && patient.allergies) {
          patientAllergies = patient.allergies.map((a) => ({
            allergen: a.allergen,
            severity: a.severity,
          }));
        }

        if (existingMedications.length === 0 && patient.prescriptions) {
          existingMedications = patient.prescriptions.flatMap((rx) =>
            rx.items.map((it) => it.medicine.name)
          );
        }
      }
    }

    const safetyResult = SafetyCheckService.checkPrescriptionSafety(
      medicines,
      patientAllergies,
      existingMedications
    );

    return NextResponse.json(
      successResponse(
        safetyResult,
        safetyResult.hasConflicts
          ? `Clinical safety check found ${
              safetyResult.allergyConflicts.length +
              safetyResult.interactionWarnings.length +
              safetyResult.duplicateTherapies.length
            } warning(s)`
          : "Prescription passed all clinical safety checks cleanly"
      )
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse(
        "PHA_SAFETY_CHECK_FAILED",
        "Failed to perform clinical medication safety check",
        { error: String(error) }
      ),
      { status: 500 }
    );
  }
}
