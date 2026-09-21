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

export function canTransitionAppointment(
  from: AppointmentStatus,
  to: AppointmentStatus
): boolean {
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
