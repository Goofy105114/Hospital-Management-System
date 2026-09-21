import { describe, expect, it } from "vitest";
import {
  computePOReceiptStatus,
  validateGoodsReceiptItem,
} from "@/server/domain/purchase-order";

describe("INV-06 reorder requests, suppliers, purchase orders and goods receipt", () => {
  it("derives SENT status when items are ordered but none received", () => {
    const status = computePOReceiptStatus([
      { itemId: "item-1", qtyOrdered: 100, qtyReceived: 0 },
      { itemId: "item-2", qtyOrdered: 50, qtyReceived: 0 },
    ]);
    expect(status).toBe("SENT");
  });

  it("derives PARTIALLY_RECEIVED when some items are partially or fully received", () => {
    const status = computePOReceiptStatus([
      { itemId: "item-1", qtyOrdered: 100, qtyReceived: 100 },
      { itemId: "item-2", qtyOrdered: 50, qtyReceived: 20 },
    ]);
    expect(status).toBe("PARTIALLY_RECEIVED");
  });

  it("derives RECEIVED only when every item line is fully fulfilled", () => {
    const status = computePOReceiptStatus([
      { itemId: "item-1", qtyOrdered: 100, qtyReceived: 100 },
      { itemId: "item-2", qtyOrdered: 50, qtyReceived: 50 },
    ]);
    expect(status).toBe("RECEIVED");
  });

  it("validates goods receipt item input parameters", () => {
    const valid = validateGoodsReceiptItem({
      itemId: "item-1",
      quantityReceived: 25,
    });
    expect(valid.isValid).toBe(true);

    const invalidQty = validateGoodsReceiptItem({
      itemId: "item-1",
      quantityReceived: -5,
    });
    expect(invalidQty.isValid).toBe(false);
    expect(invalidQty.errorCode).toBe("INV_INVALID_RECEIPT_QUANTITY");

    const missingItem = validateGoodsReceiptItem({
      quantityReceived: 10,
    });
    expect(missingItem.isValid).toBe(false);
    expect(missingItem.errorCode).toBe("INV_INVALID_ITEM_ID");
  });
});
