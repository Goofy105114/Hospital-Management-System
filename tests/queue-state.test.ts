import { describe, expect, it } from "vitest";
import { QueueTokenStatus } from "@prisma/client";
import {
  assertQueueTransition,
  canTransitionQueueToken,
  QueueStateError,
} from "@/server/domain/queue-state";

describe("QUE-05 state machine", () => {
  it("allows the normal consultation lifecycle", () => {
    expect(canTransitionQueueToken(QueueTokenStatus.WAITING, QueueTokenStatus.CALLED)).toBe(true);
    expect(canTransitionQueueToken(QueueTokenStatus.CALLED, QueueTokenStatus.IN_CONSULTATION)).toBe(
      true
    );
    expect(
      canTransitionQueueToken(QueueTokenStatus.IN_CONSULTATION, QueueTokenStatus.COMPLETED)
    ).toBe(true);
  });

  it("rejects skipping directly from waiting to complete", () => {
    expect(() =>
      assertQueueTransition(QueueTokenStatus.WAITING, QueueTokenStatus.COMPLETED)
    ).toThrow(QueueStateError);
  });
});
