import { UserRole } from "@prisma/client";

export const CLINICAL_ROLES: UserRole[] = [
  UserRole.DOCTOR,
  UserRole.NURSE,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
];

export interface BreakGlassRequestInput {
  patientId?: string;
  justification?: string;
  actorRole: UserRole;
  actorId: string;
}

export interface BreakGlassValidationResult {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
}

export function validateBreakGlassRequest(input: BreakGlassRequestInput): BreakGlassValidationResult {
  if (!CLINICAL_ROLES.includes(input.actorRole)) {
    return {
      isValid: false,
      errorCode: "FORBIDDEN",
      errorMessage: "Only authorized clinical and administrative personnel may request emergency break-glass access",
    };
  }

  if (!input.patientId || typeof input.patientId !== "string" || input.patientId.trim() === "") {
    return {
      isValid: false,
      errorCode: "SEC_INVALID_PATIENT",
      errorMessage: "Valid patientId is required for break-glass emergency access",
    };
  }

  if (
    !input.justification ||
    typeof input.justification !== "string" ||
    input.justification.trim().length < 10
  ) {
    return {
      isValid: false,
      errorCode: "SEC_JUSTIFICATION_REQUIRED",
      errorMessage: "Clinical justification with minimum 10 characters is strictly required for break-glass emergency access",
    };
  }

  return { isValid: true };
}

export interface BackupRetentionPolicy {
  dailyDbBackupRetentionDays: number;
  securityAuditLogRetentionDays: number;
  clinicalRecordRetentionYears: number;
  rpoHours: number;
  rtoHours: number;
}

export const DEFAULT_BACKUP_RETENTION_POLICY: BackupRetentionPolicy = {
  dailyDbBackupRetentionDays: 30,
  securityAuditLogRetentionDays: 365,
  clinicalRecordRetentionYears: 7,
  rpoHours: 1, // 1 hour recovery point objective
  rtoHours: 4, // 4 hours recovery time objective
};

export function validateBackupExecution(backupSnapshot: {
  snapshotId: string;
  timestamp: string | Date;
  sizeBytes: number;
  checksum: string;
}): boolean {
  return (
    Boolean(backupSnapshot.snapshotId) &&
    Boolean(backupSnapshot.timestamp) &&
    backupSnapshot.sizeBytes > 0 &&
    Boolean(backupSnapshot.checksum)
  );
}

export function validateRestoreSimulation(restoreResult: {
  restoredFromSnapshotId: string;
  verifiedIntegrity: boolean;
  tablesRestored: number;
}): boolean {
  return (
    Boolean(restoreResult.restoredFromSnapshotId) &&
    restoreResult.verifiedIntegrity === true &&
    restoreResult.tablesRestored > 0
  );
}
