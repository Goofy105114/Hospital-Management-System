import { describe, expect, it } from "vitest";
import { dispensingCompletionStatus, validateDispenseRequest } from "@/server/domain/dispensing";

describe("PHA-04 dispensing rules", () => {
  it("rejects empty, duplicate and non-positive dispense requests", () => {
    expect(validateDispenseRequest([])).toBe("PHA_DISPENSE_ITEMS_REQUIRED");
    expect(
      validateDispenseRequest([
        { prescriptionItemId: "one", batchId: "batch-a", quantityDispensed: 1 },
        { prescriptionItemId: "one", batchId: "batch-b", quantityDispensed: 1 },
      ])
    ).toBe("PHA_DUPLICATE_PRESCRIPTION_ITEM");
    expect(
      validateDispenseRequest([
        { prescriptionItemId: "one", batchId: "batch-a", quantityDispensed: 0 },
      ])
    ).toBe("PHA_INVALID_DISPENSE_QUANTITY");
  });

  it("distinguishes partial and full completion", () => {
    expect(dispensingCompletionStatus([{ quantityPrescribed: 10, quantityDispensed: 4 }])).toBe(
      "PARTIAL"
    );
    expect(dispensingCompletionStatus([{ quantityPrescribed: 10, quantityDispensed: 10 }])).toBe(
      "FULL"
    );
  });
});
