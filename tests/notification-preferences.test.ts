import { describe, expect, it } from "vitest";
import { validateNotificationPreferences } from "@/server/domain/notification-preference";

describe("NOT-01 notification preferences, consent and templates", () => {
  it("accepts valid notification channel and alert preferences", () => {
    const valid = validateNotificationPreferences({
      smsAlerts: true,
      emailNotifications: false,
      whatsAppConsent: true,
      doctorDelayAlerts: true,
      preferredLanguage: "English",
    });
    expect(valid.isValid).toBe(true);
  });

  it("rejects non-boolean values for alert preference flags", () => {
    const invalid = validateNotificationPreferences({
      smsAlerts: "yes" as unknown as boolean,
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errorCode).toBe("NOT_INVALID_PREFERENCE_VALUE");
  });

  it("rejects empty language strings", () => {
    const invalid = validateNotificationPreferences({
      preferredLanguage: "   ",
    });
    expect(invalid.isValid).toBe(false);
    expect(invalid.errorCode).toBe("NOT_INVALID_LANGUAGE");
  });
});
