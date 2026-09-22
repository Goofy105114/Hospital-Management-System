import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

/**
 * PHA-05 — GET /api/v1/pharmacy/dispensing/:txId/label
 *
 * Returns a patient-facing dispensing label with dosage instructions.
 * Used for printed/digital patient handoff at the pharmacy counter.
 *
 * Roles: PHARMACIST, PATIENT (own dispensation), DOCTOR, NURSE, ADMIN.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { txId: string } }
) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (
    !requireRole(user, [
      UserRole.PHARMACIST,
      UserRole.PATIENT,
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.ADMIN,
    ])
  ) {
    return apiError("UNAUTHORIZED_ROLE", "Insufficient role to view dispensing label", 403);
  }

  try {
    const { txId } = params;

    const dispensation = await prisma.dispensation.findUnique({
      where: { id: txId },
      include: {
        patient: {
          select: {
            mrn: true,
            dob: true,
            user: { select: { name: true } },
          },
        },
        prescription: {
          select: {
            prescriptionNumber: true,
            validUntil: true,
            doctor: {
              select: {
                licenseNumber: true,
                user: { select: { name: true } },
              },
            },
          },
        },
        items: {
          include: {
            medicine: {
              select: { name: true, genericName: true, form: true, strength: true, unit: true },
            },
            prescriptionItem: {
              select: {
                dosage: true,
                frequency: true,
                durationDays: true,
                instructions: true,
                quantityDispensed: true,
              },
            },
          },
        },
      },
    });

    if (!dispensation) {
      return apiError("PHA_DISPENSATION_NOT_FOUND", "Dispensation record not found", 404);
    }

    // Scope check for PATIENT role
    if (user.role === UserRole.PATIENT) {
      const patientRecord = await prisma.patient.findUnique({
        where: { id: dispensation.patientId },
        select: { userId: true },
      });
      if (patientRecord?.userId !== user.sub) {
        return apiError(
          "PHA_LABEL_SCOPE_DENIED",
          "Patients may only view their own dispensing labels",
          403
        );
      }
    }

    const label = {
      dispensationId: txId,
      dispensedAt: dispensation.dispensedAt.toISOString(),
      prescriptionNumber: dispensation.prescription.prescriptionNumber,
      validUntil: dispensation.prescription.validUntil?.toISOString().slice(0, 10) ?? null,
      patient: {
        name: dispensation.patient.user.name,
        mrn: dispensation.patient.mrn,
        dob: dispensation.patient.dob.toISOString().slice(0, 10),
      },
      prescribedBy: dispensation.prescription.doctor.user.name,
      medicines: dispensation.items.map((item) => ({
        name: item.medicine.name,
        genericName: item.medicine.genericName,
        form: item.medicine.form,
        strength: item.medicine.strength,
        unit: item.medicine.unit,
        quantityDispensed: item.prescriptionItem.quantityDispensed,
        dosage: item.prescriptionItem.dosage,
        frequency: item.prescriptionItem.frequency,
        durationDays: item.prescriptionItem.durationDays,
        instructions: item.prescriptionItem.instructions ?? "Take as directed by your physician.",
      })),
      facility: "Going Merry Memorial Medical Center",
      hotline: "+1 (800) 555-MERRY",
      warnings: [
        "Keep out of reach of children.",
        "Store in a cool, dry place away from direct sunlight.",
        "Complete the full course as prescribed.",
      ],
    };

    return apiSuccess(label);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to generate dispensing label", 500);
  }
}
