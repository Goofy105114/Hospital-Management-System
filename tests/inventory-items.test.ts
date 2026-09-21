import { describe, expect, it } from "vitest";
import { validateInventoryItem } from "@/server/domain/inventory-item";

describe("INV-01 medicine and item inventory management", () => {
  it("accepts valid inventory item configuration", () => {
    const valid = validateInventoryItem({
      name: "Amoxicillin 500mg Capsules",
      category: "PHARMACEUTICAL",
      unit: "CAPSULE",
      reorderThreshold: 100,
    });
    expect(valid.isValid).toBe(true);
  });

  it("rejects empty or whitespace-only item names", () => {
    const emptyName = validateInventoryItem({
      name: "   ",
      category: "CONSUMABLE",
      unit: "BOX",
    });
    expect(emptyName.isValid).toBe(false);
    expect(emptyName.errorCode).toBe("INV_INVALID_NAME");
  });

  it("rejects missing category or unit", () => {
    const noCat = validateInventoryItem({
      name: "Surgical Gloves",
      unit: "PAIR",
    });
    expect(noCat.isValid).toBe(false);
    expect(noCat.errorCode).toBe("INV_INVALID_CATEGORY");

    const noUnit = validateInventoryItem({
      name: "Surgical Gloves",
      category: "CONSUMABLE",
    });
    expect(noUnit.isValid).toBe(false);
    expect(noUnit.errorCode).toBe("INV_INVALID_UNIT");
  });

  it("enforces non-negative integer reorder thresholds", () => {
    const negative = validateInventoryItem({
      name: "Normal Saline 0.9% 500ml",
      category: "IV_FLUID",
      unit: "BOTTLE",
      reorderThreshold: -10,
    });
    expect(negative.isValid).toBe(false);
    expect(negative.errorCode).toBe("INV_INVALID_REORDER_THRESHOLD");

    const nonInteger = validateInventoryItem({
      name: "Normal Saline 0.9% 500ml",
      category: "IV_FLUID",
      unit: "BOTTLE",
      reorderThreshold: 12.5,
    });
    expect(nonInteger.isValid).toBe(false);
    expect(nonInteger.errorCode).toBe("INV_INVALID_REORDER_THRESHOLD");
  });
});
