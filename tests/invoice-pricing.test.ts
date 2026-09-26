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

  describe("BIL-06 — Receipts, statements, reconciliation and financial audit", () => {
    it("generates formatted receipt numbers", async () => {
      const { generateReceiptNumber } = await import("@/server/domain/invoice-pricing");
      const d = new Date("2026-09-22T10:00:00.000Z");
      const r1 = generateReceiptNumber("pay-abc-123456", d);
      expect(r1).toBe("RCP-202609-123456");

      const r2 = generateReceiptNumber(42, d);
      expect(r2).toBe("RCP-202609-000042");
    });

    it("calculates accurate aging buckets for outstanding invoices", async () => {
      const { calculateAgingBuckets } = await import("@/server/domain/invoice-pricing");
      const asOf = new Date("2026-09-22T00:00:00.000Z");

      const invoices = [
        { invoiceDate: "2026-09-15T00:00:00.000Z", balanceAmount: 100 }, // 7 days -> current
        { invoiceDate: "2026-08-15T00:00:00.000Z", balanceAmount: 200 }, // 38 days -> days30
        { invoiceDate: "2026-07-15T00:00:00.000Z", balanceAmount: 300 }, // 69 days -> days60
        { invoiceDate: "2026-05-01T00:00:00.000Z", balanceAmount: 400 }, // >90 days -> days90Plus
        { invoiceDate: "2026-09-20T00:00:00.000Z", balanceAmount: 0 }, // paid -> ignored
      ];

      const aging = calculateAgingBuckets(invoices, asOf);
      expect(aging.current).toBe(100);
      expect(aging.days30).toBe(200);
      expect(aging.days60).toBe(300);
      expect(aging.days90Plus).toBe(400);
      expect(aging.totalOutstanding).toBe(1000);
    });

    it("reconciles daily collections grouped by payment method", async () => {
      const { reconcileDailyCollections } = await import("@/server/domain/invoice-pricing");

      const payments = [
        { amount: 50.5, paymentMethod: "CASH", createdAt: "2026-09-22T08:00:00.000Z" },
        { amount: 150.0, paymentMethod: "CARD", createdAt: "2026-09-22T09:00:00.000Z" },
        { amount: 200.25, paymentMethod: "UPI", createdAt: "2026-09-22T10:00:00.000Z" },
        { amount: 1000.0, paymentMethod: "INSURANCE", createdAt: "2026-09-22T11:00:00.000Z" },
        { amount: 49.5, paymentMethod: "CASH", createdAt: "2026-09-22T12:00:00.000Z" },
      ];

      const recon = reconcileDailyCollections(payments);
      expect(recon.totalCollected).toBe(1450.25);
      expect(recon.transactionCount).toBe(5);
      expect(recon.byMethod.CASH).toBe(100.0);
      expect(recon.byMethod.CARD).toBe(150.0);
      expect(recon.byMethod.UPI).toBe(200.25);
      expect(recon.byMethod.INSURANCE).toBe(1000.0);
      expect(recon.byMethod.BANK_TRANSFER).toBe(0);
    });
  });
});

