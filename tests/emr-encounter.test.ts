import { describe, expect, it } from "vitest";
import { EncounterStatus } from "@prisma/client";
import {
  canTransitionEncounter,
  validateEncounterCreation,
} from "@/server/domain/encounter-state";

describe("EMR-01 clinical encounter workspace and patient context", () => {
  describe("encounter validation", () => {
    it("accepts valid patient and doctor identifier inputs", () => {
      const valid = validateEncounterCreation({
        patientId: "pat-001",
        doctorId: "doc-001",
      });
      expect(valid.isValid).toBe(true);
    });

    it("rejects missing patient ID", () => {
      const noPatient = validateEncounterCreation({
        doctorId: "doc-001",
      });
      expect(noPatient.isValid).toBe(false);
      expect(noPatient.errorCode).toBe("EMR_INVALID_PATIENT");
    });

    it("rejects missing doctor ID", () => {
      const noDoctor = validateEncounterCreation({
        patientId: "pat-001",
      });
      expect(noDoctor.isValid).toBe(false);
      expect(noDoctor.errorCode).toBe("EMR_INVALID_DOCTOR");
    });
  });

  describe("encounter lifecycle state transitions", () => {
    it("allows IN_PROGRESS to transition to FINALIZED (signing)", () => {
      expect(canTransitionEncounter(EncounterStatus.IN_PROGRESS, EncounterStatus.FINALIZED)).toBe(
        true
      );
    });

    it("allows FINALIZED to transition to AMENDED", () => {
      expect(canTransitionEncounter(EncounterStatus.FINALIZED, EncounterStatus.AMENDED)).toBe(true);
    });

    it("blocks illegal backwards or skipping transitions", () => {
      expect(canTransitionEncounter(EncounterStatus.FINALIZED, EncounterStatus.IN_PROGRESS)).toBe(
        false
      );
      expect(canTransitionEncounter(EncounterStatus.AMENDED, EncounterStatus.IN_PROGRESS)).toBe(
        false
      );
      expect(canTransitionEncounter(EncounterStatus.IN_PROGRESS, EncounterStatus.AMENDED)).toBe(
        false
      );
    });
  });

  describe("EMR-03 — Medical, medication and allergy history", () => {
    it("validates allergy documentation inputs", async () => {
      const { validateAllergyInput } = await import("@/server/domain/encounter-state");

      const valid = validateAllergyInput({
        patientId: "pat-101",
        allergen: "Penicillin G",
        severity: "SEVERE",
        reaction: "Anaphylaxis",
      });
      expect(valid.isValid).toBe(true);

      const missingAllergen = validateAllergyInput({
        patientId: "pat-101",
      });
      expect(missingAllergen.isValid).toBe(false);
      expect(missingAllergen.errorCode).toBe("EMR_ALLERGEN_REQUIRED");

      const invalidSeverity = validateAllergyInput({
        patientId: "pat-101",
        allergen: "Sulfa",
        severity: "EXTREME_SUPER",
      });
      expect(invalidSeverity.isValid).toBe(false);
      expect(invalidSeverity.errorCode).toBe("EMR_INVALID_SEVERITY");
    });

    it("validates medical history inputs", async () => {
      const { validateMedicalHistoryInput } = await import("@/server/domain/encounter-state");

      const valid = validateMedicalHistoryInput({
        patientId: "pat-101",
        condition: "Type 2 Diabetes Mellitus",
        diagnosedYear: 2018,
        notes: "Managed with Metformin and lifestyle changes",
      });
      expect(valid.isValid).toBe(true);

      const missingCondition = validateMedicalHistoryInput({
        patientId: "pat-101",
      });
      expect(missingCondition.isValid).toBe(false);
      expect(missingCondition.errorCode).toBe("EMR_CONDITION_REQUIRED");

      const invalidYear = validateMedicalHistoryInput({
        patientId: "pat-101",
        condition: "Asthma",
        diagnosedYear: 2099,
      });
      expect(invalidYear.isValid).toBe(false);
      expect(invalidYear.errorCode).toBe("EMR_INVALID_DIAGNOSED_YEAR");
    });

    it("consolidates longitudinal clinical history profile", async () => {
      const { consolidatePatientClinicalHistory } = await import(
        "@/server/domain/encounter-state"
      );

      const allergies = [
        {
          id: "all-1",
          allergen: "Aspirin",
          severity: "MODERATE",
          reaction: "Urticaria",
          recordedAt: new Date("2026-01-10"),
        },
      ];

      const medicalHistories = [
        {
          id: "mh-1",
          condition: "Essential Hypertension",
          diagnosedYear: 2020,
          notes: "Stage 1",
        },
      ];

      const prescriptions = [
        {
          id: "rx-1",
          prescriptionNumber: "RX-2026-001",
          status: "DISPENSED",
          createdAt: new Date("2026-02-15"),
          items: [
            {
              medicine: { name: "Amlodipine 5mg" },
              dosage: "5mg",
              frequency: "ONCE_DAILY",
              duration: "30 days",
            },
          ],
        },
      ];

      const result = consolidatePatientClinicalHistory(
        allergies,
        medicalHistories,
        prescriptions
      );

      expect(result.allergiesCount).toBe(1);
      expect(result.medicalConditionsCount).toBe(1);
      expect(result.activeMedicationsCount).toBe(1);
      expect(result.allergies[0].allergen).toBe("Aspirin");
      expect(result.medicationHistory[0].medicineName).toBe("Amlodipine 5mg");
    });
  });
});

