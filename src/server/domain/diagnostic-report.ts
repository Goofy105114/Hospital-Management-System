export function canViewDiagnosticReport(input: {
  requesterRole: string;
  requesterUserId: string;
  patientUserId: string;
  releasedAt?: Date | null;
  orderingDoctorUserId?: string | null;
}): boolean {
  if (input.requesterRole === "ADMIN" || input.requesterRole === "SUPER_ADMIN") return true;
  if (input.requesterRole === "PATIENT") {
    return input.requesterUserId === input.patientUserId && Boolean(input.releasedAt);
  }
  if (input.requesterRole === "DOCTOR") {
    return input.requesterUserId === input.orderingDoctorUserId;
  }
  return false;
}

// ---------------------------------------------------------------------------
// DIA-03 — Specimen and diagnostic work queue management
// ---------------------------------------------------------------------------

export interface SpecimenValidationInput {
  orderId?: string;
  specimenType?: string;
  barcode?: string;
  collectedBy?: string;
  collectedAt?: Date | string;
}

export function validateSpecimenCollection(input: SpecimenValidationInput): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (!input.orderId || typeof input.orderId !== "string") {
    return {
      isValid: false,
      errorCode: "DIA_INVALID_ORDER",
      errorMessage: "A valid orderId is required for specimen collection",
    };
  }
  if (!input.specimenType || typeof input.specimenType !== "string" || input.specimenType.trim() === "") {
    return {
      isValid: false,
      errorCode: "DIA_SPECIMEN_TYPE_REQUIRED",
      errorMessage: "Specimen type (e.g. BLOOD, URINE, TISSUE, SWAB) is required",
    };
  }
  if (!input.barcode || typeof input.barcode !== "string" || input.barcode.trim() === "") {
    return {
      isValid: false,
      errorCode: "DIA_BARCODE_REQUIRED",
      errorMessage: "Specimen barcode is required for tracking and chain of custody",
    };
  }
  return { isValid: true };
}

export function canTransitionDiagnosticOrderStatus(
  from: string,
  to: string
): { allowed: boolean; errorCode?: string; reason?: string } {
  const allowedTransitions: Record<string, string[]> = {
    ORDERED: ["SAMPLE_COLLECTED", "PROCESSING", "CANCELLED"],
    SAMPLE_COLLECTED: ["PROCESSING", "CANCELLED"],
    PROCESSING: ["RESULTED", "CANCELLED"],
    RESULTED: ["VERIFIED", "CANCELLED"],
    VERIFIED: [],
    CANCELLED: [],
  };

  const validTargets = allowedTransitions[from];
  if (!validTargets) {
    return {
      allowed: false,
      errorCode: "DIA_INVALID_CURRENT_STATUS",
      reason: `Unknown or invalid current status: ${from}`,
    };
  }

  if (!validTargets.includes(to)) {
    return {
      allowed: false,
      errorCode: "DIA_INVALID_STATUS_TRANSITION",
      reason: `Cannot transition diagnostic order from status ${from} to ${to}`,
    };
  }

  return { allowed: true };
}

export function calculateSpecimenSlaRemaining(
  orderCreatedAt: Date | string,
  turnaroundHours: number = 24,
  asOfDate: Date = new Date()
): { slaHours: number; elapsedHours: number; remainingHours: number; isBreached: boolean } {
  const start = new Date(orderCreatedAt).getTime();
  const now = asOfDate.getTime();
  const elapsedMs = Math.max(0, now - start);
  const elapsedHours = Math.round((elapsedMs / (1000 * 60 * 60)) * 10) / 10;
  const remainingHours = Math.round((turnaroundHours - elapsedHours) * 10) / 10;
  const isBreached = remainingHours < 0;

  return {
    slaHours: turnaroundHours,
    elapsedHours,
    remainingHours,
    isBreached,
  };
}

