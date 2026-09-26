export interface SystemSettings {
  sessionTimeoutMinutes: number;
  allowMultipleSessions: boolean;
  maintenanceMode: boolean;
  featureFlags?: Record<string, boolean>;
}

export interface IntegrationSettings {
  smsProvider: string;
  emailProvider: string;
  paymentProvider: string;
  webhookUrl?: string;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  sessionTimeoutMinutes: 15,
  allowMultipleSessions: true,
  maintenanceMode: false,
  featureFlags: {
    aiWaitPrediction: true,
    kioskSelfCheckIn: true,
    autoDispenseCheck: true,
  },
};

export const DEFAULT_INTEGRATION_SETTINGS: IntegrationSettings = {
  smsProvider: "TWILIO",
  emailProvider: "SENDGRID",
  paymentProvider: "STRIPE",
  webhookUrl: "",
};

export const ALLOWED_SMS_PROVIDERS = ["TWILIO", "AWS_SNS", "MOCK", "NONE"];
export const ALLOWED_EMAIL_PROVIDERS = ["SENDGRID", "AWS_SES", "SMTP", "MOCK", "NONE"];
export const ALLOWED_PAYMENT_PROVIDERS = ["STRIPE", "RAZORPAY", "PAYPAL", "MOCK", "NONE"];

export function validateSystemSettings(input: Partial<SystemSettings>): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (input.sessionTimeoutMinutes !== undefined) {
    if (
      typeof input.sessionTimeoutMinutes !== "number" ||
      !Number.isInteger(input.sessionTimeoutMinutes) ||
      input.sessionTimeoutMinutes < 5 ||
      input.sessionTimeoutMinutes > 1440
    ) {
      return {
        isValid: false,
        errorCode: "ADM_INVALID_SESSION_TIMEOUT",
        errorMessage: "Session timeout must be an integer between 5 and 1440 minutes",
      };
    }
  }

  if (input.allowMultipleSessions !== undefined) {
    if (typeof input.allowMultipleSessions !== "boolean") {
      return {
        isValid: false,
        errorCode: "ADM_INVALID_CONCURRENT_SESSION_POLICY",
        errorMessage: "allowMultipleSessions must be a boolean",
      };
    }
  }

  if (input.maintenanceMode !== undefined) {
    if (typeof input.maintenanceMode !== "boolean") {
      return {
        isValid: false,
        errorCode: "ADM_INVALID_MAINTENANCE_MODE",
        errorMessage: "maintenanceMode must be a boolean",
      };
    }
  }

  if (input.featureFlags !== undefined) {
    if (typeof input.featureFlags !== "object" || input.featureFlags === null) {
      return {
        isValid: false,
        errorCode: "ADM_INVALID_FEATURE_FLAGS",
        errorMessage: "featureFlags must be an object map of boolean values",
      };
    }
    for (const [key, val] of Object.entries(input.featureFlags)) {
      if (typeof val !== "boolean") {
        return {
          isValid: false,
          errorCode: "ADM_INVALID_FEATURE_FLAGS",
          errorMessage: `Feature flag '${key}' must have a boolean value`,
        };
      }
    }
  }

  return { isValid: true };
}

export function validateIntegrationSettings(input: Partial<IntegrationSettings>): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (input.smsProvider !== undefined) {
    if (
      typeof input.smsProvider !== "string" ||
      !ALLOWED_SMS_PROVIDERS.includes(input.smsProvider.toUpperCase())
    ) {
      return {
        isValid: false,
        errorCode: "ADM_INVALID_SMS_PROVIDER",
        errorMessage: `smsProvider must be one of: ${ALLOWED_SMS_PROVIDERS.join(", ")}`,
      };
    }
  }

  if (input.emailProvider !== undefined) {
    if (
      typeof input.emailProvider !== "string" ||
      !ALLOWED_EMAIL_PROVIDERS.includes(input.emailProvider.toUpperCase())
    ) {
      return {
        isValid: false,
        errorCode: "ADM_INVALID_EMAIL_PROVIDER",
        errorMessage: `emailProvider must be one of: ${ALLOWED_EMAIL_PROVIDERS.join(", ")}`,
      };
    }
  }

  if (input.paymentProvider !== undefined) {
    if (
      typeof input.paymentProvider !== "string" ||
      !ALLOWED_PAYMENT_PROVIDERS.includes(input.paymentProvider.toUpperCase())
    ) {
      return {
        isValid: false,
        errorCode: "ADM_INVALID_PAYMENT_PROVIDER",
        errorMessage: `paymentProvider must be one of: ${ALLOWED_PAYMENT_PROVIDERS.join(", ")}`,
      };
    }
  }

  if (input.webhookUrl !== undefined && input.webhookUrl !== "") {
    if (typeof input.webhookUrl !== "string") {
      return {
        isValid: false,
        errorCode: "ADM_INVALID_WEBHOOK_URL",
        errorMessage: "webhookUrl must be a valid URL string",
      };
    }
  }

  return { isValid: true };
}

