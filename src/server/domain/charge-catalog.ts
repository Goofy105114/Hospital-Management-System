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
