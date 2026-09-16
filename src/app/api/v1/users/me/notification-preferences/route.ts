import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export const dynamic = "force-dynamic";

let PREFERENCES_STORE = {
  smsAlerts: true,
  emailNotifications: true,
  inAppAlerts: true,
  whatsAppConsent: false,
  doctorDelayAlerts: true,
  prescriptionRefillAlerts: true,
  labResultsAlerts: true,
  billingReminders: true,
  preferredLanguage: "English (US)",
};

export async function GET(req: NextRequest) {
  try {
    return apiSuccess(PREFERENCES_STORE);
  } catch (error) {
    return apiError("PREF_FETCH_FAILED", "Failed to retrieve notification preferences", 500, {
      error: String(error),
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    PREFERENCES_STORE = {
      ...PREFERENCES_STORE,
      ...body,
    };

    return apiSuccess({
      success: true,
      preferences: PREFERENCES_STORE,
      message: "Notification channels and privacy consent updated per NOT-01",
    });
  } catch (error) {
    return apiError("PREF_UPDATE_FAILED", "Failed to update notification preferences", 500, {
      error: String(error),
    });
  }
}
