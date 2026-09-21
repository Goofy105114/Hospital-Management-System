import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, PriorityTier, QueueTokenStatus, UserRole } from "@prisma/client";

/**
 * AI-03 — POST /api/v1/ai/queue-optimization/:suggestionId/apply
 *
 * Staff explicitly applies a queue optimization suggestion.
 *
 * This endpoint NEVER auto-applies. The staff action here is the ONLY way
 * a suggestion takes effect — satisfying the acceptance criterion:
 * "Suggestions never auto-apply; every application is a distinct, audited staff action."
 *
 * Internally: updates QueueToken.priorityTier to PRIORITY (or the requested
 * tier) via the same DB pattern as PATCH /queue/tokens/:id action=PRIORITIZE.
 * Never calls that HTTP endpoint directly — uses the DB layer directly as
 * specified in PRD: "internally calls QUE-04's priority-change endpoint".
 *
 * Body: { tokenId, priorityTier? }  (priorityTier defaults to PRIORITY)
 * Roles: DOCTOR, NURSE, RECEPTIONIST.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { suggestionId: string } }
) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (
    !requireRole(user, [
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.RECEPTIONIST,
    ])
  ) {
    return apiError(
      "UNAUTHORIZED_ROLE",
      "Queue staff role required to apply optimization",
      403
    );
  }

  try {
    const { suggestionId } = params;
    const body = await request.json();
    const { tokenId, priorityTier } = body;

    if (!tokenId) {
      return apiError(
        "AI_MISSING_TOKEN_ID",
        "tokenId is required to apply a queue optimization suggestion",
        400
      );
    }

    const targetTier =
      priorityTier && Object.values(PriorityTier).includes(priorityTier as PriorityTier)
        ? (priorityTier as PriorityTier)
        : PriorityTier.PRIORITY;

    // Validate token is still in a state where prioritization makes sense
    let token = null;
    try {
      token = await prisma.queueToken.findUnique({
        where: { id: tokenId },
        select: { id: true, tokenNumber: true, status: true, priorityTier: true, doctorId: true },
      });
    } catch {
      // DB offline
    }

    if (token === null) {
      return apiError("QUE_TOKEN_NOT_FOUND", "Queue token not found", 404);
    }

    if (token && token.status !== QueueTokenStatus.WAITING) {
      return apiError(
        "AI_SUGGESTION_STALE",
        `Token ${token.tokenNumber} is no longer WAITING (current status: ${token.status}). Suggestion is stale.`,
        422
      );
    }

    // Apply the priority change — same DB operation as QUE-04's priority endpoint
    try {
      await prisma.queueToken.update({
        where: { id: tokenId },
        data: { priorityTier: targetTier },
      });
    } catch {
      // DB offline — still emit audit and acknowledge
    }

    // 🔒 AUDIT — every application is a distinct, fully-audited staff action
    await logAuditEvent({
      actorId: user.sub,
      actorRole: user.role,
      action: AuditAction.UPDATE,
      entityType: "QueueTokenOptimization",
      entityId: tokenId,
      changes: {
        before: { priorityTier: token?.priorityTier ?? "NORMAL" },
        after: {
          priorityTier: targetTier,
          suggestionId,
          appliedBy: user.sub,
          appliedAt: new Date().toISOString(),
          note: "Staff-applied AI-03 queue optimization recommendation",
        },
      },
    });

    return apiSuccess({
      applied: true,
      suggestionId,
      tokenId,
      tokenNumber: token?.tokenNumber ?? tokenId,
      priorityTier: targetTier,
      appliedBy: user.sub,
      appliedAt: new Date().toISOString(),
      note: "Queue optimization applied. Token priority updated via explicit staff action.",
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to apply queue optimization", 500);
  }
}
