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
});
