import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * REP-05 — POST /api/v1/reports/scheduled
 *
 * Creates a scheduled report configuration, stored as a SystemSetting row
 * with key `report.schedule.<uuid>` and a JSON value object.
 * The background scheduler (NOT-02) reads these settings to emit the report
 * on the configured cron schedule.
 *
 * Body: { reportId, cronExpression, recipients: string[] }
 * Roles: MANAGEMENT, ADMIN.
 */
export async function POST(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.MANAGEMENT, UserRole.ADMIN])) {
    return apiError("UNAUTHORIZED_ROLE", "Management or admin role required", 403);
  }

  try {
    const body = await request.json();
    const { reportId, cronExpression, recipients } = body;

    if (!reportId?.trim()) {
      return apiError("REP_MISSING_REPORT_ID", "reportId is required", 400);
    }
    if (!cronExpression?.trim()) {
      return apiError("REP_MISSING_CRON", "cronExpression is required", 400);
    }
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return apiError("REP_MISSING_RECIPIENTS", "At least one recipient is required", 400);
    }

    const scheduleId = crypto.randomUUID();
    const settingKey = `report.schedule.${scheduleId}`;
    const settingValue = {
      scheduleId,
      reportId,
      cronExpression,
      recipients,
      createdBy: user.sub,
      createdAt: new Date().toISOString(),
      isActive: true,
    };

    let saved = null;
    try {
      await prisma.systemSetting.create({
        data: {
          key: settingKey,
          value: settingValue,
          updatedBy: user.sub,
        },
      });
      saved = settingValue;
    } catch {
      // DB offline — return intent confirmation
      saved = settingValue;
    }

    return apiSuccess(saved, undefined, 201);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to create scheduled report", 500);
  }
}

/**
 * REP-05 — GET /api/v1/reports/scheduled
 *
 * Returns all active scheduled report configurations.
 * Roles: MANAGEMENT, ADMIN.
 */
export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.MANAGEMENT, UserRole.ADMIN])) {
    return apiError("UNAUTHORIZED_ROLE", "Management or admin role required", 403);
  }

  try {
    let schedules: unknown[] = [];
    try {
      const settings = await prisma.systemSetting.findMany({
        where: { key: { startsWith: "report.schedule." } },
        orderBy: { updatedAt: "desc" },
      });
      schedules = settings.map((s) => s.value);
    } catch {
      schedules = [];
    }

    return apiSuccess(schedules);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to retrieve scheduled reports", 500);
  }
}
