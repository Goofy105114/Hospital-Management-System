import { describe, expect, it } from "vitest";
import { validateChargeableService } from "@/server/domain/charge-catalog";

describe("BIL-01 service and charge catalog", () => {
  it("accepts valid chargeable service configuration", () => {
    const valid = validateChargeableService({
      name: "Standard Consultation",
      category: "CONSULTATION",
      price: 50.0,
    });
    expect(valid.isValid).toBe(true);
  });

  it("rejects empty or whitespace-only service names", () => {
    const empty = validateChargeableService({
      name: "   ",
      category: "PROCEDURE",
      price: 100,
    });
    expect(empty.isValid).toBe(false);
    expect(empty.errorCode).toBe("BIL_INVALID_SERVICE_NAME");
  });

  it("rejects invalid or unknown service categories", () => {
    const invalidCategory = validateChargeableService({
      name: "Emergency Dressing",
      category: "UNKNOWN_CATEGORY",
      price: 25,
    });
    expect(invalidCategory.isValid).toBe(false);
    expect(invalidCategory.errorCode).toBe("BIL_INVALID_SERVICE_CATEGORY");
  });

  it("enforces non-negative pricing on services", () => {
    const negative = validateChargeableService({
      name: "Basic Ultrasound",
      category: "DIAGNOSTIC",
      price: -10,
    });
    expect(negative.isValid).toBe(false);
    expect(negative.errorCode).toBe("BIL_INVALID_SERVICE_PRICE");
  });
});
