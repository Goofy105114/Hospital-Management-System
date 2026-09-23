import { describe, expect, it } from "vitest";
import { AppointmentStatus, QueueTokenStatus, StockAlertStatus, StockTransferStatus, UserRole } from "@prisma/client";
import { apiError, apiPaginated, apiSuccess } from "@/lib/api-envelope";
import { generateAccessToken, verifyToken } from "@/lib/auth";
import { validateAppointmentEligibility, formatQueueTokenNumber } from "@/server/domain/queue-checkin";
import { canTransitionQueueToken, assertQueueTransition, QueueStateError } from "@/server/domain/queue-state";
import { SafetyCheckService } from "@/lib/safety-check";
import { validateDispenseRequest, dispensingCompletionStatus } from "@/server/domain/dispensing";
import { calculateInvoiceTotals, adjustmentAmount } from "@/server/domain/invoice-pricing";
import { validateRefundRequest } from "@/server/domain/refund-reversal";
import {
  validateCareNoteCreation,
  validateMedicationAdministration,
  setDischargeReadiness,
  canDischargePatient,
} from "@/server/domain/inpatient-care";
import { validateThreshold, desiredAlertStatus } from "@/server/domain/stock-alert";
import { validateTransferRequest, canTransitionTransfer } from "@/server/domain/stock-transfer";

