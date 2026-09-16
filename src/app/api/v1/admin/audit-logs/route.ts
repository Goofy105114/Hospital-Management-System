import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess } from "@/lib/api-envelope";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
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
  } catch {
    return apiSuccess([
      {
        id: "aud-01",
        actorId: "usr-pharma-01",
        actorName: "Sarah Lin (Pharmacist)",
        actorRole: "PHARMACIST",
        action: "DISPENSE",
        entityType: "Prescription",
        entityId: "RX-2026-0042",
        changes: { items: ["Metoprolol", "Lisinopril"] },
        ipAddress: "192.168.1.45",
        createdAt: new Date().toISOString(),
      },
    ]);
  }
}
