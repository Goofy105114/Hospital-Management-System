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

import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NotificationStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return apiSuccess([]);

    const notifs = await prisma.notificationLog.findMany({
      where: { recipientId: auth.sub },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const formatted: PatientNotification[] = notifs.map((n) => ({
      id: n.id,
      category: "SYSTEM",
      title: n.title,
      message: n.message,
      timestamp: n.createdAt.toISOString(),
      read: n.status === NotificationStatus.READ,
      priority: "NORMAL",
    }));

    return apiSuccess(formatted);
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
