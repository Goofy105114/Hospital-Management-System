import { describe, it, expect } from "vitest";
import { SafetyCheckService } from "@/lib/safety-check";

describe("Clinical Safety Checking Engine (PHA-02 / EMR-05)", () => {
  it("detects direct allergy conflicts between prescribed medicine and patient allergy history", () => {
    const patientAllergies = [
      { allergen: "Penicillin", severity: "SEVERE" },
      { allergen: "Aspirin", severity: "MODERATE" },
    ];

    const newMeds = ["Amoxicillin Penicillin", "Lisinopril"];
    const result = SafetyCheckService.checkPrescriptionSafety(newMeds, patientAllergies);

    expect(result.hasConflicts).toBe(true);
    expect(result.allergyConflicts).toHaveLength(1);
    expect(result.allergyConflicts[0].allergen).toBe("Penicillin");
    expect(result.allergyConflicts[0].severity).toBe("SEVERE");
  });

  it("detects severe drug-drug interactions between Warfarin and Aspirin", () => {
    const newMeds = ["Warfarin 5mg", "Aspirin 81mg"];
    const result = SafetyCheckService.checkPrescriptionSafety(newMeds, []);

    expect(result.hasConflicts).toBe(true);
    expect(result.interactionWarnings).toHaveLength(1);
    expect(result.interactionWarnings[0].severity).toBe("SEVERE");
    expect(result.interactionWarnings[0].description).toContain("hemorrhage");
  });

  it("detects drug-drug interaction between new prescription and existing active medications", () => {
    const newMeds = ["Clarithromycin 500mg"];
    const existingMeds = ["Atorvastatin 20mg"];
    const result = SafetyCheckService.checkPrescriptionSafety(newMeds, [], existingMeds);

    expect(result.hasConflicts).toBe(true);
    expect(result.interactionWarnings).toHaveLength(1);
    expect(result.interactionWarnings[0].severity).toBe("SEVERE");
    expect(result.interactionWarnings[0].description).toContain("rhabdomyolysis");
  });

  it("passes cleanly when there are no allergy or interaction conflicts", () => {
    const newMeds = ["Metoprolol Succinate 25mg", "Lisinopril 10mg"];
    const patientAllergies = [{ allergen: "Sulfa", severity: "MILD" }];
    const result = SafetyCheckService.checkPrescriptionSafety(newMeds, patientAllergies);

    expect(result.hasConflicts).toBe(false);
    expect(result.allergyConflicts).toHaveLength(0);
    expect(result.interactionWarnings).toHaveLength(0);
  });
});
