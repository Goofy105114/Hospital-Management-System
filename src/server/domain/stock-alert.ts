import { StockAlertStatus } from "@prisma/client";

export function validateThreshold(minQuantity: number, reorderQuantity: number): string | null {
  if (!Number.isInteger(minQuantity) || minQuantity < 0) return "INV_INVALID_MIN_QUANTITY";
  if (!Number.isInteger(reorderQuantity) || reorderQuantity <= 0) {
    return "INV_INVALID_REORDER_QUANTITY";
  }
  return null;
}

export function desiredAlertStatus(
  currentQuantity: number,
  threshold: number,
  existing?: StockAlertStatus
): StockAlertStatus | null {
  if (currentQuantity <= threshold) return existing ?? StockAlertStatus.OPEN;
  return existing ? StockAlertStatus.RESOLVED : null;
}
