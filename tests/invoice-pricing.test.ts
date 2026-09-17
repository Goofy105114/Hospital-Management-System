import { describe, expect, it } from "vitest";
import { adjustmentAmount, calculateInvoiceTotals } from "@/server/domain/invoice-pricing";

describe("BIL-03 pricing calculations", () => {
  it("calculates subtotal, discount, proportional tax and waiver server-side", () => {
    expect(
      calculateInvoiceTotals({
        lines: [
          { amount: 100, taxRatePercent: 10 },
          { amount: 50, taxRatePercent: 0 },
        ],
        discountAmounts: [15],
        waiverAmounts: [5],
      })
    ).toEqual({ subtotal: 150, discount: 15, tax: 9, waiver: 5, finalTotal: 139 });
  });

  it("validates percentage and flat adjustments", () => {
    expect(adjustmentAmount("PERCENT", 10, 200)).toBe(20);
    expect(adjustmentAmount("PERCENT", 101, 200)).toBeNull();
    expect(adjustmentAmount("FLAT", 201, 200)).toBeNull();
  });
});
