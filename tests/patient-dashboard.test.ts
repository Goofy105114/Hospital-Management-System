import { describe, expect, it } from "vitest";
import {
  canAccessPatientDashboard,
  sanitizePatientDashboardSummary,
} from "@/server/domain/patient-dashboard";

describe("REP-01 — Patient dashboard", () => {
  describe("access authorization", () => {
    it("allows staff members (ADMIN, DOCTOR, NURSE, RECEPTIONIST) to access any patient dashboard", () => {
      expect(
        canAccessPatientDashboard({
          requestorRole: "ADMIN",
          targetPatientId: "pat-123",
        })
      ).toBe(true);
      expect(
        canAccessPatientDashboard({
          requestorRole: "DOCTOR",
          targetPatientId: "pat-123",
        })
      ).toBe(true);
      expect(
        canAccessPatientDashboard({
          requestorRole: "NURSE",
          targetPatientId: "pat-123",
        })
      ).toBe(true);
    });

    it("allows patients to view their own dashboard", () => {
      expect(
        canAccessPatientDashboard({
          requestorRole: "PATIENT",
          requestorPatientId: "pat-123",
          targetPatientId: "pat-123",
        })
      ).toBe(true);
    });

    it("prevents patients from viewing other patients' dashboards", () => {
      expect(
        canAccessPatientDashboard({
          requestorRole: "PATIENT",
          requestorPatientId: "pat-123",
          targetPatientId: "pat-999",
        })
      ).toBe(false);
    });
  });

  describe("dashboard summary aggregation and business rules", () => {
    it("safely extracts active queue and calculates counts", () => {
      const summary = sanitizePatientDashboardSummary({
        upcomingAppointments: [{ id: "apt-1" }, { id: "apt-2" }],
        activeQueueToken: { id: "tok-1", tokenNumber: "#A-24" },
        recentPrescriptions: [{ id: "rx-1" }],
        recentReports: [],
      });

      expect(summary.hasActiveQueue).toBe(true);
      expect(summary.totalUpcomingAppointments).toBe(2);
      expect(summary.recentPrescriptions.length).toBe(1);
      expect(summary.recentReports.length).toBe(0);
    });

    it("handles empty/null modules without failing", () => {
      const summary = sanitizePatientDashboardSummary({});
      expect(summary.hasActiveQueue).toBe(false);
      expect(summary.totalUpcomingAppointments).toBe(0);
      expect(summary.upcomingAppointments).toEqual([]);
      expect(summary.activeQueueToken).toBeNull();
    });
  });
});
