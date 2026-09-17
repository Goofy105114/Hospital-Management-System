export function canViewDiagnosticReport(input: {
  requesterRole: string;
  requesterUserId: string;
  patientUserId: string;
  releasedAt?: Date | null;
  orderingDoctorUserId?: string | null;
}): boolean {
  if (input.requesterRole === "ADMIN" || input.requesterRole === "SUPER_ADMIN") return true;
  if (input.requesterRole === "PATIENT") {
    return input.requesterUserId === input.patientUserId && Boolean(input.releasedAt);
  }
  if (input.requesterRole === "DOCTOR") {
    return input.requesterUserId === input.orderingDoctorUserId;
  }
  return false;
}
