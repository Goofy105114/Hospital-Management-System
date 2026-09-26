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

  describe("DIA-01 — Diagnostic test and service catalog", () => {
    it("validates valid diagnostic catalog item input", async () => {
      const { validateDiagnosticCatalogInput } = await import(
        "@/server/domain/charge-catalog"
      );

      const valid = validateDiagnosticCatalogInput({
        code: "CBC-AUTO",
        name: "Complete Blood Count with Differential",
        category: "LABORATORY",
        sampleType: "EDTA Whole Blood",
        referenceRange: "WBC 4.5-11.0, RBC 4.2-5.9",
        price: 45.0,
        turnaroundTimeHours: 4,
      });
      expect(valid.isValid).toBe(true);
    });

    it("rejects diagnostic catalog item with missing code or invalid category", async () => {
      const { validateDiagnosticCatalogInput } = await import(
        "@/server/domain/charge-catalog"
      );

      const missingCode = validateDiagnosticCatalogInput({
        name: "Serum Potassium",
        category: "LABORATORY",
        price: 20,
      });
      expect(missingCode.isValid).toBe(false);
      expect(missingCode.errorCode).toBe("DIA_INVALID_CATALOG_CODE");

      const invalidCategory = validateDiagnosticCatalogInput({
        code: "TEST-01",
        name: "Test Name",
        category: "INVALID_CAT",
        price: 20,
      });
      expect(invalidCategory.isValid).toBe(false);
      expect(invalidCategory.errorCode).toBe("DIA_INVALID_CATEGORY");

      const negativePrice = validateDiagnosticCatalogInput({
        code: "TEST-01",
        name: "Test Name",
        category: "RADIOLOGY",
        price: -5,
      });
      expect(negativePrice.isValid).toBe(false);
      expect(negativePrice.errorCode).toBe("DIA_INVALID_PRICE");
    });
  });
});

