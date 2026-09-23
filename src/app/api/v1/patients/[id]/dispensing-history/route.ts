import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

/**
 * PHA-05 — GET /api/v1/patients/:id/dispensing-history
 *
 * Returns all dispensation records for a patient, ordered most-recent first.
 * Feeds EMR-03's medication history view.
 *
 * PATIENT role is scoped to their own record only.
 * Clinical/pharmacy staff may query any patient.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (
    !requireRole(user, [
      UserRole.PATIENT,
      UserRole.PHARMACIST,
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.RECEPTIONIST,
      UserRole.ADMIN,
    ])
  ) {
    return apiError("UNAUTHORIZED_ROLE", "Insufficient role to view dispensing history", 403);
  }

  try {
    const { id } = params;

    // Patients may only view their own history
    if (user.role === UserRole.PATIENT) {
      const patient = await prisma.patient.findUnique({
        where: { id },
        select: { userId: true },
      });
      if (!patient) {
        return apiError("PATIENT_NOT_FOUND", "Patient not found", 404);
      }
      if (patient.userId !== user.sub) {
        return apiError(
          "PHA_HISTORY_SCOPE_DENIED",
          "Patients may only view their own dispensing history",
          403
        );
      }
    }

    const dispensations = await prisma.dispensation.findMany({
      where: { patientId: id },
      include: {
        prescription: {
          select: {
            prescriptionNumber: true,
            doctor: { select: { user: { select: { name: true } } } },
          },
        },
        items: {
          include: {
            medicine: { select: { name: true, genericName: true, form: true, strength: true } },
            prescriptionItem: { select: { dosage: true, frequency: true, durationDays: true, instructions: true } },
          },
        },
      },
      orderBy: { dispensedAt: "desc" },
    });

    const history = dispensations.map((d) => ({
      dispensationId: d.id,
      prescriptionNumber: d.prescription.prescriptionNumber,
      prescribingDoctor: d.prescription.doctor.user.name,
      dispensedAt: d.dispensedAt.toISOString(),
      totalAmount: Number(d.totalAmount),
      status: d.status,
      items: d.items.map((item) => ({
        medicineName: item.medicine.name,
        genericName: item.medicine.genericName,
        form: item.medicine.form,
        strength: item.medicine.strength,
        quantityDispensed: item.quantityDispensed,
        unitPrice: Number(item.unitPrice),
        dosage: item.prescriptionItem.dosage,
        frequency: item.prescriptionItem.frequency,
        durationDays: item.prescriptionItem.durationDays,
        instructions: item.prescriptionItem.instructions,
      })),
    }));

    return apiSuccess(history);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to retrieve dispensing history", 500);
  }
}
