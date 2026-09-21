import { describe, expect, it } from "vitest";
import {
  validateClinicSession,
  detectSessionOverlap,
  canManageDoctorSchedule,
} from "@/server/domain/doctor-schedule";

describe("SCH-01 doctor schedule and clinic session management", () => {
  describe("clinic session validation", () => {
    it("validates a compliant clinic session configuration", () => {
      const valid = validateClinicSession({
        doctorId: "doc-01",
        dayOfWeek: 1, // Monday
        startTime: "09:00",
        endTime: "13:00",
        slotDurationMinutes: 15,
        maxCapacity: 20,
      });
      expect(valid.isValid).toBe(true);
    });

    it("rejects missing doctor and invalid day of week", () => {
      const noDoctor = validateClinicSession({
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "13:00",
      });
      expect(noDoctor.isValid).toBe(false);
      expect(noDoctor.errorCode).toBe("SCH_INVALID_DOCTOR");

      const invalidDay = validateClinicSession({
        doctorId: "doc-01",
        dayOfWeek: 7,
        startTime: "09:00",
        endTime: "13:00",
      });
      expect(invalidDay.isValid).toBe(false);
      expect(invalidDay.errorCode).toBe("SCH_INVALID_DAY_OF_WEEK");
    });

    it("enforces start time before end time and valid 24h format", () => {
      const inverted = validateClinicSession({
        doctorId: "doc-01",
        dayOfWeek: 2,
        startTime: "15:00",
        endTime: "10:00",
      });
      expect(inverted.isValid).toBe(false);
      expect(inverted.errorCode).toBe("SCH_INVALID_TIME_RANGE");

      const sameTime = validateClinicSession({
        doctorId: "doc-01",
        dayOfWeek: 2,
        startTime: "10:00",
        endTime: "10:00",
      });
      expect(sameTime.isValid).toBe(false);
      expect(sameTime.errorCode).toBe("SCH_INVALID_TIME_RANGE");

      const invalidFormat = validateClinicSession({
        doctorId: "doc-01",
        dayOfWeek: 2,
        startTime: "9:00 AM",
        endTime: "13:00",
      });
      expect(invalidFormat.isValid).toBe(false);
      expect(invalidFormat.errorCode).toBe("SCH_INVALID_TIME_FORMAT");
    });

    it("validates slot duration and capacity constraints", () => {
      const shortSlot = validateClinicSession({
        doctorId: "doc-01",
        dayOfWeek: 3,
        startTime: "09:00",
        endTime: "12:00",
        slotDurationMinutes: 2,
      });
      expect(shortSlot.isValid).toBe(false);
      expect(shortSlot.errorCode).toBe("SCH_INVALID_SLOT_DURATION");

      const zeroCapacity = validateClinicSession({
        doctorId: "doc-01",
        dayOfWeek: 3,
        startTime: "09:00",
        endTime: "12:00",
        maxCapacity: 0,
      });
      expect(zeroCapacity.isValid).toBe(false);
      expect(zeroCapacity.errorCode).toBe("SCH_INVALID_MAX_CAPACITY");
    });
  });

  describe("session overlap prevention (acceptance criteria)", () => {
    const existingSessions = [
      {
        id: "sch-01",
        dayOfWeek: 1, // Monday
        startTime: "09:00",
        endTime: "13:00",
        isActive: true,
      },
      {
        id: "sch-02",
        dayOfWeek: 1, // Monday
        startTime: "14:00",
        endTime: "18:00",
        isActive: true,
      },
      {
        id: "sch-03",
        dayOfWeek: 3, // Wednesday
        startTime: "09:00",
        endTime: "12:00",
        isActive: false, // Inactive
      },
    ];

    it("permits non-overlapping sessions on the same or different days", () => {
      // Different day
      expect(
        detectSessionOverlap(
          { dayOfWeek: 2, startTime: "09:00", endTime: "13:00" },
          existingSessions
        )
      ).toBe(false);

      // Same day, between existing sessions
      expect(
        detectSessionOverlap(
          { dayOfWeek: 1, startTime: "13:00", endTime: "14:00" },
          existingSessions
        )
      ).toBe(false);

      // Same day, after all sessions
      expect(
        detectSessionOverlap(
          { dayOfWeek: 1, startTime: "18:30", endTime: "20:00" },
          existingSessions
        )
      ).toBe(false);
    });

    it("permits back-to-back sessions without overlap", () => {
      // Ends exactly when existing begins (08:00 - 09:00, next is 09:00)
      expect(
        detectSessionOverlap(
          { dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
          existingSessions
        )
      ).toBe(false);

      // Begins exactly when existing ends (13:00 - 14:00, previous ended at 13:00)
      expect(
        detectSessionOverlap(
          { dayOfWeek: 1, startTime: "13:00", endTime: "14:00" },
          existingSessions
        )
      ).toBe(false);
    });

    it("detects and rejects overlapping sessions per doctor on the same day", () => {
      // Partial overlap at end
      expect(
        detectSessionOverlap(
          { dayOfWeek: 1, startTime: "12:00", endTime: "15:00" },
          existingSessions
        )
      ).toBe(true);

      // Partial overlap at start
      expect(
        detectSessionOverlap(
          { dayOfWeek: 1, startTime: "08:30", endTime: "10:00" },
          existingSessions
        )
      ).toBe(true);

      // Completely enclosed inside an existing session
      expect(
        detectSessionOverlap(
          { dayOfWeek: 1, startTime: "10:00", endTime: "12:00" },
          existingSessions
        )
      ).toBe(true);

      // Completely encloses an existing session
      expect(
        detectSessionOverlap(
          { dayOfWeek: 1, startTime: "08:00", endTime: "13:30" },
          existingSessions
        )
      ).toBe(true);
    });

    it("ignores inactive sessions when detecting overlaps", () => {
      // Wednesday session is inactive, so an overlapping slot is allowed
      expect(
        detectSessionOverlap(
          { dayOfWeek: 3, startTime: "09:30", endTime: "11:30" },
          existingSessions
        )
      ).toBe(false);
    });

    it("allows updating an existing session without conflicting with itself", () => {
      expect(
        detectSessionOverlap(
          { id: "sch-01", dayOfWeek: 1, startTime: "09:00", endTime: "13:30" },
          existingSessions
        )
      ).toBe(false);
    });
  });

  describe("schedule access permissions", () => {
    it("allows administrators and the doctor themselves to manage schedules", () => {
      expect(canManageDoctorSchedule("SUPER_ADMIN", "usr-admin", "usr-doc")).toBe(true);
      expect(canManageDoctorSchedule("ADMIN", "usr-admin", "usr-doc")).toBe(true);
      expect(canManageDoctorSchedule("DOCTOR", "usr-doc", "usr-doc")).toBe(true);
      expect(canManageDoctorSchedule("DOCTOR", "usr-doc-2", "usr-doc")).toBe(false);
      expect(canManageDoctorSchedule("NURSE", "usr-nurse", "usr-doc")).toBe(false);
      expect(canManageDoctorSchedule("PATIENT", "usr-patient", "usr-doc")).toBe(false);
    });
  });
});
