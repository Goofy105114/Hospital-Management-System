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

  describe("INV-03 — Stock ledger, adjustments and inventory audit", () => {
    it("validates manual stock adjustments and movements", async () => {
      const { validateStockAdjustmentInput } = await import(
        "@/server/domain/inventory-item"
      );

      const validAdjustment = validateStockAdjustmentInput({
        itemId: "item-001",
        locationId: "loc-pharmacy",
        quantityDelta: -5,
        reason: "ADJUSTMENT",
        justification: "Damaged packaging discovered during cycle count",
      });
      expect(validAdjustment.isValid).toBe(true);

      const missingJustification = validateStockAdjustmentInput({
        itemId: "item-001",
        locationId: "loc-pharmacy",
        quantityDelta: -5,
        reason: "ADJUSTMENT",
      });
      expect(missingJustification.isValid).toBe(false);
      expect(missingJustification.errorCode).toBe("INV_JUSTIFICATION_REQUIRED");

      const zeroDelta = validateStockAdjustmentInput({
        itemId: "item-001",
        locationId: "loc-pharmacy",
        quantityDelta: 0,
        reason: "GOODS_RECEIPT",
      });
      expect(zeroDelta.isValid).toBe(false);
      expect(zeroDelta.errorCode).toBe("INV_INVALID_QUANTITY_DELTA");
    });

    it("calculates running stock balance correctly", async () => {
      const { calculateRunningStockBalance } = await import(
        "@/server/domain/inventory-item"
      );

      const initial = 100;
      const movements = [
        { quantityDelta: 50 }, // +50 Goods receipt -> 150
        { quantityDelta: -20 }, // -20 Dispense -> 130
        { quantityDelta: -10 }, // -10 Transfer out -> 120
        { quantityDelta: -5 }, // -5 Adjustment -> 115
        { quantityDelta: 2 }, // +2 Return -> 117
      ];

      const balance = calculateRunningStockBalance(initial, movements);
      expect(balance).toBe(117);
    });

    it("reconciles physical stock audit discrepancies and variance value", async () => {
      const { reconcilePhysicalStockAudit } = await import(
        "@/server/domain/inventory-item"
      );

      const auditItems = [
        {
          id: "item-1",
          itemName: "Paracetamol 500mg",
          category: "MEDICINE",
          systemStockOnHand: 100,
          physicalCount: 95, // -5 missing
          unitCost: 2.0,
        },
        {
          id: "item-2",
          itemName: "Sterile Gauze 4x4",
          category: "CONSUMABLE",
          systemStockOnHand: 50,
          physicalCount: 50, // matched
          unitCost: 1.5,
        },
        {
          id: "item-3",
          itemName: "Disposable Syringes 5ml",
          category: "SURGICAL",
          systemStockOnHand: 200,
          physicalCount: 210, // +10 surplus
          unitCost: 0.5,
        },
      ];

      const res = reconcilePhysicalStockAudit(auditItems);
      expect(res.totalItemsAudited).toBe(3);
      expect(res.itemsWithDiscrepancyCount).toBe(2);
      expect(res.totalDiscrepancyQty).toBe(15); // | -5 | + | 10 |
      expect(res.totalVarianceValue).toBe(-5); // (-5 * 2.0) + (10 * 0.5) = -10 + 5 = -5
      expect(res.discrepancies).toHaveLength(2);
    });
  });
});

