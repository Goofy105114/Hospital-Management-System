import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.MANAGEMENT])) {
    return apiError("UNAUTHORIZED_ROLE", "Admin or Management role required to access audit logs", 403);
  }

  try {
    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");

    const logs = await prisma.auditLog.findMany({
      where: {
        ...(entityType ? { entityType } : {}),
      },
      include: {
        actor: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const formatted = logs.map((log) => ({
      id: log.id,
      actorId: log.actorId,
      actorName: log.actor?.name || "System",
      actorRole: log.actorRole,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      changes: log.changes,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
    }));

    return apiSuccess(formatted);
  } catch (err: any) {
    return apiError("AUDIT_FETCH_FAILED", err?.message || "Failed to retrieve audit logs", 500);
  }
}
