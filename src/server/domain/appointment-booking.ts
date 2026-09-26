import { AppointmentStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// APT-03 — Booking window validation helpers
// ---------------------------------------------------------------------------

export type BookingWindow = { slotStart: Date; slotEnd: Date };

export function validateBookingWindow(window: BookingWindow, now = new Date()): string | null {
  if (!Number.isFinite(window.slotStart.getTime()) || !Number.isFinite(window.slotEnd.getTime())) {
    return "APT_INVALID_SLOT";
  }
  if (window.slotStart <= now) return "APT_PAST_SLOT";
  if (window.slotEnd <= window.slotStart) return "APT_INVALID_SLOT";
  return null;
}

export function timeOfDayMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function sessionContainsSlot(
  window: BookingWindow,
  session: { startTime: string; endTime: string; slotDurationMinutes: number }
): boolean {
  const [startHour, startMinute] = session.startTime.split(":").map(Number);
  const [endHour, endMinute] = session.endTime.split(":").map(Number);
  const sessionStart = startHour * 60 + startMinute;
  const sessionEnd = endHour * 60 + endMinute;
  const slotStart = timeOfDayMinutes(window.slotStart);
  const slotEnd = timeOfDayMinutes(window.slotEnd);
  const duration = (window.slotEnd.getTime() - window.slotStart.getTime()) / 60_000;

  return (
    window.slotStart.toDateString() === window.slotEnd.toDateString() &&
    slotStart >= sessionStart &&
    slotEnd <= sessionEnd &&
    duration === session.slotDurationMinutes &&
    (slotStart - sessionStart) % session.slotDurationMinutes === 0
  );
}

// ---------------------------------------------------------------------------
// SCH-03 — Slot duration and capacity validation
// ---------------------------------------------------------------------------

/**
 * Validates the slot-config update payload for a clinic session (SCH-03).
 *
 * slotDurationMinutes: must be a positive integer between 5 and 120 (minutes).
 * maxCapacity:         must be a positive integer between 1 and 500.
 *
 * Returns a module-namespaced error code string on failure, null on success.
 */
export function validateSlotConfig(input: {
  slotDurationMinutes?: unknown;
  maxCapacity?: unknown;
}): string | null {
  if (input.slotDurationMinutes !== undefined) {
    const d = Number(input.slotDurationMinutes);
    if (!Number.isInteger(d) || d < 5 || d > 120) {
      return "SCH_INVALID_SLOT_DURATION";
    }
  }
  if (input.maxCapacity !== undefined) {
    const c = Number(input.maxCapacity);
    if (!Number.isInteger(c) || c < 1 || c > 500) {
      return "SCH_INVALID_MAX_CAPACITY";
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// APT-06 — Appointment lifecycle state machine
// ---------------------------------------------------------------------------

/**
 * Legal status transitions for the appointment lifecycle (APT-06).
 *
 * CONFIRMED   → CHECKED_IN | CANCELLED | NO_SHOW | RESCHEDULED
 * CHECKED_IN  → IN_PROGRESS | CANCELLED | NO_SHOW
 * IN_PROGRESS → COMPLETED
 * Terminal states: COMPLETED, CANCELLED, NO_SHOW, RESCHEDULED
 */
const APPOINTMENT_TRANSITIONS: Record<AppointmentStatus, AppointmentStatus[]> = {
  CONFIRMED: [
    AppointmentStatus.CHECKED_IN,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
    AppointmentStatus.RESCHEDULED,
  ],
  CHECKED_IN: [
    AppointmentStatus.IN_PROGRESS,
    AppointmentStatus.CANCELLED,
    AppointmentStatus.NO_SHOW,
  ],
  IN_PROGRESS: [AppointmentStatus.COMPLETED],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
  RESCHEDULED: [],
};

export function canTransitionAppointment(from: AppointmentStatus, to: AppointmentStatus): boolean {
  return APPOINTMENT_TRANSITIONS[from]?.includes(to) ?? false;
}

export class AppointmentLifecycleError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    public readonly details?: Record<string, unknown>
  ) {
    super(code);
  }
}

// ---------------------------------------------------------------------------
// AI-02 — No-show prediction and appointment optimization
// ---------------------------------------------------------------------------

export interface NoShowRiskInput {
  pastNoShowsCount?: number;
  totalPastAppointments?: number;
  leadDays?: number;
  isFollowUp?: boolean;
  previousCancellationsCount?: number;
}

export interface NoShowRiskResult {
  riskScore: number;
  level: "LOW" | "MODERATE" | "HIGH";
  factors: string[];
  suggestedMitigations: string[];
  recommendedReminderFrequency: "STANDARD" | "ENHANCED" | "INTENSIVE";
  isAdvisory: true;
}

export function calculateNoShowRisk(input: NoShowRiskInput): NoShowRiskResult {
  const pastNoShows = Math.max(0, input.pastNoShowsCount ?? 0);
  const totalAppts = Math.max(0, input.totalPastAppointments ?? 0);
  const leadDays = Math.max(0, input.leadDays ?? 0);
  const prevCancellations = Math.max(0, input.previousCancellationsCount ?? 0);
  const isFollowUp = !!input.isFollowUp;

  let baseScore = 0.1;
  const factors: string[] = [];
  const mitigations: string[] = [];

  // Historical no-show rate factor
  if (totalAppts > 0 && pastNoShows > 0) {
    const rate = pastNoShows / totalAppts;
    if (rate >= 0.5) {
      baseScore += 0.4;
      factors.push(`High historical no-show rate (${Math.round(rate * 100)}% of past appointments)`);
    } else if (rate >= 0.25) {
      baseScore += 0.25;
      factors.push(`Moderate historical no-show rate (${Math.round(rate * 100)}% of past appointments)`);
    } else {
      baseScore += 0.1;
      factors.push(`Occasional past no-show recorded (${pastNoShows} instance)`);
    }
  } else if (pastNoShows > 0) {
    baseScore += Math.min(0.4, pastNoShows * 0.2);
    factors.push(`${pastNoShows} past no-show(s) on file`);
  } else if (totalAppts >= 3 && pastNoShows === 0) {
    baseScore -= 0.05;
    factors.push("Consistent attendance record with zero past no-shows");
  }

  // Booking lead time factor
  if (leadDays > 30) {
    baseScore += 0.25;
    factors.push(`Long advance booking lead time (${leadDays} days in advance)`);
  } else if (leadDays > 14) {
    baseScore += 0.15;
    factors.push(`Booking made ${leadDays} days in advance`);
  } else if (leadDays <= 1) {
    baseScore -= 0.05;
    factors.push("Same-day or next-day booking (high immediacy)");
  }

  // Cancellation history factor
  if (prevCancellations >= 3) {
    baseScore += 0.1;
    factors.push("Multiple prior appointment cancellations");
  }

  // Appointment type factor
  if (isFollowUp) {
    baseScore -= 0.05;
    factors.push("Follow-up appointment with established treatment continuity");
  } else if (totalAppts === 0) {
    baseScore += 0.05;
    factors.push("New patient with no prior visit history");
  }

  // Clamping score between 0.05 and 0.95
  const riskScore = parseFloat(Math.min(0.95, Math.max(0.05, baseScore)).toFixed(2));

  let level: "LOW" | "MODERATE" | "HIGH" = "LOW";
  let reminderFrequency: "STANDARD" | "ENHANCED" | "INTENSIVE" = "STANDARD";

  if (riskScore >= 0.6) {
    level = "HIGH";
    reminderFrequency = "INTENSIVE";
    mitigations.push("Schedule automated 48h, 24h, and 2h SMS reminders (NOT-02)");
    mitigations.push("Recommend staff telephone confirmation 24 hours prior");
    mitigations.push("Flag slot for optional standby waitlist backup allocation");
  } else if (riskScore >= 0.3) {
    level = "MODERATE";
    reminderFrequency = "ENHANCED";
    mitigations.push("Send 24h pre-appointment confirmation prompt via SMS/Email");
    mitigations.push("Provide one-click rescheduling link in reminder message");
  } else {
    level = "LOW";
    reminderFrequency = "STANDARD";
    mitigations.push("Standard automated 24-hour appointment reminder");
  }

  return {
    riskScore,
    level,
    factors,
    suggestedMitigations: mitigations,
    recommendedReminderFrequency: reminderFrequency,
    isAdvisory: true,
  };
}

export interface OverbookingOptimizationInput {
  slotCount: number;
  averageNoShowRate?: number;
  targetUtilization?: number;
}

export interface OverbookingOptimizationResult {
  scheduledSlots: number;
  historicalNoShowRate: number;
  suggestedBufferSlots: number;
  targetUtilizationPercent: number;
  estimatedPatientAttendance: number;
  riskAdjustedCapacity: number;
  isAdvisory: true;
}

export function calculateOverbookingRecommendation(
  input: OverbookingOptimizationInput
): OverbookingOptimizationResult {
  const slots = Math.max(1, input.slotCount);
  const noShowRate = Math.min(0.5, Math.max(0.0, input.averageNoShowRate ?? 0.15));
  const targetUtil = Math.min(100, Math.max(50, input.targetUtilization ?? 95));

  const expectedNoShows = slots * noShowRate;
  const suggestedBuffer = Math.min(
    Math.floor(slots * 0.25),
    Math.round(expectedNoShows * 0.6)
  );

  const riskAdjustedCap = slots + suggestedBuffer;
  const estimatedAttendance = Math.round(riskAdjustedCap * (1 - noShowRate));

  return {
    scheduledSlots: slots,
    historicalNoShowRate: parseFloat((noShowRate * 100).toFixed(1)),
    suggestedBufferSlots: suggestedBuffer,
    targetUtilizationPercent: targetUtil,
    estimatedPatientAttendance: estimatedAttendance,
    riskAdjustedCapacity: riskAdjustedCap,
    isAdvisory: true,
  };
}

