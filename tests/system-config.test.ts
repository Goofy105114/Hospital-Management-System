import { describe, expect, it } from "vitest";
import {
  validateSystemSettings,
  validateIntegrationSettings,
  isMaintenanceModeActive,
  canBypassMaintenanceMode,
  DEFAULT_SYSTEM_SETTINGS,
  DEFAULT_INTEGRATION_SETTINGS,
} from "@/server/domain/system-config";

describe("ADM-04 system configuration and operational administration", () => {
  describe("system settings validation", () => {
    it("accepts valid default and custom system settings", () => {
      expect(validateSystemSettings(DEFAULT_SYSTEM_SETTINGS).isValid).toBe(true);

      const custom = {
        sessionTimeoutMinutes: 60,
        allowMultipleSessions: false,
        maintenanceMode: true,
        featureFlags: { aiWaitPrediction: true, kioskSelfCheckIn: false },
      };
      expect(validateSystemSettings(custom).isValid).toBe(true);
    });

    it("rejects invalid session timeout values", () => {
      const tooLow = validateSystemSettings({ sessionTimeoutMinutes: 4 });
      expect(tooLow.isValid).toBe(false);
      expect(tooLow.errorCode).toBe("ADM_INVALID_SESSION_TIMEOUT");

      const tooHigh = validateSystemSettings({ sessionTimeoutMinutes: 2000 });
      expect(tooHigh.isValid).toBe(false);
      expect(tooHigh.errorCode).toBe("ADM_INVALID_SESSION_TIMEOUT");

      const notInteger = validateSystemSettings({ sessionTimeoutMinutes: 15.5 });
      expect(notInteger.isValid).toBe(false);
      expect(notInteger.errorCode).toBe("ADM_INVALID_SESSION_TIMEOUT");
    });

    it("rejects invalid boolean flags and policy configurations", () => {
      const invalidConcurrent = validateSystemSettings({
        allowMultipleSessions: "true" as unknown as boolean,
      });
      expect(invalidConcurrent.isValid).toBe(false);
      expect(invalidConcurrent.errorCode).toBe("ADM_INVALID_CONCURRENT_SESSION_POLICY");

      const invalidMaintenance = validateSystemSettings({
        maintenanceMode: 1 as unknown as boolean,
      });
      expect(invalidMaintenance.isValid).toBe(false);
      expect(invalidMaintenance.errorCode).toBe("ADM_INVALID_MAINTENANCE_MODE");

      const invalidFeatureFlags = validateSystemSettings({
        featureFlags: { featureA: "enabled" as unknown as boolean },
      });
      expect(invalidFeatureFlags.isValid).toBe(false);
      expect(invalidFeatureFlags.errorCode).toBe("ADM_INVALID_FEATURE_FLAGS");
    });
  });

  describe("integration settings validation", () => {
    it("accepts valid integration providers", () => {
      expect(validateIntegrationSettings(DEFAULT_INTEGRATION_SETTINGS).isValid).toBe(true);
      expect(
        validateIntegrationSettings({
          smsProvider: "AWS_SNS",
          emailProvider: "SMTP",
          paymentProvider: "RAZORPAY",
        }).isValid
      ).toBe(true);
    });

    it("rejects invalid third-party integration providers", () => {
      const invalidSms = validateIntegrationSettings({ smsProvider: "UNKNOWN_SMS" });
      expect(invalidSms.isValid).toBe(false);
      expect(invalidSms.errorCode).toBe("ADM_INVALID_SMS_PROVIDER");

      const invalidEmail = validateIntegrationSettings({ emailProvider: "UNKNOWN_MAIL" });
      expect(invalidEmail.isValid).toBe(false);
      expect(invalidEmail.errorCode).toBe("ADM_INVALID_EMAIL_PROVIDER");

      const invalidPayment = validateIntegrationSettings({ paymentProvider: "UNKNOWN_PAY" });
      expect(invalidPayment.isValid).toBe(false);
      expect(invalidPayment.errorCode).toBe("ADM_INVALID_PAYMENT_PROVIDER");
    });
  });

  describe("operational maintenance-mode control", () => {
    it("correctly identifies maintenance mode state", () => {
      expect(isMaintenanceModeActive({ maintenanceMode: false })).toBe(false);
      expect(isMaintenanceModeActive({ maintenanceMode: true })).toBe(true);
      expect(isMaintenanceModeActive(null)).toBe(false);
    });

    it("permits only administrators to bypass operational maintenance mode", () => {
      expect(canBypassMaintenanceMode("SUPER_ADMIN")).toBe(true);
      expect(canBypassMaintenanceMode("ADMIN")).toBe(true);
      expect(canBypassMaintenanceMode("DOCTOR")).toBe(false);
      expect(canBypassMaintenanceMode("NURSE")).toBe(false);
      expect(canBypassMaintenanceMode("PATIENT")).toBe(false);
      expect(canBypassMaintenanceMode(null)).toBe(false);
    });
  });

  describe("TRC-01 authoritative 310-item SRS traceability backlog", () => {
    it("verifies the authoritative dataset contains exactly 310 items across 78 BRD features", async () => {
      const fs = await import("fs");
      const path = await import("path");
      const jsonPath = path.join(process.cwd(), "prisma", "traceability-items.json");
      expect(fs.existsSync(jsonPath)).toBe(true);

      const items = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
      expect(items.length).toBe(310);

      // Verify unique codes
      const codes = new Set(items.map((i: any) => i.code));
      expect(codes.size).toBe(310);

      // Verify all 78 features are covered
      const features = new Set(items.map((i: any) => i.featureId));
      expect(features.size).toBe(78);

      // Verify 16 canonical domains
      const expectedDomains = [
        "IAM", "PAT", "APT", "SCH", "ADM", "SEC",
        "QUE", "EMR", "PHA", "INV", "NOT",
        "DIA", "BIL", "IPD", "REP", "AI"
      ];
      const domains = new Set(items.map((i: any) => i.domain));
      for (const d of expectedDomains) {
        expect(domains.has(d)).toBe(true);
      }

      // Verify sprint distribution
      const bySprint: Record<string, number> = {};
      for (const item of items) {
        bySprint[item.sprint] = (bySprint[item.sprint] || 0) + 1;
        expect(item.title).toBeTruthy();
        expect(item.category).toBeTruthy();
      }

      expect(bySprint["Sprint 1"]).toBe(96);
      expect(bySprint["Sprint 2"]).toBe(96);
      expect(bySprint["Sprint 3"]).toBe(106);
      expect(bySprint["Sprint 4"]).toBe(12);
    });
  });
});

