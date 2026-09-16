import { describe, it, expect } from "vitest";
import { predictWaitTime } from "@/lib/openrouter";

describe("Queue Management & Estimation Logic (QUE-02 / AI-01)", () => {
  it("calculates deterministic wait-time fallback based on queue position and average consultation duration", async () => {
    // With 3 patients ahead and 12 min average, expected is 3 * 12 = 36 mins
    const res = await predictWaitTime(3, 12);
    expect(res.data.estimatedMinutes).toBe(36);
    expect(res.source).toBe("fallback");
  });

  it("enforces a minimum wait time floor of 5 minutes even for first in queue", async () => {
    const res = await predictWaitTime(0, 12);
    expect(res.data.estimatedMinutes).toBe(5);
  });

  it("formats token numbers with standard pad and departmental prefix", () => {
    const formatToken = (seq: number, prefix = "#A-") => `${prefix}${String(seq).padStart(2, "0")}`;
    expect(formatToken(1)).toBe("#A-01");
    expect(formatToken(24)).toBe("#A-24");
    expect(formatToken(105)).toBe("#A-105");
  });
});
