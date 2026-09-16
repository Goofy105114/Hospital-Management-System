import { describe, it, expect } from "vitest";
import { acquireLock, releaseLock } from "@/lib/redis";

describe("Distributed Concurrency Locking (APT-03 / SEC-04)", () => {
  it("successfully acquires an available lock", async () => {
    const lockKey = `test-slot-${Date.now()}`;
    const acquired = await acquireLock(lockKey, 5);
    expect(acquired).toBe(true);

    // Immediate second attempt for the same key must be rejected (concurrency collision)
    const secondAttempt = await acquireLock(lockKey, 5);
    expect(secondAttempt).toBe(false);

    // Release lock
    await releaseLock(lockKey);

    // Third attempt after release must succeed
    const thirdAttempt = await acquireLock(lockKey, 5);
    expect(thirdAttempt).toBe(true);

    await releaseLock(lockKey);
  });
});
