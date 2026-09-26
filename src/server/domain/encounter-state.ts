import { EncounterStatus } from "@prisma/client";

export const ENCOUNTER_TRANSITIONS: Record<EncounterStatus, EncounterStatus[]> = {
  IN_PROGRESS: [EncounterStatus.FINALIZED],
  FINALIZED: [EncounterStatus.AMENDED],
  AMENDED: [],
};

export function canTransitionEncounter(
  from: EncounterStatus,
  to: EncounterStatus
): boolean {
  return ENCOUNTER_TRANSITIONS[from]?.includes(to) ?? false;
}

export function canEditEncounterNotes(status: EncounterStatus | string): boolean {
  return status === EncounterStatus.IN_PROGRESS;
}

export function validateEncounterCreation(input: {
  patientId?: string;
  doctorId?: string;
}): { isValid: boolean; errorCode?: string; errorMessage?: string } {
  if (!input.patientId || typeof input.patientId !== "string") {
    return {
      isValid: false,
      errorCode: "EMR_INVALID_PATIENT",
      errorMessage: "Valid patientId is required to initiate a clinical encounter",
    };
  }
  if (!input.doctorId || typeof input.doctorId !== "string") {
    return {
      isValid: false,
      errorCode: "EMR_INVALID_DOCTOR",
      errorMessage: "Valid doctorId is required to initiate a clinical encounter",
    };
  }
  return { isValid: true };
}

// ---------------------------------------------------------------------------
// EMR-03 — Medical, medication and allergy history
// ---------------------------------------------------------------------------

export const VALID_ALLERGY_SEVERITIES = ["MILD", "MODERATE", "SEVERE", "LIFE_THREATENING"];

export interface AllergyInput {
  patientId?: string;
  allergen?: string;
  severity?: string;
  reaction?: string;
}

export interface MedicalHistoryInput {
  patientId?: string;
  condition?: string;
  diagnosedYear?: number;
  notes?: string;
}

export function validateAllergyInput(input: AllergyInput): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (!input.patientId || typeof input.patientId !== "string") {
    return {
      isValid: false,
      errorCode: "EMR_INVALID_PATIENT",
      errorMessage: "Patient ID is required to record an allergy",
    };
  }
  if (!input.allergen || typeof input.allergen !== "string" || input.allergen.trim() === "") {
    return {
      isValid: false,
      errorCode: "EMR_ALLERGEN_REQUIRED",
      errorMessage: "Allergen name is required",
    };
  }
  if (
    input.severity &&
    !VALID_ALLERGY_SEVERITIES.includes(input.severity.toUpperCase())
  ) {
    return {
      isValid: false,
      errorCode: "EMR_INVALID_SEVERITY",
      errorMessage: `Severity must be one of: ${VALID_ALLERGY_SEVERITIES.join(", ")}`,
    };
  }
  return { isValid: true };
}

export function validateMedicalHistoryInput(input: MedicalHistoryInput): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (!input.patientId || typeof input.patientId !== "string") {
    return {
      isValid: false,
      errorCode: "EMR_INVALID_PATIENT",
      errorMessage: "Patient ID is required to record medical history",
    };
  }
  if (!input.condition || typeof input.condition !== "string" || input.condition.trim() === "") {
    return {
      isValid: false,
      errorCode: "EMR_CONDITION_REQUIRED",
      errorMessage: "Medical condition name is required",
    };
  }
  const currentYear = new Date().getFullYear();
  if (
    input.diagnosedYear !== undefined &&
    (!Number.isInteger(input.diagnosedYear) || input.diagnosedYear < 1900 || input.diagnosedYear > currentYear)
  ) {
    return {
      isValid: false,
      errorCode: "EMR_INVALID_DIAGNOSED_YEAR",
      errorMessage: `Diagnosed year must be a valid integer between 1900 and ${currentYear}`,
    };
  }
  return { isValid: true };
}

export function consolidatePatientClinicalHistory(
  allergies: Array<{ id: string; allergen: string; severity: string; reaction?: string | null; recordedAt: Date | string }>,
  medicalHistories: Array<{ id: string; condition: string; diagnosedYear?: number | null; notes?: string | null }>,
  prescriptions: Array<{
    id: string;
    prescriptionNumber: string;
    createdAt: Date | string;
    status: string;
    items: Array<{
      medicine: { name: string };
      dosage: string;
      frequency: string;
      durationDays?: number | null;
      duration?: string | null;
    }>;
  }>
) {
  const activeMedications = prescriptions
    .filter((p) => ["FINALIZED", "DISPENSED", "PARTIALLY_DISPENSED"].includes(p.status))
    .flatMap((p) =>
      p.items.map((it) => ({
        prescriptionId: p.id,
        prescriptionNumber: p.prescriptionNumber,
        medicineName: it.medicine.name,
        dosage: it.dosage,
        frequency: it.frequency,
        duration: it.duration || (it.durationDays ? `${it.durationDays} days` : "As directed"),
        prescribedDate: new Date(p.createdAt).toISOString(),
      }))
    );

  const allergyList = allergies.map((a) => ({
    id: a.id,
    allergen: a.allergen,
    severity: a.severity,
    reaction: a.reaction || null,
    recordedAt: new Date(a.recordedAt).toISOString(),
  }));

  const historyList = medicalHistories.map((h) => ({
    id: h.id,
    condition: h.condition,
    diagnosedYear: h.diagnosedYear || null,
    notes: h.notes || null,
  }));

  return {
    allergiesCount: allergyList.length,
    medicalConditionsCount: historyList.length,
    activeMedicationsCount: activeMedications.length,
    allergies: allergyList,
    medicalHistory: historyList,
    medicationHistory: activeMedications,
  };
}

