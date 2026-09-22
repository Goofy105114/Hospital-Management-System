import { NextRequest } from "next/server";
import { EmrService } from "@/server/services/emr.service";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { validateEncounterCreation } from "@/server/domain/encounter-state";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, encounterId, notes, diagnosis, prescription, labOrders, doctorId, patientId } =
      body;

    if (action === "SIGN") {
      let targetEncounterId = encounterId;
      if (!targetEncounterId) {
        let resolvedDoctorId = doctorId;
        if (!resolvedDoctorId) {
          const doc = await prisma.doctor.findFirst({ where: { isActive: true } });
          resolvedDoctorId = doc?.id;
        }
        let resolvedPatientId = patientId;
        if (!resolvedPatientId) {
          const pat = await prisma.patient.findFirst({ where: { deletedAt: null } });
          resolvedPatientId = pat?.id;
        }

        if (resolvedPatientId && resolvedDoctorId) {
          const existing = await prisma.encounter.findFirst({
            where: { patientId: resolvedPatientId, status: "IN_PROGRESS" },
            orderBy: { createdAt: "desc" },
          });
          if (existing) {
            targetEncounterId = existing.id;
          } else {
            const started = await EmrService.startEncounter({
              patientId: resolvedPatientId,
              doctorId: resolvedDoctorId,
              chiefComplaint: notes?.subjective || "Clinical consultation",
            });
            targetEncounterId = started.id;
          }
        }
      }

      if (!targetEncounterId) {
        return apiError("EMR_MISSING_ENCOUNTER_ID", "encounterId or patientId is required to sign encounter", 400);
      }
      try {
        if (notes) {
          await EmrService.updateNotes(targetEncounterId, notes);
        }
        const res = await EmrService.signEncounter(
          targetEncounterId,
          doctorId || "doc-001",
          "Attending Physician"
        );
        return apiSuccess(res);
      } catch (e: any) {
        return apiError("EMR_SIGN_FAILED", e?.message || "Failed to sign encounter", 500);
      }
    }

    if (action === "SAVE_DRAFT") {
      if (encounterId) {
        try {
          const existing = await prisma.encounter.findUnique({
            where: { id: encounterId },
          });
          if (existing && existing.status === "FINALIZED") {
            return apiError(
              "EMR_NOTE_ALREADY_SIGNED",
              "Encounter notes have already been signed and cannot be modified directly",
              422
            );
          }
          if (notes) {
            await EmrService.updateNotes(encounterId, notes);
          }
        } catch (e: any) {
          if (e?.message === "EMR_NOTE_ALREADY_SIGNED") {
            return apiError(
              "EMR_NOTE_ALREADY_SIGNED",
              "Encounter notes have already been signed and cannot be modified directly",
              422
            );
          }
        }
      }
      return apiSuccess({
        encounterId,
        status: "IN_PROGRESS",
        updatedAt: new Date().toISOString(),
        message: "Clinical encounter draft saved",
      });
    }

    // Default: start encounter
    const validation = validateEncounterCreation({ patientId, doctorId });
    if (!validation.isValid && !notes) {
      return apiError(
        validation.errorCode || "EMR_INVALID_INPUT",
        validation.errorMessage || "Invalid encounter parameters",
        400
      );
    }

    try {
      const enc = await EmrService.startEncounter({
        patientId,
        doctorId,
        chiefComplaint: notes?.subjective || "Clinical evaluation",
      });
      return apiSuccess(enc, undefined, 201);
    } catch (e: any) {
      return apiError("EMR_START_FAILED", e?.message || "Failed to start clinical encounter", 500);
    }
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to process encounter", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const encounterId = searchParams.get("encounterId");
    const patientId = searchParams.get("patientId");

    if (patientId) {
      const context = await EmrService.getPatientContext(patientId);
      if (context) {
        return apiSuccess(context);
      }
      return apiError("PATIENT_NOT_FOUND", "Patient medical record not found", 404);
    }

    if (encounterId) {
      const enc = await prisma.encounter.findFirst({
        where: {
          OR: [{ id: encounterId }, { encounterNumber: encounterId }],
        },
        include: {
          patient: {
            select: {
              mrn: true,
              user: { select: { name: true } },
              dob: true,
              gender: true,
            },
          },
          doctor: {
            select: {
              specialization: true,
              user: { select: { name: true } },
              department: { select: { name: true } },
            },
          },
          vitalSigns: { take: 1, orderBy: { recordedAt: "desc" } },
          diagnoses: true,
          prescriptions: { include: { items: { include: { medicine: true } } } },
        },
      });
      if (enc) return apiSuccess(enc);
    }

    const encounters = await prisma.encounter.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(encounters);
  } catch (error) {
    return apiError("EMR_FETCH_FAILED", "Failed to retrieve encounter data", 500);
  }
}
