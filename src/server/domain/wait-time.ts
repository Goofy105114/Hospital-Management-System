export type WaitTimeFeatures = {
  queuePosition: number;
  avgConsultationMinutes: number;
  activeWalkIns: number;
  doctorAvailable: boolean;
  appointmentType?: string;
};

export function deterministicWaitEstimate(features: WaitTimeFeatures): number {
  const ahead = Math.max(0, features.queuePosition);
  const typeFactor =
    features.appointmentType === "EMERGENCY" ? 0.5 : features.appointmentType === "NEW" ? 1.15 : 1;
  const walkInPressure = Math.min(30, features.activeWalkIns * 2);
  const availabilityDelay = features.doctorAvailable ? 0 : 15;
  return Math.max(
    5,
    Math.round(
      ahead * features.avgConsultationMinutes * typeFactor + walkInPressure + availabilityDelay
    )
  );
}
