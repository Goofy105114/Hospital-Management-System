export interface InpatientCareNoteInput {
  admissionId?: string;
  note?: string;
  authorRole?: string;
}

export interface MedicationAdministrationInput {
  admissionId?: string;
  prescriptionItemId?: string;
  administeredAt?: string | Date;
  doseGiven?: string | number;
  administeredBy?: string;
}

export interface DischargeReadinessInput {
  admissionId?: string;
  ready: boolean;
  actorRole: string;
}

export interface DischargeBlockerCheck {
  dischargeReadinessConfirmed: boolean;
  hasDischargeSummary: boolean;
}

export function validateCareNoteCreation(input: InpatientCareNoteInput): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (!input.admissionId || typeof input.admissionId !== "string") {
    return {
      isValid: false,
      errorCode: "IPD_INVALID_ADMISSION",
      errorMessage: "A valid admissionId is required to record care notes",
    };
  }
  if (!input.note || typeof input.note !== "string" || input.note.trim() === "") {
    return {
      isValid: false,
      errorCode: "IPD_NOTE_EMPTY",
      errorMessage: "Care note text cannot be empty",
    };
  }
  return { isValid: true };
}

export function validateMedicationAdministration(input: MedicationAdministrationInput): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (!input.admissionId) {
    return {
      isValid: false,
      errorCode: "IPD_INVALID_ADMISSION",
      errorMessage: "Admission ID is required for medication administration",
    };
  }
  if (!input.prescriptionItemId) {
    return {
      isValid: false,
      errorCode: "IPD_INVALID_PRESCRIPTION_ITEM",
      errorMessage: "Valid prescriptionItemId is required for MAR logging",
    };
  }
  if (!input.administeredAt) {
    return {
      isValid: false,
      errorCode: "IPD_INVALID_ADMINISTERED_TIME",
      errorMessage: "Administration timestamp is required",
    };
  }
  return { isValid: true };
}

export function setDischargeReadiness(input: DischargeReadinessInput): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (input.actorRole !== "DOCTOR" && input.actorRole !== "ADMIN" && input.actorRole !== "SUPER_ADMIN") {
    return {
      isValid: false,
      errorCode: "FORBIDDEN",
      errorMessage: "Only the attending doctor can set discharge readiness",
    };
  }
  if (typeof input.ready !== "boolean") {
    return {
      isValid: false,
      errorCode: "IPD_INVALID_READINESS_VALUE",
      errorMessage: "Discharge readiness must be a boolean",
    };
  }
  return { isValid: true };
}

export function canDischargePatient(check: DischargeBlockerCheck): {
  allowed: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (!check.dischargeReadinessConfirmed) {
    return {
      allowed: false,
      errorCode: "IPD_DISCHARGE_READINESS_NOT_CONFIRMED",
      errorMessage: "Discharge is blocked until attending doctor confirms discharge readiness",
    };
  }
  if (!check.hasDischargeSummary) {
    return {
      allowed: false,
      errorCode: "IPD_DISCHARGE_SUMMARY_MISSING",
      errorMessage: "Discharge requires a completed discharge summary",
    };
  }
  return { allowed: true };
}
