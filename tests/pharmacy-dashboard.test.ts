import { describe, expect, it } from "vitest";
import { pharmacyDashboardRates } from "@/server/domain/pharmacy-dashboard";

describe("REP-03 dashboard metrics", () => {
  it("derives dispensing and operational risk indicators", () => {
    expect(
      pharmacyDashboardRates({
        queueLength: 8,
        dispensedFull: 9,
        dispensedPartial: 1,
        lowStockCount: 3,
        nearExpiryCount: 2,
      })
    ).toEqual({
      queueLength: 8,
      dispensedFull: 9,
      dispensedPartial: 1,
      lowStockCount: 3,
      nearExpiryCount: 2,
      totalDispensed: 10,
      partialRate: 10,
      riskCount: 5,
    });
  });
});
