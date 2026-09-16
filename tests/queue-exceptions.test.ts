import { describe, expect, it } from "vitest";
import { QueueTokenStatus } from "@prisma/client";
import { canTransitionQueueToken } from "@/server/domain/queue-state";

describe("QUE-06 exceptional transitions", () => {
  it("allows waiting tokens to transfer or cancel without completing them", () => {
    expect(canTransitionQueueToken(QueueTokenStatus.WAITING, QueueTokenStatus.TRANSFERRED)).toBe(
      true
    );
    expect(canTransitionQueueToken(QueueTokenStatus.WAITING, QueueTokenStatus.CANCELLED)).toBe(
      true
    );
    expect(canTransitionQueueToken(QueueTokenStatus.WAITING, QueueTokenStatus.COMPLETED)).toBe(
      false
    );
  });

  it("keeps no-response distinct from cancellation", () => {
    expect(canTransitionQueueToken(QueueTokenStatus.CALLED, QueueTokenStatus.NO_RESPONSE)).toBe(
      true
    );
    expect(QueueTokenStatus.NO_RESPONSE).not.toBe(QueueTokenStatus.CANCELLED);
  });
});
