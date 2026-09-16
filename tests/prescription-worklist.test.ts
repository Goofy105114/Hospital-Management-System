import { describe, expect, it } from "vitest";
import { PrescriptionStatus } from "@prisma/client";
import { assessPrescriptionEligibility } from "@/server/domain/prescription-eligibility";

describe("PHA-01 prescription eligibility", () => {
  const now = new Date("2026-09-17T10:00:00.000Z");

  it("rejects expired and already dispensed prescriptions", () => {
    expect(
      assessPrescriptionEligibility({
        status: PrescriptionStatus.VALIDATED,
        createdAt: new Date("2026-07-01T00:00:00Z"),
        now,
      })
    ).toBe("PHA_RX_EXPIRED");
    expect(
      assessPrescriptionEligibility({ status: PrescriptionStatus.DISPENSED, createdAt: now, now })
    ).toBe("PHA_RX_ALREADY_DISPENSED");
  });

  it("allows a current finalized prescription with active medicines", () => {
    expect(
      assessPrescriptionEligibility({
        status: PrescriptionStatus.FINALIZED,
        createdAt: new Date("2026-09-10T00:00:00Z"),
        now,
      })
    ).toBeNull();
  });
});
