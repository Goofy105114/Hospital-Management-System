export function validateInventoryItem(input: {
  name?: string;
  category?: string;
  unit?: string;
  reorderThreshold?: number;
}): { isValid: boolean; errorCode?: string; errorMessage?: string } {
  if (!input.name || typeof input.name !== "string" || input.name.trim().length === 0) {
    return {
      isValid: false,
      errorCode: "INV_INVALID_NAME",
      errorMessage: "Item name is required and cannot be empty",
    };
  }
  if (!input.category || typeof input.category !== "string") {
    return {
      isValid: false,
      errorCode: "INV_INVALID_CATEGORY",
      errorMessage: "Item category is required",
    };
  }
  if (!input.unit || typeof input.unit !== "string") {
    return {
      isValid: false,
      errorCode: "INV_INVALID_UNIT",
      errorMessage: "Item unit is required",
    };
  }
  if (
    input.reorderThreshold !== undefined &&
    (!Number.isInteger(input.reorderThreshold) || input.reorderThreshold < 0)
  ) {
    return {
      isValid: false,
      errorCode: "INV_INVALID_REORDER_THRESHOLD",
      errorMessage: "Reorder threshold must be a non-negative integer",
    };
  }
  return { isValid: true };
}
