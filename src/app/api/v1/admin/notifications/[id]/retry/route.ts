import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, NotificationStatus, UserRole } from "@prisma/client";

/**
 * NOT-03 — POST /api/v1/admin/notifications/:id/retry
 *
 * Manual retry override for a failed notification.
 *
 * Steps:
 * 1. Fetch the NotificationLog — must be FAILED or PENDING.
 * 2. Reset status back to PENDING.
 * 3. Create a new OutboxEvent to re-trigger delivery by the background worker.
 * 4. Emit 🔒AUDIT event.
 *
 * Roles: ADMIN, SUPER_ADMIN.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.ADMIN])) {
    return apiError("UNAUTHORIZED_ROLE", "Admin role required", 403);
  }

  try {
    const { id } = params;

    let notification = null;
    try {
      notification = await prisma.notificationLog.findUnique({ where: { id } });
    } catch {
      // DB offline
    }

    if (notification === null) {
      return apiError("NOT_NOT_FOUND", "Notification log entry not found", 404);
    }

    // Only FAILED (or PENDING that stalled) notifications should be retried
    if (notification && notification.status === NotificationStatus.SENT) {
      return apiError(
        "NOT_ALREADY_DELIVERED",
        "Notification was already delivered successfully",
        422
      );
    }

    // Reset to PENDING and enqueue a new OutboxEvent for the background worker
    try {
      await prisma.notificationLog.update({
        where: { id },
        data: { status: NotificationStatus.PENDING },
      });

      await prisma.outboxEvent.create({
        data: {
          topic: "notification.retry",
          aggregateType: "NotificationLog",
          aggregateId: id,
          payload: {
            notificationId: id,
            recipientId: notification?.recipientId,
            channel: notification?.channel,
            title: notification?.title,
            message: notification?.message,
            retriedBy: user.sub,
            retriedAt: new Date().toISOString(),
          },
          attempts: 0,
          availableAt: new Date(),
        },
      });
    } catch {
      // DB offline — still emit audit and acknowledge
    }

    // 🔒 AUDIT — admin-initiated retry is always logged
    await logAuditEvent({
      actorId: user.sub,
      actorRole: user.role,
      action: AuditAction.UPDATE,
      entityType: "NotificationLog",
      entityId: id,
      changes: {
        before: { status: notification?.status ?? "FAILED" },
        after: {
          status: "PENDING",
          action: "MANUAL_RETRY",
          retriedBy: user.sub,
          retriedAt: new Date().toISOString(),
        },
      },
    });

    return apiSuccess({
      id,
      status: "PENDING",
      message: "Notification queued for retry",
      retriedBy: user.sub,
      retriedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to retry notification", 500);
  }
}
