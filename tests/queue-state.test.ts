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

  describe("QUE-03 — Live queue display and patient queue status", () => {
    it("calculates accurate queue position, patients ahead, and estimated wait minutes", async () => {
      const { calculateQueuePositionAndEstimate } = await import(
        "@/server/domain/queue-state"
      );

      const waitingTokens = [
        { id: "tok-1", priority: "NORMAL", sequenceNumber: 1 },
        { id: "tok-2", priority: "NORMAL", sequenceNumber: 2 },
        { id: "tok-3", priority: "NORMAL", sequenceNumber: 3 },
      ];

      const resFirst = calculateQueuePositionAndEstimate(waitingTokens, "tok-1", 15);
      expect(resFirst.positionInQueue).toBe(1);
      expect(resFirst.patientsAhead).toBe(0);
      expect(resFirst.estimatedWaitMinutes).toBe(0);

      const resThird = calculateQueuePositionAndEstimate(waitingTokens, "tok-3", 15);
      expect(resThird.positionInQueue).toBe(3);
      expect(resThird.patientsAhead).toBe(2);
      expect(resThird.estimatedWaitMinutes).toBe(30);

      const notFound = calculateQueuePositionAndEstimate(waitingTokens, "tok-nonexistent", 15);
      expect(notFound.positionInQueue).toBe(0);
      expect(notFound.patientsAhead).toBe(0);
    });

    it("formats live display board with serving and next waiting queues", async () => {
      const { formatLiveDisplayBoard } = await import("@/server/domain/queue-state");

      const tokens = [
        { tokenNumber: "CA-001", status: "CALLED", roomNumber: "Room 101", doctorName: "Dr. Vance" },
        { tokenNumber: "CA-002", status: "IN_CONSULTATION", roomNumber: "Room 102", doctorName: "Dr. Jenkins" },
        { tokenNumber: "CA-003", status: "WAITING", priority: "PRIORITY" },
        { tokenNumber: "CA-004", status: "WAITING", priority: "NORMAL" },
      ];

      const board = formatLiveDisplayBoard(tokens, 15);
      expect(board.currentlyServing).toHaveLength(2);
      expect(board.currentlyServing[0].tokenNumber).toBe("CA-001");
      expect(board.nextWaiting).toHaveLength(2);
      expect(board.nextWaiting[0].tokenNumber).toBe("CA-003");
      expect(board.nextWaiting[0].estimatedWaitMinutes).toBe(0);
      expect(board.nextWaiting[1].estimatedWaitMinutes).toBe(15);
      expect(board.totalWaitingCount).toBe(2);
    });
  });
});

