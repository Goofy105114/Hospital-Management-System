import { QueueTokenStatus } from "@prisma/client";

const transitions: Record<QueueTokenStatus, QueueTokenStatus[]> = {
  WAITING: [QueueTokenStatus.CALLED, QueueTokenStatus.CANCELLED, QueueTokenStatus.TRANSFERRED],
  CALLED: [
    QueueTokenStatus.IN_CONSULTATION,
    QueueTokenStatus.NO_RESPONSE,
    QueueTokenStatus.CANCELLED,
  ],
  IN_CONSULTATION: [QueueTokenStatus.COMPLETED],
  COMPLETED: [],
  NO_RESPONSE: [QueueTokenStatus.WAITING],
  CANCELLED: [],
  TRANSFERRED: [],
};

export function canTransitionQueueToken(from: QueueTokenStatus, to: QueueTokenStatus): boolean {
  return transitions[from].includes(to);
}

export function assertQueueTransition(from: QueueTokenStatus, to: QueueTokenStatus): void {
  if (!canTransitionQueueToken(from, to)) {
    throw new QueueStateError("QUE_INVALID_STATE_TRANSITION", 422, { from, to });
  }
}

export class QueueStateError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(code);
  }
}

// ---------------------------------------------------------------------------
// QUE-02 — Token number format helper
// ---------------------------------------------------------------------------

/**
 * Generates a display token number in the format {DEPTPREFIX}-{3-digit seq}
 * per QUE-02 PRD: e.g. "CA-014" (Cardiology, 14th token today).
 *
 * deptCode: the Department.code value (e.g. "CARD", "NEUR", "PEDI").
 *           First 2 characters are taken, uppercased.
 * seq:      1-based daily sequence number per doctor.
 */
export function generateTokenNumber(deptCode: string, seq: number): string {
  const prefix = deptCode.slice(0, 2).toUpperCase();
  return `${prefix}-${String(seq).padStart(3, "0")}`;
}
