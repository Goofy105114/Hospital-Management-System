import { describe, expect, it } from "vitest";
import {
  validateCareNoteCreation,
  validateMedicationAdministration,
  setDischargeReadiness,
  canDischargePatient,
} from "@/server/domain/inpatient-care";

describe("IPD-04 — Inpatient care, medication and discharge coordination", () => {
  describe("care notes validation", () => {
    it("accepts valid care note linked to admission", () => {
      const res = validateCareNoteCreation({
        admissionId: "adm-001",
        note: "Patient stable on 2L O2 nasal cannula. Vitals monitored.",
        authorRole: "NURSE",
      });
      expect(res.isValid).toBe(true);
    });

    it("rejects empty or whitespace care notes", () => {
      const res = validateCareNoteCreation({
        admissionId: "adm-001",
        note: "   ",
      });
      expect(res.isValid).toBe(false);
      expect(res.errorCode).toBe("IPD_NOTE_EMPTY");
    });

    it("rejects missing admission ID", () => {
      const res = validateCareNoteCreation({
        note: "Patient resting comfortably.",
      });
      expect(res.isValid).toBe(false);
      expect(res.errorCode).toBe("IPD_INVALID_ADMISSION");
    });
  });

  describe("medication administration record (MAR)", () => {
    it("validates MAR entry with required fields", () => {
      const res = validateMedicationAdministration({
        admissionId: "adm-001",
        prescriptionItemId: "rx-item-123",
        administeredAt: new Date().toISOString(),
        administeredBy: "Nurse Sarah",
      });
      expect(res.isValid).toBe(true);
    });

    it("blocks MAR entry without prescription item", () => {
      const res = validateMedicationAdministration({
        admissionId: "adm-001",
        administeredAt: new Date().toISOString(),
      });
      expect(res.isValid).toBe(false);
      expect(res.errorCode).toBe("IPD_INVALID_PRESCRIPTION_ITEM");
    });
  });

  describe("discharge readiness tracking and coordination", () => {
    it("permits DOCTOR to toggle discharge readiness", () => {
      const res = setDischargeReadiness({
        admissionId: "adm-001",
        ready: true,
        actorRole: "DOCTOR",
      });
      expect(res.isValid).toBe(true);
    });

    it("prevents non-doctor roles from setting discharge readiness", () => {
      const res = setDischargeReadiness({
        admissionId: "adm-001",
        ready: true,
        actorRole: "NURSE",
      });
      expect(res.isValid).toBe(false);
      expect(res.errorCode).toBe("FORBIDDEN");
    });

    it("blocks discharge when discharge readiness is not confirmed (IPD_DISCHARGE_READINESS_NOT_CONFIRMED)", () => {
      const check = canDischargePatient({
        dischargeReadinessConfirmed: false,
        hasDischargeSummary: true,
      });
      expect(check.allowed).toBe(false);
      expect(check.errorCode).toBe("IPD_DISCHARGE_READINESS_NOT_CONFIRMED");
    });

    it("blocks discharge when discharge summary is missing", () => {
      const check = canDischargePatient({
        dischargeReadinessConfirmed: true,
        hasDischargeSummary: false,
      });
      expect(check.allowed).toBe(false);
      expect(check.errorCode).toBe("IPD_DISCHARGE_SUMMARY_MISSING");
    });

    it("permits discharge when both readiness confirmed and summary exist", () => {
      const check = canDischargePatient({
        dischargeReadinessConfirmed: true,
        hasDischargeSummary: true,
      });
      expect(check.allowed).toBe(true);
    });
  });
});
