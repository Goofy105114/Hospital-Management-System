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

// ---------------------------------------------------------------------------
// INV-03 — Stock ledger, adjustments and inventory audit
// ---------------------------------------------------------------------------

export const VALID_STOCK_MOVEMENT_REASONS = [
  "DISPENSE",
  "TRANSFER_OUT",
  "TRANSFER_IN",
  "GOODS_RECEIPT",
  "ADJUSTMENT",
  "RETURN",
];

export interface StockAdjustmentInput {
  itemId?: string;
  locationId?: string;
  batchId?: string;
  quantityDelta?: number;
  reason?: string;
  justification?: string;
  createdBy?: string;
}

export function validateStockAdjustmentInput(input: StockAdjustmentInput): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (!input.itemId || typeof input.itemId !== "string") {
    return {
      isValid: false,
      errorCode: "INV_INVALID_ITEM",
      errorMessage: "A valid itemId is required for stock ledger adjustment",
    };
  }

  if (!input.locationId || typeof input.locationId !== "string") {
    return {
      isValid: false,
      errorCode: "INV_INVALID_LOCATION",
      errorMessage: "A valid locationId is required for stock movement",
    };
  }

  if (
    input.quantityDelta === undefined ||
    typeof input.quantityDelta !== "number" ||
    !Number.isInteger(input.quantityDelta) ||
    input.quantityDelta === 0
  ) {
    return {
      isValid: false,
      errorCode: "INV_INVALID_QUANTITY_DELTA",
      errorMessage: "Quantity delta must be a non-zero integer",
    };
  }

  if (
    !input.reason ||
    typeof input.reason !== "string" ||
    !VALID_STOCK_MOVEMENT_REASONS.includes(input.reason.toUpperCase())
  ) {
    return {
      isValid: false,
      errorCode: "INV_INVALID_REASON",
      errorMessage: `Reason must be one of: ${VALID_STOCK_MOVEMENT_REASONS.join(", ")}`,
    };
  }

  if (
    (input.reason.toUpperCase() === "ADJUSTMENT" || input.reason.toUpperCase() === "RETURN") &&
    (!input.justification || typeof input.justification !== "string" || input.justification.trim() === "")
  ) {
    return {
      isValid: false,
      errorCode: "INV_JUSTIFICATION_REQUIRED",
      errorMessage: "Audit justification is required for manual stock adjustments and returns",
    };
  }

  return { isValid: true };
}

export function calculateRunningStockBalance(
  initialOnHand: number,
  movements: Array<{ quantityDelta: number }>
): number {
  return movements.reduce((acc, m) => acc + (m.quantityDelta || 0), Math.max(0, initialOnHand));
}

export function reconcilePhysicalStockAudit(
  items: Array<{
    id: string;
    itemName?: string;
    category?: string;
    systemStockOnHand: number;
    physicalCount: number;
    unitCost?: number;
  }>
): {
  totalItemsAudited: number;
  itemsWithDiscrepancyCount: number;
  totalDiscrepancyQty: number;
  totalVarianceValue: number;
  discrepancies: Array<{
    itemId: string;
    itemName: string;
    category: string;
    systemStockOnHand: number;
    physicalCount: number;
    varianceQty: number;
    estimatedVarianceCost: number;
  }>;
} {
  const discrepancies: Array<{
    itemId: string;
    itemName: string;
    category: string;
    systemStockOnHand: number;
    physicalCount: number;
    varianceQty: number;
    estimatedVarianceCost: number;
  }> = [];

  let totalDiscrepancyQty = 0;
  let totalVarianceValue = 0;

  for (const it of items) {
    const sys = Math.max(0, it.systemStockOnHand || 0);
    const phys = Math.max(0, it.physicalCount || 0);
    const diff = phys - sys;
    const cost = it.unitCost || 0;

    if (diff !== 0) {
      const varianceCost = Math.round(diff * cost * 100) / 100;
      totalDiscrepancyQty += Math.abs(diff);
      totalVarianceValue += varianceCost;

      discrepancies.push({
        itemId: it.id,
        itemName: it.itemName || "Item",
        category: it.category || "GENERAL",
        systemStockOnHand: sys,
        physicalCount: phys,
        varianceQty: diff,
        estimatedVarianceCost: varianceCost,
      });
    }
  }

  return {
    totalItemsAudited: items.length,
    itemsWithDiscrepancyCount: discrepancies.length,
    totalDiscrepancyQty,
    totalVarianceValue: Math.round(totalVarianceValue * 100) / 100,
    discrepancies,
  };
}

