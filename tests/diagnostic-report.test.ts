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
});
