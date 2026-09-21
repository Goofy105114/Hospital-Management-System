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
