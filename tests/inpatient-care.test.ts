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

  describe("IPD-05 — Discharge summary, final billing and follow-up tracking", () => {
    it("validates doctor authored discharge summary", async () => {
      const { validateDischargeSummaryInput } = await import(
        "@/server/domain/inpatient-care"
      );

      const valid = validateDischargeSummaryInput({
        admissionId: "adm-101",
        summaryText: "Patient treated for acute bronchitis. Complete resolution.",
        authorRole: "DOCTOR",
      });
      expect(valid.isValid).toBe(true);

      const emptyText = validateDischargeSummaryInput({
        admissionId: "adm-101",
        summaryText: "   ",
        authorRole: "DOCTOR",
      });
      expect(emptyText.isValid).toBe(false);
      expect(emptyText.errorCode).toBe("IPD_DISCHARGE_SUMMARY_EMPTY");

      const forbiddenRole = validateDischargeSummaryInput({
        admissionId: "adm-101",
        summaryText: "Summary by nurse",
        authorRole: "NURSE",
      });
      expect(forbiddenRole.isValid).toBe(false);
      expect(forbiddenRole.errorCode).toBe("FORBIDDEN");
    });

    it("accurately calculates stay duration and consolidated bed charges", async () => {
      const { calculateStayDurationAndBedCharges } = await import(
        "@/server/domain/inpatient-care"
      );

      const admissionDate = new Date("2026-09-10T10:00:00.000Z");
      const dischargeDate = new Date("2026-09-14T15:00:00.000Z"); // 4.2 days -> 5 billed days

      const billing = calculateStayDurationAndBedCharges({
        admittedAt: admissionDate,
        dischargedAt: dischargeDate,
        dailyRate: 300.0,
        medicationTotal: 150.0,
        diagnosticsTotal: 200.0,
        procedureTotal: 500.0,
      });

      expect(billing.stayDays).toBe(5);
      expect(billing.bedDailyRate).toBe(300.0);
      expect(billing.totalBedCharges).toBe(1500.0);
      expect(billing.medicationCharges).toBe(150.0);
      expect(billing.diagnosticsCharges).toBe(200.0);
      expect(billing.procedureCharges).toBe(500.0);
      expect(billing.totalNetAmount).toBe(2350.0);
    });
  });

  describe("IPD-01 — Admission request and approval", () => {
    it("validates valid admission request", async () => {
      const { validateAdmissionRequestInput } = await import(
        "@/server/domain/inpatient-care"
      );

      const valid = validateAdmissionRequestInput({
        patientId: "pat-123",
        reasonForAdmission: "Observation post acute severe asthma attack",
        admittingDoctorId: "doc-456",
        preferredWardType: "MALE_GENERAL",
      });
      expect(valid.isValid).toBe(true);

      const missingPatient = validateAdmissionRequestInput({
        reasonForAdmission: "Asthma observation",
      });
      expect(missingPatient.isValid).toBe(false);
      expect(missingPatient.errorCode).toBe("IPD_INVALID_PATIENT");

      const emptyReason = validateAdmissionRequestInput({
        patientId: "pat-123",
        reasonForAdmission: "   ",
      });
      expect(emptyReason.isValid).toBe(false);
      expect(emptyReason.errorCode).toBe("IPD_REASON_EMPTY");
    });

    it("validates admission approval authorization and bed allocation", async () => {
      const { validateAdmissionApproval, generateAdmissionNumber } =
        await import("@/server/domain/inpatient-care");

      const validDoctor = validateAdmissionApproval({
        requestId: "req-101",
        approverRole: "DOCTOR",
        bedId: "bed-001",
      });
      expect(validDoctor.isValid).toBe(true);

      const invalidNurse = validateAdmissionApproval({
        requestId: "req-101",
        approverRole: "NURSE",
        bedId: "bed-001",
      });
      expect(invalidNurse.isValid).toBe(false);
      expect(invalidNurse.errorCode).toBe("FORBIDDEN");

      const missingBed = validateAdmissionApproval({
        requestId: "req-101",
        approverRole: "DOCTOR",
      });
      expect(missingBed.isValid).toBe(false);
      expect(missingBed.errorCode).toBe("IPD_BED_REQUIRED");

      const admNum = generateAdmissionNumber(42);
      expect(admNum).toMatch(/^IPD-\d{8}-0042$/);
    });
  });
});