export function isMaintenanceModeActive(settings?: Partial<SystemSettings> | null): boolean {
  return Boolean(settings?.maintenanceMode);
}

export function canBypassMaintenanceMode(role?: string | null): boolean {
  return role === "SUPER_ADMIN" || role === "ADMIN";
}

// ---------------------------------------------------------------------------
// ADM-02 — User lifecycle, staff onboarding and administrative approvals
// ---------------------------------------------------------------------------

export const VALID_STAFF_ROLES = [
  "RECEPTIONIST",
  "DOCTOR",
  "NURSE",
  "PHARMACIST",
  "LAB_TECH",
  "RADIOLOGIST",
  "INVENTORY_MANAGER",
  "BILLING_STAFF",
  "ADMIN",
  "MANAGEMENT",
  "SUPER_ADMIN",
];

export interface StaffOnboardingInput {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  departmentId?: string;
}

export function validateStaffOnboardingInput(input: StaffOnboardingInput): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  if (!input.name || typeof input.name !== "string" || input.name.trim().length === 0) {
    return {
      isValid: false,
      errorCode: "ADM_NAME_REQUIRED",
      errorMessage: "Staff full name is required",
    };
  }

  if (
    !input.email ||
    typeof input.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())
  ) {
    return {
      isValid: false,
      errorCode: "ADM_INVALID_EMAIL",
      errorMessage: "A valid email address is required for staff onboarding",
    };
  }

  if (!input.role || typeof input.role !== "string" || !VALID_STAFF_ROLES.includes(input.role.toUpperCase())) {
    return {
      isValid: false,
      errorCode: "ADM_INVALID_STAFF_ROLE",
      errorMessage: `Staff role must be one of: ${VALID_STAFF_ROLES.join(", ")}`,
    };
  }

  return { isValid: true };
}

export function canTransitionUserStatus(
  from: string,
  to: string,
  actorRole?: string
): { allowed: boolean; errorCode?: string; reason?: string } {
  if (actorRole !== "ADMIN" && actorRole !== "SUPER_ADMIN") {
    return {
      allowed: false,
      errorCode: "FORBIDDEN",
      reason: "Only system administrators can modify user lifecycle status",
    };
  }

  const validStatuses = ["ACTIVE", "SUSPENDED", "LOCKED", "PENDING_VERIFICATION"];
  if (!validStatuses.includes(from) || !validStatuses.includes(to)) {
    return {
      allowed: false,
      errorCode: "ADM_INVALID_STATUS",
      reason: "Invalid user lifecycle status specified",
    };
  }

  if (from === to) {
    return {
      allowed: false,
      errorCode: "ADM_STATUS_UNCHANGED",
      reason: `User is already in status ${to}`,
    };
  }

  return { allowed: true };
}

export function validateAdministrativeApprovalAction(input: {
  approverRole?: string;
  decision?: "APPROVED" | "REJECTED";
  reason?: string;
}): { isValid: boolean; errorCode?: string; errorMessage?: string } {
  if (input.approverRole !== "ADMIN" && input.approverRole !== "SUPER_ADMIN" && input.approverRole !== "MANAGEMENT") {
    return {
      isValid: false,
      errorCode: "FORBIDDEN",
      errorMessage: "Only administrative staff can process approval decisions",
    };
  }

  if (!input.decision || (input.decision !== "APPROVED" && input.decision !== "REJECTED")) {
    return {
      isValid: false,
      errorCode: "ADM_INVALID_DECISION",
      errorMessage: "Decision must be either APPROVED or REJECTED",
    };
  }

  if (input.decision === "REJECTED" && (!input.reason || input.reason.trim() === "")) {
    return {
      isValid: false,
      errorCode: "ADM_REJECTION_REASON_REQUIRED",
      errorMessage: "A reason is mandatory when rejecting an administrative request",
    };
  }

  return { isValid: true };
}