describe("REL-03 — End-to-End System Smoke Suite", () => {
  describe("Smoke Check 1: API Contract & Response Envelopes", () => {
    it("emits standard success response envelope with timestamp and payload", async () => {
      const res = apiSuccess({ status: "healthy", version: "4.0.0" }, { env: "production" });
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toEqual({ status: "healthy", version: "4.0.0" });
      expect(json.meta.env).toBe("production");
      expect(typeof json.meta.timestamp).toBe("string");
    });

    it("emits standard paginated response envelope with pagination metadata", async () => {
      const items = [{ id: "item-1" }, { id: "item-2" }];
      const res = apiPaginated(items, 1, 10, 2);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data).toHaveLength(2);
      expect(json.meta.page).toBe(1);
      expect(json.meta.pageSize).toBe(10);
      expect(json.meta.totalItems).toBe(2);
      expect(json.meta.totalPages).toBe(1);
    });

    it("emits standard error envelope with error code, message and timestamp", async () => {
      const res = apiError("RECORD_NOT_FOUND", "Requested resource does not exist", 404, {
        resource: "Patient",
      });
      const json = await res.json();

      expect(res.status).toBe(404);
      expect(json.success).toBe(false);
      expect(json.error.code).toBe("RECORD_NOT_FOUND");
      expect(json.error.message).toBe("Requested resource does not exist");
      expect(json.error.details).toEqual({ resource: "Patient" });
      expect(typeof json.error.timestamp).toBe("string");
    });
  });

  describe("Smoke Check 2: Authentication & Token Lifecycle", () => {
    it("issues, decodes, and validates cryptographically signed JWT tokens", () => {
      const payload = {
        sub: "user-smoke-123",
        role: UserRole.DOCTOR,
        name: "Dr. Sarah Croft",
        email: "doctor.croft@goingmerryhms.org",
      };

      const token = generateAccessToken(payload);
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);

      const verified = verifyToken(token);
      expect(verified).not.toBeNull();
      expect(verified?.sub).toBe("user-smoke-123");
      expect(verified?.role).toBe(UserRole.DOCTOR);
      expect(verified?.name).toBe("Dr. Sarah Croft");
    });

    it("safely rejects forged or corrupted tokens", () => {
      const corruptedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.corrupted.signature";
      const verified = verifyToken(corruptedToken);
      expect(verified).toBeNull();
    });
  });

  describe("Smoke Check 3: Outpatient Journey (Appointment -> Queue Token -> Consultation)", () => {
    it("validates appointment eligibility and generates standard queue token number", () => {
      const appointment = {
        id: "apt-smoke-01",
        status: AppointmentStatus.CONFIRMED,
        slotStart: new Date("2026-10-24T09:30:00Z"),
      };

      const eligibility = validateAppointmentEligibility(appointment, {
        now: new Date("2026-10-24T09:15:00Z"),
      });
      expect(eligibility.isEligible).toBe(true);

      const tokenNumber = formatQueueTokenNumber(42, "CARDIO");
      expect(tokenNumber).toBe("#CARD-42");
    });

    it("enforces deterministic consultation state transitions and blocks skipping", () => {
      expect(canTransitionQueueToken(QueueTokenStatus.WAITING, QueueTokenStatus.CALLED)).toBe(true);
      expect(canTransitionQueueToken(QueueTokenStatus.CALLED, QueueTokenStatus.IN_CONSULTATION)).toBe(true);
      expect(
        canTransitionQueueToken(QueueTokenStatus.IN_CONSULTATION, QueueTokenStatus.COMPLETED)
      ).toBe(true);

      // Block skipping directly from WAITING to COMPLETED without clinical consultation
      expect(() =>
        assertQueueTransition(QueueTokenStatus.WAITING, QueueTokenStatus.COMPLETED)
      ).toThrow(QueueStateError);
    });
  });

  describe("Smoke Check 4: Clinical Safety & Pharmacy Dispensation", () => {
    it("identifies high-risk allergy and drug-drug interactions before prescription finalization", () => {
      const patientAllergies = [{ allergen: "Penicillin", severity: "SEVERE" }];
      const prescribedMeds = ["Penicillin V 500mg", "Warfarin 5mg", "Aspirin 81mg"];

      const safety = SafetyCheckService.checkPrescriptionSafety(prescribedMeds, patientAllergies);
      expect(safety.hasConflicts).toBe(true);
      expect(safety.allergyConflicts).toHaveLength(1);
      expect(safety.allergyConflicts[0].allergen).toBe("Penicillin");
      expect(safety.interactionWarnings).toHaveLength(1);
      expect(safety.interactionWarnings[0].severity).toBe("SEVERE");
    });

    it("validates pharmacy dispense requests and computes full/partial dispensation status", () => {
      const dispenseReq = [
        { prescriptionItemId: "item-1", quantityDispensed: 10, batchId: "BATCH-A1" },
        { prescriptionItemId: "item-2", quantityDispensed: 5, batchId: "BATCH-B2" },
      ];

      const validationError = validateDispenseRequest(dispenseReq);
      expect(validationError).toBeNull();

      const completion = dispensingCompletionStatus([
        { quantityPrescribed: 10, quantityDispensed: 10 },
        { quantityPrescribed: 10, quantityDispensed: 5 },
      ]);
      expect(completion).toBe("PARTIAL");
    });
  });

  describe("Smoke Check 5: Billing, Invoicing & Refunds", () => {
    it("calculates accurate invoice totals with line item taxes, discounts, and waivers", () => {
      const invoice = calculateInvoiceTotals({
        lines: [
          { amount: 500, taxRatePercent: 10 },
          { amount: 200, taxRatePercent: 5 },
        ],
        discountAmounts: [50],
        waiverAmounts: [20],
      });

      // Subtotal = 700, Discount = 50, TaxableBase = 650.
      // Weighted tax = (500*0.1) + (200*0.05) = 60. Proportional tax = 60 * (650/700) = 55.71
      // Final total = 700 - 50 + 55.71 - 20 = 685.71
      expect(invoice.subtotal).toBe(700);
      expect(invoice.discount).toBe(50);
      expect(invoice.tax).toBe(55.71);
      expect(invoice.waiver).toBe(20);
      expect(invoice.finalTotal).toBe(685.71);
    });

    it("enforces refund boundaries preventing excess or zero refunds", () => {
      const validRefund = validateRefundRequest({
        originalPaymentAmount: 500,
        refundAmount: 250,
        reason: "Patient discharged early before procedure",
      });
      expect(validRefund.isValid).toBe(true);

      const excessRefund = validateRefundRequest({
        originalPaymentAmount: 500,
        refundAmount: 501,
        reason: "Over-refund test",
      });
      expect(excessRefund.isValid).toBe(false);
      expect(excessRefund.errorCode).toBe("BIL_REFUND_EXCEEDS_PAYMENT");
    });
  });

  describe("Smoke Check 6: Inpatient Bed & Ward Care Lifecycle", () => {
    it("validates clinical care note recording and MAR administration logging", () => {
      const noteValidation = validateCareNoteCreation({
        admissionId: "adm-smoke-1",
        note: "Patient resting comfortably. Vitals stable.",
        authorRole: "NURSE",
      });
      expect(noteValidation.isValid).toBe(true);

      const marValidation = validateMedicationAdministration({
        admissionId: "adm-smoke-1",
        prescriptionItemId: "rx-item-99",
        administeredAt: new Date(),
        doseGiven: "10mg IV",
      });
      expect(marValidation.isValid).toBe(true);
    });

    it("verifies doctor discharge readiness and discharge blocker gates", () => {
      // Non-doctor cannot sign off discharge readiness
      const unauthorizedReadiness = setDischargeReadiness({
        admissionId: "adm-smoke-1",
        ready: true,
        actorRole: "RECEPTIONIST",
      });
      expect(unauthorizedReadiness.isValid).toBe(false);
      expect(unauthorizedReadiness.errorCode).toBe("FORBIDDEN");

      // Doctor sign-off succeeds
      const doctorReadiness = setDischargeReadiness({
        admissionId: "adm-smoke-1",
        ready: true,
        actorRole: "DOCTOR",
      });
      expect(doctorReadiness.isValid).toBe(true);

      // Block discharge if discharge summary is not generated
      const dischargeCheck = canDischargePatient({
        dischargeReadinessConfirmed: true,
        hasDischargeSummary: false,
      });
      expect(dischargeCheck.allowed).toBe(false);
      expect(dischargeCheck.errorCode).toBe("IPD_DISCHARGE_SUMMARY_MISSING");
    });
  });

  describe("Smoke Check 7: Inventory Thresholds & Stock Movements", () => {
    it("evaluates low stock trigger and automatic alert resolution", () => {
      expect(validateThreshold(10, 50)).toBeNull();

      // Below threshold -> trigger OPEN alert
      expect(desiredAlertStatus(5, 10)).toBe(StockAlertStatus.OPEN);

      // Above threshold -> resolve existing alert
      expect(desiredAlertStatus(15, 10, StockAlertStatus.OPEN)).toBe(StockAlertStatus.RESOLVED);
    });

    it("validates batch transfer requests and state progression", () => {
      const sameLocationTransfer = validateTransferRequest({
        quantity: 50,
        fromLocationId: "MAIN_DEPOT",
        toLocationId: "MAIN_DEPOT",
      });
      expect(sameLocationTransfer).toBe("INV_TRANSFER_SAME_LOCATION");

      expect(canTransitionTransfer(StockTransferStatus.REQUESTED, StockTransferStatus.DISPATCHED)).toBe(true);
      expect(canTransitionTransfer(StockTransferStatus.DISPATCHED, StockTransferStatus.RECEIVED)).toBe(true);
      expect(canTransitionTransfer(StockTransferStatus.RECEIVED, StockTransferStatus.REQUESTED)).toBe(false);
    });
  });
});
