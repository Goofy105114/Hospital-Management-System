export interface NotificationPreferenceInput {
  smsAlerts?: boolean;
  emailNotifications?: boolean;
  inAppAlerts?: boolean;
  whatsAppConsent?: boolean;
  doctorDelayAlerts?: boolean;
  prescriptionRefillAlerts?: boolean;
  labResultsAlerts?: boolean;
  billingReminders?: boolean;
  preferredLanguage?: string;
}

export function validateNotificationPreferences(input: Partial<NotificationPreferenceInput>): {
  isValid: boolean;
  errorCode?: string;
  errorMessage?: string;
} {
  const booleanFields: (keyof NotificationPreferenceInput)[] = [
    "smsAlerts",
    "emailNotifications",
    "inAppAlerts",
    "whatsAppConsent",
    "doctorDelayAlerts",
    "prescriptionRefillAlerts",
    "labResultsAlerts",
    "billingReminders",
  ];

  for (const field of booleanFields) {
    if (input[field] !== undefined && typeof input[field] !== "boolean") {
      return {
        isValid: false,
        errorCode: "NOT_INVALID_PREFERENCE_VALUE",
        errorMessage: `${field} must be a boolean value`,
      };
    }
  }

  if (input.preferredLanguage !== undefined && (typeof input.preferredLanguage !== "string" || input.preferredLanguage.trim().length === 0)) {
    return {
      isValid: false,
      errorCode: "NOT_INVALID_LANGUAGE",
      errorMessage: "preferredLanguage must be a non-empty string",
    };
  }

  return { isValid: true };
}
