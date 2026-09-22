import { NextRequest } from "next/server";
import { QueueService } from "@/server/services/queue.service";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { prisma } from "@/lib/prisma";
import { getAuthUser, requireRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

/**
 * QUE-02 — GET /api/v1/queue/tokens/:id
 * Returns a single token's full payload.
 * Allowed: clinical staff or the patient who owns the token.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);

  try {
    const token = await prisma.queueToken.findUnique({
      where: { id: params.id },
      include: {
        doctor: { select: { id: true, roomNumber: true, user: { select: { name: true } } } },
        patient: { select: { id: true, mrn: true, userId: true, user: { select: { name: true } } } },
      },
    });

    if (token === null) {
      return apiError("QUE_TOKEN_NOT_FOUND", "Queue token not found", 404);
    }

    // Patients may only view their own token
    if (user.role === UserRole.PATIENT && token && token.patient.userId !== user.sub) {
      return apiError("QUE_TOKEN_SCOPE_DENIED", "Patients may only view their own tokens", 403);
    }

    return apiSuccess(token);
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to retrieve token", 500);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, priorityTier } = body;

    if (action === "CALL") {
      const res = await QueueService.callToken(id);
      if (!res.success) {
        return apiError(res.code || "CALL_FAILED", "Failed to call token", res.status || 400);
      }
      return apiSuccess(res.data);
    }

    if (action === "COMPLETE") {
      const res = await QueueService.completeToken(id);
      if (!res.success) {
        return apiError(res.code || "COMPLETE_FAILED", "Failed to complete token", res.status || 400);
      }
      return apiSuccess(res.data);
    }

    if (action === "PRIORITIZE") {
      const updated = await prisma.queueToken.update({
        where: { id },
        data: { priorityTier: priorityTier || "EMERGENCY" },
      });
      return apiSuccess(updated);
    }

    if (action === "IN_CONSULTATION") {
      const updated = await prisma.queueToken.update({
        where: { id },
        data: { status: "IN_CONSULTATION" },
      });
      return apiSuccess(updated);
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
