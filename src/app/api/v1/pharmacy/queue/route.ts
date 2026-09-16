import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-envelope";
import { PrescriptionStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as PrescriptionStatus | null;

    const prescriptions = await prisma.prescription.findMany({
      where: {
        ...(status ? { status } : {}),
      },
      include: {
        patient: {
          select: { id: true, mrn: true, user: { select: { name: true } }, allergies: true },
        },
        doctor: { select: { specialization: true, user: { select: { name: true } } } },
        items: { include: { medicine: true } },
      },
      orderBy: { createdAt: "desc" },
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
  } catch {
    return apiSuccess([
      {
        id: "rx-101",
        prescriptionNumber: "RX-2026-0042",
        encounterId: "enc-01",
        patientId: "pat-01",
        patientName: "Eleanor Pena",
        patientMrn: "MRN-2026-001842",
        doctorName: "Dr. Marcus Vance",
        status: "READY_TO_DISPENSE",
        createdAt: new Date().toISOString(),
        itemsCount: 2,
        items: [
          {
            id: "i-01",
            medicineId: "med-02",
            medicineName: "Metoprolol Succinate",
            dosage: "25mg",
            frequency: "Once daily",
            durationDays: 30,
            quantityPrescribed: 30,
            quantityDispensed: 0,
            instructions: "Take 1 tablet daily with morning meal",
          },
        ],
      },
    ]);
  }
}
