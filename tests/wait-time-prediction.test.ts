import { describe, expect, it } from "vitest";
import { deterministicWaitEstimate } from "@/server/domain/wait-time";

describe("AI-01 deterministic wait fallback", () => {
  it("uses queue position, consultation history, walk-ins and availability", () => {
    expect(
      deterministicWaitEstimate({
        queuePosition: 3,
        avgConsultationMinutes: 10,
        activeWalkIns: 2,
        doctorAvailable: true,
        appointmentType: "FOLLOW_UP",
      })
    ).toBe(34);
    expect(
      deterministicWaitEstimate({
        queuePosition: 3,
        avgConsultationMinutes: 10,
        activeWalkIns: 2,
        doctorAvailable: false,
        appointmentType: "FOLLOW_UP",
      })
    ).toBe(49);
  });

  it("keeps emergency estimates advisory and bounded by a minimum", () => {
    expect(
      deterministicWaitEstimate({
        queuePosition: 0,
        avgConsultationMinutes: 10,
        activeWalkIns: 0,
        doctorAvailable: true,
        appointmentType: "EMERGENCY",
      })
    ).toBe(5);
  });
});
