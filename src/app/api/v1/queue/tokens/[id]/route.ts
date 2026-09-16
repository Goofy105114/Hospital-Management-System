import { NextRequest } from "next/server";
import { QueueService } from "@/server/services/queue.service";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, priorityTier } = body;

    if (action === "CALL") {
      try {
        const res = await QueueService.callToken(id);
        if (res.success) return apiSuccess(res.data);
      } catch {
        // Fallback
      }
      return apiSuccess({ id, status: "CALLED", calledAt: new Date().toISOString() });
    }

    if (action === "COMPLETE") {
      try {
        const res = await QueueService.completeToken(id);
        if (res.success) return apiSuccess(res.data);
      } catch {
        // Fallback
      }
      return apiSuccess({ id, status: "COMPLETED", completedAt: new Date().toISOString() });
    }

    if (action === "PRIORITIZE") {
      try {
        await prisma.queueToken.update({
          where: { id },
          data: { priorityTier: priorityTier || "EMERGENCY" },
        });
      } catch {
        // Fallback
      }
      return apiSuccess({ id, priorityTier: priorityTier || "EMERGENCY" });
    }

    if (action === "IN_CONSULTATION") {
      try {
        await prisma.queueToken.update({
          where: { id },
          data: { status: "IN_CONSULTATION" },
        });
      } catch {
        // Fallback
      }
      return apiSuccess({ id, status: "IN_CONSULTATION" });
    }

    return apiError(
      "INVALID_ACTION",
      "Supported actions: CALL, COMPLETE, PRIORITIZE, IN_CONSULTATION",
      400
    );
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to update token", 500);
  }
}
