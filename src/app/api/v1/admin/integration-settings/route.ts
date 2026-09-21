import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import {
  DEFAULT_INTEGRATION_SETTINGS,
  validateIntegrationSettings,
  IntegrationSettings,
} from "@/server/domain/system-config";

export const dynamic = "force-dynamic";

const SETTINGS_KEY = "integration_settings";

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }
    if (!requireRole(auth, ["ADMIN", "SUPER_ADMIN"])) {
      return apiError("ADM_FORBIDDEN", "Insufficient privileges for integration settings", 403);
    }

    try {
      const record = await prisma.systemSetting.findUnique({
        where: { key: SETTINGS_KEY },
      });

      if (record && record.value) {
        const parsed = typeof record.value === "string" ? JSON.parse(record.value) : record.value;
        return apiSuccess({
          ...DEFAULT_INTEGRATION_SETTINGS,
          ...parsed,
          updatedAt: record.updatedAt,
          updatedBy: record.updatedBy,
        });
      }
    } catch {
      // Fallback
    }

    return apiSuccess(DEFAULT_INTEGRATION_SETTINGS);
  } catch (error) {
    return apiError("ADM_FETCH_FAILED", "Failed to retrieve integration settings", 500, {
      error: String(error),
    });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return apiError("UNAUTHORIZED", "Authentication required", 401);
    }
    if (!requireRole(auth, ["ADMIN", "SUPER_ADMIN"])) {
      return apiError("ADM_FORBIDDEN", "Only administrators can modify integration settings", 403);
    }

    const body = await req.json();
    const validation = validateIntegrationSettings(body);
    if (!validation.isValid) {
      return apiError(
        validation.errorCode || "ADM_INVALID_SETTINGS",
        validation.errorMessage || "Invalid integration settings payload",
        400
      );
    }

    let beforeSettings: IntegrationSettings = DEFAULT_INTEGRATION_SETTINGS;
    try {
      const existing = await prisma.systemSetting.findUnique({
        where: { key: SETTINGS_KEY },
      });
      if (existing?.value) {
        beforeSettings = {
          ...DEFAULT_INTEGRATION_SETTINGS,
          ...(typeof existing.value === "string" ? JSON.parse(existing.value) : existing.value),
        };
      }
    } catch {
      // Ignored
    }

    const updatedSettings: IntegrationSettings = {
      ...beforeSettings,
      ...body,
    };

    try {
      await prisma.systemSetting.upsert({
        where: { key: SETTINGS_KEY },
        update: {
          value: updatedSettings as any,
          updatedBy: auth.sub,
        },
        create: {
          key: SETTINGS_KEY,
          value: updatedSettings as any,
          updatedBy: auth.sub,
        },
      });
    } catch {
      // Fallback
    }

    await logAuditEvent({
      actorId: auth.sub,
      actorRole: auth.role,
      action: AuditAction.UPDATE,
      entityType: "IntegrationSetting",
      entityId: SETTINGS_KEY,
      changes: {
        before: beforeSettings as unknown as Record<string, unknown>,
        after: updatedSettings as unknown as Record<string, unknown>,
      },
    });

    return apiSuccess(updatedSettings);
  } catch (error) {
    return apiError("ADM_UPDATE_FAILED", "Failed to update integration settings", 500, {
      error: String(error),
    });
  }
}
