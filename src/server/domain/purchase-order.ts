export type PurchaseOrderStatus =
  | "DRAFT"
  | "SENT"
  | "PARTIALLY_RECEIVED"
  | "RECEIVED"
  | "CLOSED";

export interface POItemReceipt {
  itemId: string;
  qtyOrdered: number;
  qtyReceived: number;
}

export function computePOReceiptStatus(items: POItemReceipt[]): PurchaseOrderStatus {
  if (!items || items.length === 0) return "DRAFT";

  const totalOrdered = items.reduce((sum, item) => sum + (item.qtyOrdered || 0), 0);
  const totalReceived = items.reduce((sum, item) => sum + (item.qtyReceived || 0), 0);

  if (totalReceived === 0) return "SENT";
  if (items.every((item) => (item.qtyReceived || 0) >= (item.qtyOrdered || 0))) {
    return "RECEIVED";
  }
  return "PARTIALLY_RECEIVED";
}

export function validateGoodsReceiptItem(item: {
  itemId?: string;
  quantityReceived?: number;
}): { isValid: boolean; errorCode?: string; errorMessage?: string } {
  if (!item.itemId || typeof item.itemId !== "string") {
    return {
      isValid: false,
      errorCode: "INV_INVALID_ITEM_ID",
      errorMessage: "Valid itemId is required for goods receipt",
    };
  }
  if (
    typeof item.quantityReceived !== "number" ||
    !Number.isInteger(item.quantityReceived) ||
    item.quantityReceived <= 0
  ) {
    return {
      isValid: false,
      errorCode: "INV_INVALID_RECEIPT_QUANTITY",
      errorMessage: "quantityReceived must be a positive integer",
    };
  }
  return { isValid: true };
}
