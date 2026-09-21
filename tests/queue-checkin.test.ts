import { describe, expect, it } from "vitest";
import { AppointmentStatus } from "@prisma/client";
import {
  validateAppointmentEligibility,
  formatQueueTokenNumber,
} from "@/server/domain/queue-checkin";

describe("QUE-01 patient check-in and arrival management", () => {
  const now = new Date("2026-10-24T10:00:00Z");

  describe("appointment eligibility validation", () => {
    it("rejects non-existent appointment lookup", () => {
      const result = validateAppointmentEligibility(null);
      expect(result.isEligible).toBe(false);
      expect(result.errorCode).toBe("APT_NOT_FOUND");
      expect(result.statusCode).toBe(404);
    });

    it("prevents duplicate check-in if already checked in or token exists", () => {
      const checkedInAppt = {
        id: "apt-01",
        status: AppointmentStatus.CHECKED_IN,
        slotStart: new Date("2026-10-24T10:15:00Z"),
      };
      const res1 = validateAppointmentEligibility(checkedInAppt, { now });
      expect(res1.isEligible).toBe(false);
      expect(res1.errorCode).toBe("QUE_ALREADY_CHECKED_IN");
      expect(res1.statusCode).toBe(409);

      const hasTokenAppt = {
        id: "apt-02",
        status: AppointmentStatus.CONFIRMED,
        slotStart: new Date("2026-10-24T10:15:00Z"),
        hasExistingToken: true,
      };
      const res2 = validateAppointmentEligibility(hasTokenAppt, { now });
      expect(res2.isEligible).toBe(false);
      expect(res2.errorCode).toBe("QUE_ALREADY_CHECKED_IN");
      expect(res2.statusCode).toBe(409);
    });

    it("rejects non-confirmed appointments (QUE_APPT_NOT_CONFIRMED)", () => {
      const cancelledAppt = {
        id: "apt-03",
        status: AppointmentStatus.CANCELLED,
        slotStart: new Date("2026-10-24T10:15:00Z"),
      };
      const res1 = validateAppointmentEligibility(cancelledAppt, { now });
      expect(res1.isEligible).toBe(false);
      expect(res1.errorCode).toBe("QUE_APPT_NOT_CONFIRMED");
      expect(res1.statusCode).toBe(422);

      const noShowAppt = {
        id: "apt-04",
        status: AppointmentStatus.NO_SHOW,
        slotStart: new Date("2026-10-24T10:15:00Z"),
      };
      const res2 = validateAppointmentEligibility(noShowAppt, { now });
      expect(res2.isEligible).toBe(false);
      expect(res2.errorCode).toBe("QUE_APPT_NOT_CONFIRMED");
      expect(res2.statusCode).toBe(422);
    });

    it("enforces arrival window validation unless overridden", () => {
      // Slot 4 hours in the future
      const futureAppt = {
        id: "apt-05",
        status: AppointmentStatus.CONFIRMED,
        slotStart: new Date("2026-10-24T14:00:00Z"),
      };
      const futureRes = validateAppointmentEligibility(futureAppt, { now });
      expect(futureRes.isEligible).toBe(false);
      expect(futureRes.errorCode).toBe("QUE_OUTSIDE_CHECKIN_WINDOW");
      expect(futureRes.statusCode).toBe(422);

      // Same future slot with staff override
      const overrideRes = validateAppointmentEligibility(futureAppt, {
        now,
        allowOverride: true,
      });
      expect(overrideRes.isEligible).toBe(true);

      // Slot 3 hours in the past
      const pastAppt = {
        id: "apt-06",
        status: AppointmentStatus.CONFIRMED,
        slotStart: new Date("2026-10-24T07:00:00Z"),
      };
      const pastRes = validateAppointmentEligibility(pastAppt, { now });
      expect(pastRes.isEligible).toBe(false);
      expect(pastRes.errorCode).toBe("QUE_OUTSIDE_CHECKIN_WINDOW");
      expect(pastRes.statusCode).toBe(422);
    });

    it("accepts a confirmed appointment within the arrival window", () => {
      const eligibleAppt = {
        id: "apt-07",
        status: AppointmentStatus.CONFIRMED,
        slotStart: new Date("2026-10-24T10:30:00Z"), // 30 mins ahead
      };
      const res = validateAppointmentEligibility(eligibleAppt, { now });
      expect(res.isEligible).toBe(true);
    });
  });

  describe("token formatting", () => {
    it("generates correctly padded token identifiers", () => {
      expect(formatQueueTokenNumber(1)).toBe("#A-01");
      expect(formatQueueTokenNumber(14)).toBe("#A-14");
      expect(formatQueueTokenNumber(99, "DR01")).toBe("#DR01-99");
    });
  });
});
