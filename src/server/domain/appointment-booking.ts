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
