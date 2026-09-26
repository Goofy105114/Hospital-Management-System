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

  it("accepts slots formatted in UTC when time matches session operating window", () => {
    const session = { startTime: "09:00", endTime: "17:00", slotDurationMinutes: 15 };
    const utcStart = new Date("2026-09-28T09:30:00.000Z");
    const utcEnd = new Date("2026-09-28T09:45:00.000Z");
    expect(sessionContainsSlot({ slotStart: utcStart, slotEnd: utcEnd }, session)).toBe(true);
  });
});
