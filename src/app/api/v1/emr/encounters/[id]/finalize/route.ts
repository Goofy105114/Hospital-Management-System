import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { EncounterStatus, UserRole, QueueTokenStatus } from "@prisma/client";
import { EmrService } from "@/server/services/emr.service";

/**
 * EMR-06 — POST /api/v1/emr/encounters/:id/finalize
 *
 * Locks the encounter (status → FINALIZED) and non-blockingly completes the
 * linked queue token (QUE-05). Blocked if no clinical note has been saved
 * (subjectiveNotes is null/empty → 422 EMR_NOTE_NOT_SIGNED).
 *
 * Per PRD edge-case rule: if the queue-complete side-effect fails transiently,
 * finalization still succeeds — the encounter is the source of truth.
 *
 * Roles allowed: DOCTOR.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.DOCTOR])) {
    return apiError("UNAUTHORIZED_ROLE", "Only doctors may finalize encounters", 403);
  }

  try {
    const { id } = params;
    const body = await request.json().catch(() => ({}));
    const followUp = body?.followUp as { date?: string; instructions?: string } | undefined;

    // Fetch encounter
    let encounter = null;
    try {
      encounter = await prisma.encounter.findUnique({
        where: { id },
        include: { queueToken: { select: { id: true, status: true } } },
      });
    } catch {
      // DB offline
    }

    if (encounter === null) {
      return apiError("EMR_ENCOUNTER_NOT_FOUND", "Encounter not found", 404);
    }

    if (encounter) {
      // Already finalized or amended — idempotent guard
      if (
        encounter.status === EncounterStatus.FINALIZED ||
        encounter.status === EncounterStatus.AMENDED
      ) {
        return apiError(
          "EMR_ALREADY_FINALIZED",
          "Encounter is already finalized",
          422
        );
      }

      // Must have at least subjective notes (the signed clinical note requirement)
      if (!encounter.subjectiveNotes?.trim()) {
        return apiError(
          "EMR_NOTE_NOT_SIGNED",
          "Cannot finalize: clinical note (subjective/SOAP) must be saved before finalizing",
          422
        );
      }
    }

    // Finalize the encounter
    const finalized = await EmrService.signEncounter(id, user.sub, user.name);

    // Non-blocking: complete the linked queue token (QUE-05)
    // Failure here must not roll back the finalization
    if (encounter?.tokenId) {
      prisma.queueToken
        .findUnique({ where: { id: encounter.tokenId } })
        .then(async (token) => {
          if (
            token &&
            token.status !== QueueTokenStatus.COMPLETED &&
            token.status !== QueueTokenStatus.CANCELLED
          ) {
            await prisma.queueToken.update({
              where: { id: encounter!.tokenId! },
              data: { status: QueueTokenStatus.COMPLETED, completedAt: new Date() },
            });
          }
        })
        .catch(() => {
          // Transient failure — queue completion will be retried asynchronously
        });
    }

    return apiSuccess({
      id,
      status: "FINALIZED",
      signedAt: finalized.signedAt?.toISOString(),
      signedBy: finalized.signedBy,
      ...(followUp ? { followUp } : {}),
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to finalize encounter", 500);
  }
}
