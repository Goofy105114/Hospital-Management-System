import { AppointmentStatus } from "@prisma/client";

export interface CheckInEligibilityCandidate {
  id: string;
  status: AppointmentStatus;
  slotStart: Date | string;
  slotEnd?: Date | string;
  hasExistingToken?: boolean;
}

export interface EligibilityResult {
  isEligible: boolean;
  errorCode?: string;
  errorMessage?: string;
  statusCode?: number;
}

export function validateAppointmentEligibility(
  appointment: CheckInEligibilityCandidate | null | undefined,
  options?: {
    now?: Date;
    windowMinutesBefore?: number;
    windowMinutesAfter?: number;
    allowOverride?: boolean;
  }
): EligibilityResult {
  if (!appointment) {
    return {
      isEligible: false,
      errorCode: "APT_NOT_FOUND",
      errorMessage: "Appointment record not found",
      statusCode: 404,
    };
  }

  if (appointment.status === AppointmentStatus.CHECKED_IN || appointment.hasExistingToken) {
    return {
      isEligible: false,
      errorCode: "QUE_ALREADY_CHECKED_IN",
      errorMessage: "Patient has already checked in for this appointment",
      statusCode: 409,
    };
  }

  if (appointment.status !== AppointmentStatus.CONFIRMED) {
    return {
      isEligible: false,
      errorCode: "QUE_APPT_NOT_CONFIRMED",
      errorMessage: `Cannot check in appointment in status ${appointment.status}. Appointment must be CONFIRMED.`,
      statusCode: 422,
    };
  }

  const now = options?.now || new Date();
  const slotDate = new Date(appointment.slotStart);

  if (isNaN(slotDate.getTime())) {
    return {
      isEligible: false,
      errorCode: "APT_INVALID_SLOT",
      errorMessage: "Invalid appointment slot time",
      statusCode: 400,
    };
  }

  if (!options?.allowOverride) {
    const windowBefore = options?.windowMinutesBefore ?? 120; // 2 hours before
    const windowAfter = options?.windowMinutesAfter ?? 120; // 2 hours after

    const diffMinutes = (slotDate.getTime() - now.getTime()) / 60000;

    // diffMinutes > windowBefore means slot is too far in future
    // diffMinutes < -windowAfter means slot was too long ago in past
    if (diffMinutes > windowBefore || diffMinutes < -windowAfter) {
      return {
        isEligible: false,
        errorCode: "QUE_OUTSIDE_CHECKIN_WINDOW",
        errorMessage: "Appointment is outside the permissible check-in arrival window",
        statusCode: 422,
      };
    }
  }

  return { isEligible: true };
}

export function formatQueueTokenNumber(sequence: number, doctorCode = "A"): string {
  const cleanCode =
    doctorCode
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, 4)
      .toUpperCase() || "A";
  return `#${cleanCode}-${String(sequence).padStart(2, "0")}`;
}
