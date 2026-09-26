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

// ---------------------------------------------------------------------------
// QUE-03 — Live queue display and patient queue status
// ---------------------------------------------------------------------------

export interface QueuePositionResult {
  positionInQueue: number;
  patientsAhead: number;
  estimatedWaitMinutes: number;
}

export function calculateQueuePositionAndEstimate(
  waitingTokens: Array<{ id: string; priority?: string; sequenceNumber?: number }>,
  targetTokenId: string,
  avgMinutesPerPatient: number = 15
): QueuePositionResult {
  const index = waitingTokens.findIndex((t) => t.id === targetTokenId);
  if (index === -1) {
    return {
      positionInQueue: 0,
      patientsAhead: 0,
      estimatedWaitMinutes: 0,
    };
  }

  const positionInQueue = index + 1;
  const patientsAhead = index;
  const estimatedWaitMinutes = patientsAhead * avgMinutesPerPatient;

  return {
    positionInQueue,
    patientsAhead,
    estimatedWaitMinutes,
  };
}

export function formatLiveDisplayBoard(
  tokens: Array<{
    tokenNumber: string;
    status: QueueTokenStatus | string;
    priority?: string;
    roomNumber?: string | null;
    doctorName?: string | null;
    sequenceNumber?: number;
  }>,
  avgMinutesPerPatient: number = 15
) {
  const currentlyServing = tokens
    .filter((t) => t.status === "CALLED" || t.status === "IN_CONSULTATION")
    .map((t) => ({
      tokenNumber: t.tokenNumber,
      roomNumber: t.roomNumber || null,
      doctorName: t.doctorName || null,
      status: t.status as "CALLED" | "IN_CONSULTATION",
    }));

  const waitingTokens = tokens.filter((t) => t.status === "WAITING");

  const nextWaiting = waitingTokens.slice(0, 10).map((t, idx) => ({
    tokenNumber: t.tokenNumber,
    priority: (t.priority || "NORMAL") as any,
    estimatedWaitMinutes: idx * avgMinutesPerPatient,
  }));

  return {
    currentlyServing,
    nextWaiting,
    totalWaitingCount: waitingTokens.length,
  };
}

