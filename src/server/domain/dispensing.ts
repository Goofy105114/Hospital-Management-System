export type DispenseRequestItem = {
  prescriptionItemId: string;
  quantityDispensed: number;
  batchId: string;
};

export function validateDispenseRequest(items: DispenseRequestItem[]): string | null {
  if (!items.length) return "PHA_DISPENSE_ITEMS_REQUIRED";
  if (new Set(items.map((item) => item.prescriptionItemId)).size !== items.length) {
    return "PHA_DUPLICATE_PRESCRIPTION_ITEM";
  }
  if (
    items.some(
      (item) =>
        !item.batchId || !Number.isInteger(item.quantityDispensed) || item.quantityDispensed <= 0
    )
  ) {
    return "PHA_INVALID_DISPENSE_QUANTITY";
  }
  return null;
}

export function dispensingCompletionStatus(
  items: Array<{ quantityPrescribed: number; quantityDispensed: number }>
): "FULL" | "PARTIAL" {
  return items.every((item) => item.quantityDispensed >= item.quantityPrescribed)
    ? "FULL"
    : "PARTIAL";
}
