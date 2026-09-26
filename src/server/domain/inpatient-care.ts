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

// ---------------------------------------------------------------------------
// IPD-05 — Discharge summary, final billing and follow-up tracking
// ---------------------------------------------------------------------------

export interface DischargeSummaryInput {
  admissionId?: string;
  summaryText?: string;
  authorRole?: string;
  doctorName?: string;
  admittingDiagnosis?: string;
  finalDiagnosis?: string;
  treatmentSummary?: string;
  dischargeCondition?: string;
  followUpInstructions?: string;
  followUpDate?: string | Date;
}

export interface StayDurationAndChargesInput {
  admittedAt: string | Date;
  dischargedAt?: string | Date;
  dailyRate: number;
  medicationTotal?: number;
  diagnosticsTotal?: number;
  procedureTotal?: number;
}

export interface StayBillingSummary {
  stayDays: number;
  bedDailyRate: number;
  totalBedCharges: number;
  medicationCharges: number;
  diagnosticsCharges: number;
  procedureCharges: number;
  totalNetAmount: number;
}

export function validateDischargeSummaryInput(input: DischargeSummaryInput): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (!input.admissionId || typeof input.admissionId !== "string") {
    return {
      isValid: false,
      errorCode: "IPD_INVALID_ADMISSION",
      errorMessage: "A valid admissionId is required for discharge summary",
    };
  }
  if (
    !input.summaryText ||
    typeof input.summaryText !== "string" ||
    input.summaryText.trim() === ""
  ) {
    return {
      isValid: false,
      errorCode: "IPD_DISCHARGE_SUMMARY_EMPTY",
      errorMessage: "Discharge summary clinical text cannot be empty",
    };
  }
  if (
    input.authorRole &&
    input.authorRole !== "DOCTOR" &&
    input.authorRole !== "ADMIN" &&
    input.authorRole !== "SUPER_ADMIN"
  ) {
    return {
      isValid: false,
      errorCode: "FORBIDDEN",
      errorMessage: "Only licensed medical doctors can author discharge summaries",
    };
  }
  return { isValid: true };
}

export function calculateStayDurationAndBedCharges(
  input: StayDurationAndChargesInput
): StayBillingSummary {
  const start = new Date(input.admittedAt);
  const end = input.dischargedAt ? new Date(input.dischargedAt) : new Date();

  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const rawDays = diffMs / (1000 * 60 * 60 * 24);
  const stayDays = Math.max(1, Math.ceil(rawDays));

  const bedRate = Math.max(0, input.dailyRate || 0);
  const totalBedCharges = parseFloat((stayDays * bedRate).toFixed(2));
  const medicationCharges = parseFloat((input.medicationTotal || 0).toFixed(2));
  const diagnosticsCharges = parseFloat((input.diagnosticsTotal || 0).toFixed(2));
  const procedureCharges = parseFloat((input.procedureTotal || 0).toFixed(2));

  const totalNetAmount = parseFloat(
    (
      totalBedCharges +
      medicationCharges +
      diagnosticsCharges +
      procedureCharges
    ).toFixed(2)
  );

  return {
    stayDays,
    bedDailyRate: bedRate,
    totalBedCharges,
    medicationCharges,
    diagnosticsCharges,
    procedureCharges,
    totalNetAmount,
  };
}

// ---------------------------------------------------------------------------
// IPD-01 — Admission request and approval
// ---------------------------------------------------------------------------

export interface AdmissionRequestInput {
  patientId?: string;
  encounterId?: string;
  admittingDoctorId?: string;
  reasonForAdmission?: string;
  admittingDiagnosis?: string;
  preferredWardType?: string;
  priority?: "ROUTINE" | "URGENT" | "EMERGENCY";
}

export interface AdmissionApprovalInput {
  requestId?: string;
  approverRole?: string;
  approverId?: string;
  bedId?: string;
  admittingDoctorId?: string;
}

export function validateAdmissionRequestInput(input: AdmissionRequestInput): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (!input.patientId || typeof input.patientId !== "string") {
    return {
      isValid: false,
      errorCode: "IPD_INVALID_PATIENT",
      errorMessage: "A valid patientId is required to request inpatient admission",
    };
  }
  if (
    !input.reasonForAdmission ||
    typeof input.reasonForAdmission !== "string" ||
    input.reasonForAdmission.trim() === ""
  ) {
    return {
      isValid: false,
      errorCode: "IPD_REASON_EMPTY",
      errorMessage: "Reason for inpatient admission is required",
    };
  }
  return { isValid: true };
}

export function validateAdmissionApproval(input: AdmissionApprovalInput): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (
    input.approverRole !== "DOCTOR" &&
    input.approverRole !== "ADMIN" &&
    input.approverRole !== "SUPER_ADMIN"
  ) {
    return {
      isValid: false,
      errorCode: "FORBIDDEN",
      errorMessage:
        "Only attending doctors or hospital administrators can approve admissions",
    };
  }
  if (!input.bedId || typeof input.bedId !== "string") {
    return {
      isValid: false,
      errorCode: "IPD_BED_REQUIRED",
      errorMessage: "An allocated bedId is required to approve admission",
    };
  }
  return { isValid: true };
}

export function generateAdmissionNumber(seq?: number): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const suffix = seq
    ? String(seq).padStart(4, "0")
    : Math.floor(1000 + Math.random() * 9000).toString();
  return `IPD-${yyyy}${mm}${dd}-${suffix}`;
}


