export interface ChargeableServiceInput {
  name?: string;
  category?: string;
  price?: number;
  isActive?: boolean;
}

export const VALID_SERVICE_CATEGORIES = [
  "CONSULTATION",
  "DIAGNOSTIC",
  "PROCEDURE",
  "ROOM_CHARGE",
  "SURGERY",
  "EMERGENCY",
  "PHARMACY",
  "OTHER",
];

export function validateChargeableService(input: Partial<ChargeableServiceInput>): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (!input.name || typeof input.name !== "string" || input.name.trim().length === 0) {
    return {
      isValid: false,
      errorCode: "BIL_INVALID_SERVICE_NAME",
      errorMessage: "Service name is required and cannot be empty",
    };
  }

  if (!input.category || typeof input.category !== "string" || !VALID_SERVICE_CATEGORIES.includes(input.category.toUpperCase())) {
    return {
      isValid: false,
      errorCode: "BIL_INVALID_SERVICE_CATEGORY",
      errorMessage: `Category must be one of: ${VALID_SERVICE_CATEGORIES.join(", ")}`,
    };
  }

  if (typeof input.price !== "number" || isNaN(input.price) || input.price < 0) {
    return {
      isValid: false,
      errorCode: "BIL_INVALID_SERVICE_PRICE",
      errorMessage: "Service price must be a non-negative number",
    };
  }

  return { isValid: true };
}

// ---------------------------------------------------------------------------
// DIA-01 — Diagnostic test and service catalog
// ---------------------------------------------------------------------------

export const VALID_DIAGNOSTIC_CATEGORIES = [
  "LABORATORY",
  "RADIOLOGY",
  "CARDIOLOGY",
  "PATHOLOGY",
];

export interface DiagnosticCatalogValidationInput {
  code?: string;
  name?: string;
  category?: string;
  price?: number;
  sampleType?: string;
  referenceRange?: string;
  turnaroundTimeHours?: number;
}

export function validateDiagnosticCatalogInput(
  input: Partial<DiagnosticCatalogValidationInput>
): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (!input.code || typeof input.code !== "string" || input.code.trim().length === 0) {
    return {
      isValid: false,
      errorCode: "DIA_INVALID_CATALOG_CODE",
      errorMessage: "Unique test code is required",
    };
  }

  if (!input.name || typeof input.name !== "string" || input.name.trim().length === 0) {
    return {
      isValid: false,
      errorCode: "DIA_INVALID_CATALOG_NAME",
      errorMessage: "Diagnostic test name is required",
    };
  }

  if (
    !input.category ||
    typeof input.category !== "string" ||
    !VALID_DIAGNOSTIC_CATEGORIES.includes(input.category.toUpperCase())
  ) {
    return {
      isValid: false,
      errorCode: "DIA_INVALID_CATEGORY",
      errorMessage: `Diagnostic category must be one of: ${VALID_DIAGNOSTIC_CATEGORIES.join(", ")}`,
    };
  }

  if (typeof input.price !== "number" || isNaN(input.price) || input.price < 0) {
    return {
      isValid: false,
      errorCode: "DIA_INVALID_PRICE",
      errorMessage: "Test price must be a non-negative number",
    };
  }

  if (
    input.turnaroundTimeHours !== undefined &&
    (typeof input.turnaroundTimeHours !== "number" || input.turnaroundTimeHours < 0)
  ) {
    return {
      isValid: false,
      errorCode: "DIA_INVALID_TAT",
      errorMessage: "Turnaround time hours must be a non-negative number",
    };
  }

  return { isValid: true };
}

