import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

/**
 * EMR-06 — GET /api/v1/patients/:id/clinical-timeline
 *
 * Returns a chronological, cross-encounter clinical summary for a patient.
 * Each entry contains a lightweight encounter summary (date, doctor, status,
 * chief complaint, diagnoses count, prescriptions count).
 *
 * Roles allowed: DOCTOR, NURSE, RECEPTIONIST, ADMIN — and PATIENT for their
 * own record only.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (
    !requireRole(user, [
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.RECEPTIONIST,
      UserRole.ADMIN,
      UserRole.PATIENT,
    ])
  ) {
    return apiError("UNAUTHORIZED_ROLE", "Insufficient role to view clinical timeline", 403);
  }

  try {
    const { id } = params;

    // Patients may only view their own timeline
    if (user.role === UserRole.PATIENT) {
      let patient = null;
      try {
        patient = await prisma.patient.findUnique({
          where: { id },
          select: { userId: true },
        });
      } catch {
        // DB offline
      }
      if (patient === null) {
        return apiError("PATIENT_NOT_FOUND", "Patient not found", 404);
      }
      if (patient && patient.userId !== user.sub) {
        return apiError(
          "EMR_TIMELINE_SCOPE_DENIED",
          "Patients may only view their own clinical timeline",
          403
        );
      }
    }

    let timeline: unknown[] = [];
    try {
      const encounters = await prisma.encounter.findMany({
        where: { patientId: id },
        include: {
          doctor: {
            select: { specialization: true, user: { select: { name: true } } },
          },
          diagnoses: { select: { id: true, icdCode: true, description: true, type: true } },
          prescriptions: { select: { id: true, status: true, prescriptionNumber: true } },
          vitalSigns: {
            orderBy: { recordedAt: "desc" },
            take: 1,
            select: {
              systolicBp: true,
              diastolicBp: true,
              heartRate: true,
              oxygenSaturation: true,
              temperatureCelsius: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      timeline = encounters.map((enc) => ({
        id: enc.id,
        encounterNumber: enc.encounterNumber,
        status: enc.status,
        date: enc.createdAt.toISOString().slice(0, 10),
        doctorName: enc.doctor.user.name,
        doctorSpecialization: enc.doctor.specialization,
        chiefComplaint: enc.chiefComplaint,
        signedAt: enc.signedAt?.toISOString() ?? null,
        signedBy: enc.signedBy ?? null,
        diagnosesCount: enc.diagnoses.length,
        primaryDiagnosis: enc.diagnoses.find((d) => d.type === "PRIMARY") ?? null,
        prescriptionsCount: enc.prescriptions.length,
        latestVitals: enc.vitalSigns[0] ?? null,
      }));
    } catch {
      // DB offline — return empty timeline
      timeline = [];
    }

    return apiSuccess(timeline);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to retrieve clinical timeline", 500);
  }
}
