import { describe, expect, it } from "vitest";
import { sessionContainsSlot, validateBookingWindow } from "@/server/domain/appointment-booking";

describe("APT-03 booking rules", () => {
  it("rejects past and inverted windows", () => {
    const now = new Date("2026-09-17T10:00:00.000Z");
    expect(
      validateBookingWindow(
        {
          slotStart: new Date("2026-09-17T09:00:00.000Z"),
          slotEnd: new Date("2026-09-17T09:15:00.000Z"),
        },
        now
      )
    ).toBe("APT_PAST_SLOT");
    expect(
      validateBookingWindow(
        {
          slotStart: new Date("2026-09-18T10:30:00.000Z"),
          slotEnd: new Date("2026-09-18T10:15:00.000Z"),
        },
        now
      )
    ).toBe("APT_INVALID_SLOT");
  });

  it("accepts only aligned slots contained by the clinic session", () => {
    const session = { startTime: "09:00", endTime: "12:00", slotDurationMinutes: 30 };
    expect(
      sessionContainsSlot(
        { slotStart: new Date(2026, 8, 18, 9, 30), slotEnd: new Date(2026, 8, 18, 10, 0) },
        session
      )
    ).toBe(true);
    expect(
      sessionContainsSlot(
        { slotStart: new Date(2026, 8, 18, 9, 15), slotEnd: new Date(2026, 8, 18, 9, 45) },
        session
      )
    ).toBe(false);
    expect(
      sessionContainsSlot(
        { slotStart: new Date(2026, 8, 18, 11, 45), slotEnd: new Date(2026, 8, 18, 12, 15) },
        session
      )
    ).toBe(false);
  });

  describe("AI-02 no-show prediction and appointment optimization", () => {
    it("calculates low risk for reliable patients with short lead times", async () => {
      const { calculateNoShowRisk } = await import(
        "@/server/domain/appointment-booking"
      );
      const res = calculateNoShowRisk({
        pastNoShowsCount: 0,
        totalPastAppointments: 5,
        leadDays: 1,
        isFollowUp: true,
      });

      expect(res.level).toBe("LOW");
      expect(res.riskScore).toBeLessThan(0.3);
      expect(res.isAdvisory).toBe(true);
      expect(res.recommendedReminderFrequency).toBe("STANDARD");
      expect(res.factors.length).toBeGreaterThan(0);
    });

    it("calculates high risk and intensive reminders for high past no-show rates and long lead times", async () => {
      const { calculateNoShowRisk } = await import(
        "@/server/domain/appointment-booking"
      );
      const res = calculateNoShowRisk({
        pastNoShowsCount: 3,
        totalPastAppointments: 4,
        leadDays: 35,
        previousCancellationsCount: 3,
      });

      expect(res.level).toBe("HIGH");
      expect(res.riskScore).toBeGreaterThanOrEqual(0.6);
      expect(res.isAdvisory).toBe(true);
      expect(res.recommendedReminderFrequency).toBe("INTENSIVE");
      expect(res.suggestedMitigations).toContain(
        "Schedule automated 48h, 24h, and 2h SMS reminders (NOT-02)"
      );
    });

    it("calculates safe overbooking buffer and risk-adjusted clinic capacity", async () => {
      const { calculateOverbookingRecommendation } = await import(
        "@/server/domain/appointment-booking"
      );
      const res = calculateOverbookingRecommendation({
        slotCount: 20,
        averageNoShowRate: 0.2,
        targetUtilization: 95,
      });

      expect(res.scheduledSlots).toBe(20);
      expect(res.historicalNoShowRate).toBe(20.0);
      expect(res.suggestedBufferSlots).toBeGreaterThanOrEqual(1);
      expect(res.suggestedBufferSlots).toBeLessThanOrEqual(5);
      expect(res.riskAdjustedCapacity).toBe(20 + res.suggestedBufferSlots);
      expect(res.isAdvisory).toBe(true);
    });
  });
});

