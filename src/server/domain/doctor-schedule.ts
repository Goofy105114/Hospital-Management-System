export interface ClinicSessionInput {
  id?: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  roomNumber?: string | null;
  slotDurationMinutes?: number;
  maxCapacity?: number;
  isActive?: boolean;
}

export function parseTimeToMinutes(timeStr: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

export function validateClinicSession(input: Partial<ClinicSessionInput>): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (!input.doctorId) {
    return {
      isValid: false,
      errorCode: "SCH_INVALID_DOCTOR",
      errorMessage: "Doctor ID is required",
    };
  }

  if (
    input.dayOfWeek === undefined ||
    !Number.isInteger(input.dayOfWeek) ||
    input.dayOfWeek < 0 ||
    input.dayOfWeek > 6
  ) {
    return {
      isValid: false,
      errorCode: "SCH_INVALID_DAY_OF_WEEK",
      errorMessage: "dayOfWeek must be an integer between 0 (Sunday) and 6 (Saturday)",
    };
  }

  if (!input.startTime || !input.endTime) {
    return {
      isValid: false,
      errorCode: "SCH_INVALID_TIME_RANGE",
      errorMessage: "Both startTime and endTime are required",
    };
  }

  const startMinutes = parseTimeToMinutes(input.startTime);
  const endMinutes = parseTimeToMinutes(input.endTime);

  if (startMinutes === null || endMinutes === null) {
    return {
      isValid: false,
      errorCode: "SCH_INVALID_TIME_FORMAT",
      errorMessage: "Times must be in valid 24-hour HH:mm format",
    };
  }

  if (startMinutes >= endMinutes) {
    return {
      isValid: false,
      errorCode: "SCH_INVALID_TIME_RANGE",
      errorMessage: "Session startTime must precede endTime",
    };
  }

  if (input.slotDurationMinutes !== undefined) {
    if (
      !Number.isInteger(input.slotDurationMinutes) ||
      input.slotDurationMinutes < 5 ||
      input.slotDurationMinutes > 120
    ) {
      return {
        isValid: false,
        errorCode: "SCH_INVALID_SLOT_DURATION",
        errorMessage: "slotDurationMinutes must be an integer between 5 and 120 minutes",
      };
    }
  }

  if (input.maxCapacity !== undefined) {
    if (!Number.isInteger(input.maxCapacity) || input.maxCapacity < 1 || input.maxCapacity > 500) {
      return {
        isValid: false,
        errorCode: "SCH_INVALID_MAX_CAPACITY",
        errorMessage: "maxCapacity must be an integer between 1 and 500",
      };
    }
  }

  return { isValid: true };
}

export function detectSessionOverlap(
  candidate: { id?: string; dayOfWeek: number; startTime: string; endTime: string },
  existingSessions: Array<{
    id: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isActive?: boolean;
  }>
): boolean {
  const candidateStart = parseTimeToMinutes(candidate.startTime);
  const candidateEnd = parseTimeToMinutes(candidate.endTime);

  if (candidateStart === null || candidateEnd === null) return false;

  for (const session of existingSessions) {
    if (candidate.id && session.id === candidate.id) continue;
    if (session.isActive === false) continue;
    if (session.dayOfWeek !== candidate.dayOfWeek) continue;

    const sessionStart = parseTimeToMinutes(session.startTime);
    const sessionEnd = parseTimeToMinutes(session.endTime);

    if (sessionStart === null || sessionEnd === null) continue;

    // Overlap condition: max(start1, start2) < min(end1, end2)
    // Note: back-to-back (start == end) does NOT overlap
    const maxStart = Math.max(candidateStart, sessionStart);
    const minEnd = Math.min(candidateEnd, sessionEnd);

    if (maxStart < minEnd) {
      return true;
    }
  }

  return false;
}

export function canManageDoctorSchedule(
  actorRole?: string | null,
  actorUserId?: string | null,
  targetDoctorUserId?: string | null
): boolean {
  if (!actorRole) return false;
  if (actorRole === "SUPER_ADMIN" || actorRole === "ADMIN") return true;
  if (
    actorRole === "DOCTOR" &&
    actorUserId &&
    targetDoctorUserId &&
    actorUserId === targetDoctorUserId
  ) {
    return true;
  }
  return false;
}
