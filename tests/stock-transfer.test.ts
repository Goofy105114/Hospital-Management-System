import { describe, expect, it } from "vitest";
import { StockTransferStatus } from "@prisma/client";
import { canTransitionTransfer, validateTransferRequest } from "@/server/domain/stock-transfer";

describe("INV-04 stock transfers", () => {
  it("rejects invalid quantities and same-location transfers", () => {
    expect(validateTransferRequest({ quantity: 0, fromLocationId: "a", toLocationId: "b" })).toBe(
      "INV_TRANSFER_INVALID_QUANTITY"
    );
    expect(validateTransferRequest({ quantity: 5, fromLocationId: "a", toLocationId: "a" })).toBe(
      "INV_TRANSFER_SAME_LOCATION"
    );
  });

  it("enforces request, dispatch and receive order", () => {
    expect(
      canTransitionTransfer(StockTransferStatus.REQUESTED, StockTransferStatus.DISPATCHED)
    ).toBe(true);
    expect(
      canTransitionTransfer(StockTransferStatus.DISPATCHED, StockTransferStatus.RECEIVED)
    ).toBe(true);
    expect(canTransitionTransfer(StockTransferStatus.REQUESTED, StockTransferStatus.RECEIVED)).toBe(
      false
    );
  });
});
