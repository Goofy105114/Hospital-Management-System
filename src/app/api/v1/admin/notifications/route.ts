import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { NotificationStatus, UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * NOT-03 — GET /api/v1/admin/notifications
 *
 * Returns the full notification delivery log, filterable by status and date.
 * Failed sends surface here for admin review before manual retry.
 *
 * Query params:
 *   ?status=PENDING|SENT|FAILED|READ
 *   ?dateFrom=ISO8601
 *   ?recipientId=uuid
 *
 * Roles: ADMIN, SUPER_ADMIN.
 */
export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.ADMIN])) {
    return apiError("UNAUTHORIZED_ROLE", "Admin role required", 403);
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") as NotificationStatus | null;
    const dateFrom = searchParams.get("dateFrom");
    const recipientId = searchParams.get("recipientId");

    // Validate status enum if provided
    if (statusParam && !Object.values(NotificationStatus).includes(statusParam)) {
      return apiError(
        "NOT_INVALID_STATUS",
        `status must be one of: ${Object.values(NotificationStatus).join(", ")}`,
        400
      );
    }

    const records = await prisma.notificationLog.findMany({
      where: {
        ...(statusParam ? { status: statusParam } : {}),
        ...(recipientId ? { recipientId } : {}),
        ...(dateFrom ? { createdAt: { gte: new Date(dateFrom) } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const logs = records.map((r) => ({
      id: r.id,
      recipientId: r.recipientId,
      channel: r.channel,
      title: r.title,
      message: r.message,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));

    return apiSuccess(logs);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to retrieve notification log", 500);
  }
}
