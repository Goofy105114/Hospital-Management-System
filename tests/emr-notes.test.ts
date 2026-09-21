import { describe, expect, it } from "vitest";
import { EncounterStatus } from "@prisma/client";
import { canEditEncounterNotes } from "@/server/domain/encounter-state";

describe("EMR-04 clinical notes and encounter documentation", () => {
  it("permits editing notes only when encounter is IN_PROGRESS", () => {
    expect(canEditEncounterNotes(EncounterStatus.IN_PROGRESS)).toBe(true);
    expect(canEditEncounterNotes("IN_PROGRESS")).toBe(true);
  });

  it("locks notes and prevents direct editing once signed/finalized (EMR_NOTE_ALREADY_SIGNED)", () => {
    expect(canEditEncounterNotes(EncounterStatus.FINALIZED)).toBe(false);
    expect(canEditEncounterNotes("FINALIZED")).toBe(false);
    expect(canEditEncounterNotes(EncounterStatus.AMENDED)).toBe(false);
  });
});
