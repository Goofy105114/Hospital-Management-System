import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-envelope";
import { PrescriptionStatus } from "@prisma/client";
import { getAuthUser, requireRole } from "@/lib/auth";
import { apiError } from "@/lib/api-envelope";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return apiError("UNAUTHENTICATED", "Authentication required", 401);
    if (!requireRole(auth, [UserRole.PHARMACIST])) {
      return apiError("UNAUTHORIZED_ROLE", "Pharmacist role required", 403);
    }
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as PrescriptionStatus | null;

    const prescriptions = await prisma.prescription.findMany({
      where: {
        ...(status
          ? { status }
          : {
              status: {
                in: [
                  PrescriptionStatus.FINALIZED,
                  PrescriptionStatus.PENDING,
                  PrescriptionStatus.ON_HOLD,
                ],
              },
            }),
      },
      include: {
        patient: {
          select: { id: true, mrn: true, user: { select: { name: true } }, allergies: true },
        },
        doctor: { select: { specialization: true, user: { select: { name: true } } } },
        items: { include: { medicine: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
    });

    const formatted = prescriptions.map((p) => ({
      id: p.id,
      prescriptionNumber: p.prescriptionNumber,
      encounterId: p.encounterId,
      patientId: p.patient.id,
      patientName: p.patient.user.name,
      patientMrn: p.patient.mrn,
      doctorName: p.doctor.user.name,
      status: p.status,
      priority: p.priority,
      validUntil:
        p.validUntil?.toISOString() ??
        new Date(p.createdAt.getTime() + 30 * 86_400_000).toISOString(),
      waitMinutes: Math.max(0, Math.floor((Date.now() - p.createdAt.getTime()) / 60_000)),
      createdAt: p.createdAt.toISOString(),
      itemsCount: p.items.length,
      items: p.items.map((i) => ({
        id: i.id,
        medicineId: i.medicineId,
        medicineName: i.medicine.name,
        dosage: i.dosage,
        frequency: i.frequency,
        durationDays: i.durationDays,
        quantityPrescribed: i.quantityPrescribed,
        quantityDispensed: i.quantityDispensed,
        instructions: i.instructions,
      })),
    }));

    return apiSuccess(formatted);
  } catch (error) {
    console.error("[PHARMACY QUEUE ERROR]", error);
    return apiError("PHA_QUEUE_UNAVAILABLE", "Unable to load pharmacy queue", 500);
  }
}
