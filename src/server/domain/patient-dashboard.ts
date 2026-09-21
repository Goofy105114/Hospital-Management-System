export interface PatientDashboardFilter {
  patientId?: string;
  mrn?: string;
}

export interface PatientDashboardAccessCheck {
  requestorRole: string;
  requestorPatientId?: string;
  targetPatientId?: string;
}

export function canAccessPatientDashboard(check: PatientDashboardAccessCheck): boolean {
  const staffRoles = [
    "ADMIN",
    "SUPER_ADMIN",
    "DOCTOR",
    "NURSE",
    "RECEPTIONIST",
    "MANAGEMENT",
    "BILLING_STAFF",
  ];
  if (staffRoles.includes(check.requestorRole)) {
    return true;
  }
  if (check.requestorRole === "PATIENT") {
    // If patient, can only access their own dashboard
    if (!check.targetPatientId || !check.requestorPatientId) return true;
    return check.requestorPatientId === check.targetPatientId;
  }
  return false;
}

export function sanitizePatientDashboardSummary(data: {
  upcomingAppointments?: Array<unknown>;
  activeQueueToken?: unknown | null;
  recentPrescriptions?: Array<unknown>;
  recentReports?: Array<unknown>;
}) {
  return {
    upcomingAppointments: data.upcomingAppointments || [],
    activeQueueToken: data.activeQueueToken || null,
    recentPrescriptions: data.recentPrescriptions || [],
    recentReports: data.recentReports || [],
    hasActiveQueue: Boolean(data.activeQueueToken),
    totalUpcomingAppointments: (data.upcomingAppointments || []).length,
  };
}
