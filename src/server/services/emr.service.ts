import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "@/lib/audit";
import { EncounterStatus, AuditAction } from "@prisma/client";

export class EmrService {
  /**
   * Create or get in-progress encounter for patient & doctor
   */
  static async startEncounter(params: {
    patientId: string;
    doctorId: string;
    appointmentId?: string;
    tokenId?: string;
    chiefComplaint?: string;
    actorId?: string;
  }) {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const count = await prisma.encounter.count();
    const encounterNumber = `ENC-${today}-${String(count + 1).padStart(4, "0")}`;

    const encounter = await prisma.encounter.create({
      data: {
        encounterNumber,
        patientId: params.patientId,
        doctorId: params.doctorId,
        appointmentId: params.appointmentId || null,
        tokenId: params.tokenId || null,
        status: EncounterStatus.IN_PROGRESS,
        chiefComplaint: params.chiefComplaint,
      },
      include: {
        patient: { select: { mrn: true, user: { select: { name: true } }, allergies: true } },
        doctor: { select: { specialization: true, user: { select: { name: true } } } },
      },
    });

    await logAuditEvent({
      actorId: params.actorId,
      action: AuditAction.CREATE,
      entityType: "Encounter",
      entityId: encounter.id,
      changes: { after: { encounterNumber, status: "IN_PROGRESS" } },
    });

    return encounter;
  }

  /**
   * Record Patient Vitals (EMR-02)
   */
  static async recordVitals(params: {
    patientId: string;
    encounterId?: string;
    systolicBp?: number;
    diastolicBp?: number;
    heartRate?: number;
    respiratoryRate?: number;
    temperatureCelsius?: number;
    oxygenSaturation?: number;
    fastingGlucose?: number;
    heightCm?: number;
    weightKg?: number;
    recordedBy?: string;
  }) {
    let bmi: number | undefined = undefined;
    if (params.heightCm && params.weightKg && params.heightCm > 0) {
      const heightM = params.heightCm / 100;
      bmi = parseFloat((params.weightKg / (heightM * heightM)).toFixed(1));
    }

    const vitals = await prisma.vitalSign.create({
      data: {
        patientId: params.patientId,
        encounterId: params.encounterId || null,
        systolicBp: params.systolicBp,
        diastolicBp: params.diastolicBp,
        heartRate: params.heartRate,
        respiratoryRate: params.respiratoryRate,
        temperatureCelsius: params.temperatureCelsius,
        oxygenSaturation: params.oxygenSaturation,
        fastingGlucose: params.fastingGlucose,
        heightCm: params.heightCm,
        weightKg: params.weightKg,
        bmi,
        recordedBy: params.recordedBy,
      },
    });

    return vitals;
  }

  /**
   * Update SOAP Clinical Notes & Sign Encounter (EMR-04, EMR-06)
   */
  static async updateNotes(
    encounterId: string,
    notes: {
      subjective?: string;
      objective?: string;
      assessment?: string;
      plan?: string;
    }
  ) {
    const existing = await prisma.encounter.findUnique({
      where: { id: encounterId },
    });

    if (existing && existing.status === EncounterStatus.FINALIZED) {
      const error = new Error("EMR_NOTE_ALREADY_SIGNED");
      (error as any).status = 422;
      throw error;
    }

    return prisma.encounter.update({
      where: { id: encounterId },
      data: {
        subjectiveNotes: notes.subjective,
        objectiveNotes: notes.objective,
        assessmentNotes: notes.assessment,
        planNotes: notes.plan,
      },
    });
  }

  static async signEncounter(encounterId: string, actorId: string, actorName: string) {
    const encounter = await prisma.encounter.update({
      where: { id: encounterId },
      data: {
        status: EncounterStatus.FINALIZED,
        signedAt: new Date(),
        signedBy: `${actorName} (${actorId})`,
      },
    });

    await logAuditEvent({
      actorId,
      action: AuditAction.APPROVE,
      entityType: "Encounter",
      entityId: encounterId,
      changes: { after: { status: "FINALIZED", signedBy: actorName } },
    });

    return encounter;
  }

  static async getPatientContext(patientId: string) {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          user: { select: { name: true, gender: true, dateOfBirth: true } },
          allergies: true,
          vitalSigns: { take: 5, orderBy: { recordedAt: "desc" } },
          encounters: {
            take: 5,
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              encounterNumber: true,
              status: true,
              chiefComplaint: true,
              createdAt: true,
            },
          },
        },
      });
      return patient;
    } catch {
      return null;
    }
  }
}
