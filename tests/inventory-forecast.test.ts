import { describe, expect, it } from "vitest";
import { forecastReorder } from "@/server/domain/inventory-forecast";

describe("AI-04 inventory forecasting", () => {
  it("suggests stock needed for lead time and safety stock", () => {
    const forecast = forecastReorder({
      consumedQuantity: 300,
      historyDays: 30,
      consumptionEvents: 25,
      currentQuantity: 50,
      leadTimeDays: 14,
      safetyStockDays: 7,
    });
    expect(forecast.averageDailyDemand).toBe(10);
    expect(forecast.suggestedQuantity).toBe(160);
    expect(forecast.advisory).toBe(true);
  });

  it("flags sparse history as low confidence and never suggests a negative quantity", () => {
    const forecast = forecastReorder({
      consumedQuantity: 1,
      historyDays: 2,
      consumptionEvents: 1,
      currentQuantity: 100,
      leadTimeDays: 14,
      safetyStockDays: 7,
    });
    expect(forecast.lowConfidence).toBe(true);
    expect(forecast.suggestedQuantity).toBe(0);
  });
});
