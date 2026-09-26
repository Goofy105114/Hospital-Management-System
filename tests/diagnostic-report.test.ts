import { describe, expect, it } from "vitest";
import { canViewDiagnosticReport } from "@/server/domain/diagnostic-report";

describe("DIA-05 report access", () => {
  it("never exposes unreleased reports to patients", () => {
    expect(
      canViewDiagnosticReport({
        requesterRole: "PATIENT",
        requesterUserId: "u1",
        patientUserId: "u1",
        releasedAt: null,
      })
    ).toBe(false);
    expect(
      canViewDiagnosticReport({
        requesterRole: "PATIENT",
        requesterUserId: "u1",
        patientUserId: "u1",
        releasedAt: new Date(),
      })
    ).toBe(true);
  });

  it("restricts patients and doctors to their record scope", () => {
    expect(
      canViewDiagnosticReport({
        requesterRole: "PATIENT",
        requesterUserId: "u2",
        patientUserId: "u1",
        releasedAt: new Date(),
      })
    ).toBe(false);
    expect(
      canViewDiagnosticReport({
        requesterRole: "DOCTOR",
        requesterUserId: "d1",
        patientUserId: "u1",
        orderingDoctorUserId: "d1",
      })
    ).toBe(true);
    expect(
      canViewDiagnosticReport({
        requesterRole: "DOCTOR",
        requesterUserId: "d2",
        patientUserId: "u1",
        orderingDoctorUserId: "d1",
      })
    ).toBe(false);
  });

  describe("DIA-03 — Specimen and diagnostic work queue management", () => {
    it("validates specimen collection input", async () => {
      const { validateSpecimenCollection } = await import(
        "@/server/domain/diagnostic-report"
      );

      const valid = validateSpecimenCollection({
        orderId: "ord-123",
        specimenType: "BLOOD",
        barcode: "SMPL-2026-9901",
        collectedBy: "Lab Tech John",
      });
      expect(valid.isValid).toBe(true);

      const missingBarcode = validateSpecimenCollection({
        orderId: "ord-123",
        specimenType: "BLOOD",
      });
      expect(missingBarcode.isValid).toBe(false);
      expect(missingBarcode.errorCode).toBe("DIA_BARCODE_REQUIRED");

      const missingType = validateSpecimenCollection({
        orderId: "ord-123",
        barcode: "SMPL-123",
      });
      expect(missingType.isValid).toBe(false);
      expect(missingType.errorCode).toBe("DIA_SPECIMEN_TYPE_REQUIRED");
    });

    it("enforces diagnostic order status transition rules", async () => {
      const { canTransitionDiagnosticOrderStatus } = await import(
        "@/server/domain/diagnostic-report"
      );

      expect(canTransitionDiagnosticOrderStatus("ORDERED", "SAMPLE_COLLECTED").allowed).toBe(true);
      expect(canTransitionDiagnosticOrderStatus("SAMPLE_COLLECTED", "PROCESSING").allowed).toBe(true);
      expect(canTransitionDiagnosticOrderStatus("PROCESSING", "RESULTED").allowed).toBe(true);
      expect(canTransitionDiagnosticOrderStatus("RESULTED", "VERIFIED").allowed).toBe(true);

      // Invalid skipping or invalid backwards
      expect(canTransitionDiagnosticOrderStatus("ORDERED", "VERIFIED").allowed).toBe(false);
      expect(canTransitionDiagnosticOrderStatus("VERIFIED", "PROCESSING").allowed).toBe(false);
      expect(canTransitionDiagnosticOrderStatus("CANCELLED", "ORDERED").allowed).toBe(false);
    });

    it("accurately calculates specimen SLA remaining and breach status", async () => {
      const { calculateSpecimenSlaRemaining } = await import(
        "@/server/domain/diagnostic-report"
      );

      const now = new Date("2026-09-22T12:00:00.000Z");
      const orderCreated4hAgo = new Date("2026-09-22T08:00:00.000Z");
      const sla1 = calculateSpecimenSlaRemaining(orderCreated4hAgo, 24, now);
      expect(sla1.elapsedHours).toBe(4);
      expect(sla1.remainingHours).toBe(20);
      expect(sla1.isBreached).toBe(false);

      const orderCreated30hAgo = new Date("2026-09-21T06:00:00.000Z");
      const sla2 = calculateSpecimenSlaRemaining(orderCreated30hAgo, 24, now);
      expect(sla2.elapsedHours).toBe(30);
      expect(sla2.remainingHours).toBe(-6);
      expect(sla2.isBreached).toBe(true);
    });
  });
});

