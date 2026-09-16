import { NextRequest, NextResponse } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export const dynamic = "force-dynamic";

export interface PatientNotification {
  id: string;
  category: "APPOINTMENT" | "QUEUE" | "PHARMACY" | "LAB" | "BILLING" | "SYSTEM";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "HIGH" | "NORMAL" | "URGENT";
  actionUrl?: string;
  actionLabel?: string;
}

const FALLBACK_NOTIFICATIONS: PatientNotification[] = [
  {
    id: "notif-01",
    category: "QUEUE",
    title: "Approaching Consultation Turn",
    message: "You are #3 in queue for Dr. Marcus Vance in Room 304. Estimated wait is ~18 minutes.",
    timestamp: "10 mins ago",
    read: false,
    priority: "HIGH",
    actionUrl: "/queue",
    actionLabel: "View Live Queue",
  },
  {
    id: "notif-02",
    category: "APPOINTMENT",
    title: "Appointment Reminder: Today at 11:30 AM",
    message:
      "Your Cardiology consultation with Dr. Marcus Vance is scheduled for 11:30 AM at East Wing, 3rd Floor.",
    timestamp: "1 hour ago",
    read: false,
    priority: "HIGH",
    actionUrl: "/appointments",
    actionLabel: "View Details",
  },
  {
    id: "notif-03",
    category: "LAB",
    title: "Diagnostic Results Ready: CMP Panel",
    message:
      "Your Comprehensive Metabolic Panel results have been validated by Pathology and released to your portal.",
    timestamp: "2 hours ago",
    read: true,
    priority: "NORMAL",
    actionUrl: "/reports",
    actionLabel: "View Report",
  },
  {
    id: "notif-04",
    category: "PHARMACY",
    title: "Prescription Refill Approved",
    message:
      "Your Metoprolol 25mg refill has been verified and is ready for pickup at Central Pharmacy Counter 2.",
    timestamp: "Yesterday, 04:30 PM",
    read: true,
    priority: "NORMAL",
    actionUrl: "/prescriptions",
    actionLabel: "Pickup QR Pass",
  },
  {
    id: "notif-05",
    category: "BILLING",
    title: "New Statement Generated: #INV-2026-0042",
    message:
      "An itemized statement for your outpatient visit has been generated. Insurance covered $336.00; patient co-pay is $84.00.",
    timestamp: "2 days ago",
    read: true,
    priority: "NORMAL",
    actionUrl: "/billing",
    actionLabel: "Pay Statement",
  },
];

export async function GET(req: NextRequest) {
  try {
    return apiSuccess(FALLBACK_NOTIFICATIONS);
  } catch (error) {
    return apiError("NOTIF_FETCH_FAILED", "Failed to retrieve notifications", 500, {
      error: String(error),
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { notificationId, markAllRead } = body;

    return apiSuccess({
      success: true,
      message: markAllRead
        ? "All notifications marked as read"
        : `Notification ${notificationId} updated`,
    });
  } catch (error) {
    return apiError("NOTIF_UPDATE_FAILED", "Failed to update notification state", 500, {
      error: String(error),
    });
  }
}
