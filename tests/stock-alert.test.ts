import { describe, expect, it } from "vitest";
import { StockAlertStatus } from "@prisma/client";
import { desiredAlertStatus, validateThreshold } from "@/server/domain/stock-alert";

describe("INV-05 stock alert rules", () => {
  it("validates threshold configuration", () => {
    expect(validateThreshold(-1, 10)).toBe("INV_INVALID_MIN_QUANTITY");
    expect(validateThreshold(5, 0)).toBe("INV_INVALID_REORDER_QUANTITY");
    expect(validateThreshold(5, 20)).toBeNull();
  });

  it("opens, retains and resolves alerts based on actual stock", () => {
    expect(desiredAlertStatus(4, 5)).toBe(StockAlertStatus.OPEN);
    expect(desiredAlertStatus(4, 5, StockAlertStatus.ACKNOWLEDGED)).toBe(
      StockAlertStatus.ACKNOWLEDGED
    );
    expect(desiredAlertStatus(6, 5, StockAlertStatus.OPEN)).toBe(StockAlertStatus.RESOLVED);
    expect(desiredAlertStatus(6, 5)).toBeNull();
  });
});
