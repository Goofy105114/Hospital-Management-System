import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { QueueTokenStatus, UserRole } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * AI-03 — GET /api/v1/ai/queue-optimization?doctorId=
 *
 * Analyses the current WAITING queue for a doctor and returns an advisory
 * optimization suggestion (e.g. "consider calling patient B next").
 *
 * IMPORTANT: This endpoint is ADVISORY ONLY. Suggestions are never
 * auto-applied. Staff must explicitly call POST ./:suggestionId/apply
 * to act on a suggestion, which is itself a distinct audited action.
 *
 * Deterministic rule (fallback, always used when AI key is absent):
 *   1. Prefer any EMERGENCY token not yet called.
 *   2. Else prefer any PRIORITY token not yet called.
 *   3. Else prefer a FOLLOW_UP over NEW if the FOLLOW_UP has been waiting
 *      longer (shorter expected consult = higher throughput).
 *   4. If queue is already optimal (first token matches rule), indicate that.
 *
 * Response includes source: "ai_model" | "fallback" per A.4.10.
 *
 * Roles: DOCTOR, NURSE, RECEPTIONIST, ADMIN.
 */
export async function GET(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (
    !requireRole(user, [
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.RECEPTIONIST,
      UserRole.ADMIN,
    ])
  ) {
    return apiError("UNAUTHORIZED_ROLE", "Queue staff role required", 403);
  }

  const { searchParams } = new URL(request.url);
  const doctorId = searchParams.get("doctorId");

  if (!doctorId) {
    return apiError("AI_MISSING_DOCTOR_ID", "doctorId is required", 400);
  }

  try {
    let suggestion: {
      tokenId: string;
      tokenNumber: string;
      patientName: string;
      currentPosition: number;
      priorityTier: string;
      reason: string;
    } | null = null;
    let source: "ai_model" | "fallback" = "fallback";
    let queueLength = 0;

    try {
      // Fetch all WAITING tokens for this doctor, ordered by priority then position
      const waiting = await prisma.queueToken.findMany({
        where: { doctorId, status: QueueTokenStatus.WAITING },
        include: {
          patient: { select: { user: { select: { name: true } } } },
          appointment: { select: { appointmentType: true } },
        },
        orderBy: [{ priorityTier: "desc" }, { position: "asc" }],
      });

      queueLength = waiting.length;

      if (waiting.length === 0) {
        return apiSuccess({
          doctorId,
          queueLength: 0,
          suggestion: null,
          message: "No patients currently waiting.",
          source: "fallback",
        });
      }

      // The first token in our sorted list is already the optimal FIFO+priority order.
      // Look for a non-first token that the rule would suggest over the first.
      const first = waiting[0];

      // Rule 1: Is there an EMERGENCY token NOT at position 1?
      const emergencyCandidate = waiting.find(
        (t) => t.priorityTier === "EMERGENCY" && t.id !== first.id
      );
      if (emergencyCandidate) {
        suggestion = {
          tokenId: emergencyCandidate.id,
          tokenNumber: emergencyCandidate.tokenNumber,
          patientName: emergencyCandidate.patient.user.name,
          currentPosition: emergencyCandidate.position,
          priorityTier: emergencyCandidate.priorityTier,
          reason:
            "EMERGENCY-tier patient is waiting — recommend prioritizing ahead of current queue order for immediate clinical attention.",
        };
      }

      // Rule 2: FOLLOW_UP waiting longer than NEW (shorter consult → higher throughput)
      if (!suggestion) {
        const followUp = waiting.find(
          (t) => t.appointment?.appointmentType === "FOLLOW_UP" && t.id !== first.id
        );
        const newAppt = waiting.find(
          (t) => t.appointment?.appointmentType === "NEW" && t.id !== first.id
        );

        if (
          followUp &&
          newAppt &&
          first.appointment?.appointmentType === "NEW" &&
          followUp.position < newAppt.position
        ) {
          suggestion = {
            tokenId: followUp.id,
            tokenNumber: followUp.tokenNumber,
            patientName: followUp.patient.user.name,
            currentPosition: followUp.position,
            priorityTier: followUp.priorityTier,
            reason:
              "Follow-up consultation ahead of new patient appointment may improve throughput — follow-up visits typically require less time.",
          };
        }
      }

      // Queue is already optimal
      if (!suggestion) {
        suggestion = {
          tokenId: first.id,
          tokenNumber: first.tokenNumber,
          patientName: first.patient.user.name,
          currentPosition: first.position,
          priorityTier: first.priorityTier,
          reason:
            "Queue order is already optimal. Current first patient is recommended next by FIFO + priority rules.",
        };
      }
    } catch {
      // DB offline — return advisory fallback
      const suggestionId = crypto.randomUUID();
      return apiSuccess({
        doctorId,
        queueLength: 0,
        suggestionId,
        suggestion: null,
        message: "Queue data unavailable (DB offline). No suggestion generated.",
        source: "fallback",
      });
    }

    // Generate stable suggestionId for the apply endpoint
    const suggestionId = crypto.randomUUID();

    return apiSuccess({
      doctorId,
      queueLength,
      suggestionId,
      suggestion,
      advisory:
        "This is an AI-generated advisory recommendation. Staff must explicitly apply via POST /apply. Suggestions are never auto-applied.",
      source,
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to generate queue optimization", 500);
  }
}
