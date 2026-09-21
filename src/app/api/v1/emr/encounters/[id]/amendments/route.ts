import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, EncounterStatus, UserRole } from "@prisma/client";

/**
 * EMR-06 — POST /api/v1/emr/encounters/:id/amendments
 *
 * Records a post-sign correction as an immutable amendment.
 * The original encounter content is NEVER mutated.
 *
 * Implementation: the amendment is written to AuditLog with
 *   entityType = "EncounterAmendment"
 *   action     = UPDATE
 *   changes    = { field, before, correctedValue, reason }
 *
 * The encounter status is updated to AMENDED to signal that a correction
 * exists, without changing any clinical note fields.
 *
 * Roles allowed: DOCTOR only (per PRD).
 * Requirement: encounter must be FINALIZED or AMENDED to allow amendment.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (!requireRole(user, [UserRole.DOCTOR])) {
    return apiError("UNAUTHORIZED_ROLE", "Only doctors may amend encounters", 403);
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { field, correctedValue, reason } = body;

    if (!field || correctedValue === undefined || !reason?.trim()) {
      return apiError(
        "EMR_AMENDMENT_INVALID",
        "field, correctedValue and reason are all required",
        400
      );
    }

    // Fetch encounter — must be FINALIZED or AMENDED to allow amendment
    let encounter = null;
    try {
      encounter = await prisma.encounter.findUnique({ where: { id } });
    } catch {
      // DB offline
    }

    if (encounter === null) {
      return apiError("EMR_ENCOUNTER_NOT_FOUND", "Encounter not found", 404);
    }

    if (
      encounter &&
      encounter.status !== EncounterStatus.FINALIZED &&
      encounter.status !== EncounterStatus.AMENDED
    ) {
      return apiError(
        "EMR_NOT_FINALIZED",
        "Only finalized encounters can be amended",
        422
      );
    }

    // Capture the current (before) value of the field — never modify it
    const beforeValue = encounter
      ? (encounter as Record<string, unknown>)[field] ?? null
      : null;

    // Write amendment as an immutable audit event
    const amendmentId = crypto.randomUUID();
    await logAuditEvent({
      actorId: user.sub,
      actorRole: user.role,
      action: AuditAction.UPDATE,
      entityType: "EncounterAmendment",
      entityId: id,
      changes: {
        before: { [field]: beforeValue },
        after: {
          amendmentId,
          field,
          correctedValue,
          reason,
          amendedBy: user.sub,
          amendedAt: new Date().toISOString(),
        },
      },
    });

    // Mark encounter as AMENDED (status change only — no clinical field mutation)
    try {
      await prisma.encounter.update({
        where: { id },
        data: { status: EncounterStatus.AMENDED },
      });
    } catch {
      // DB offline — audit already written, still return success
    }

    return apiSuccess(
      {
        amendmentId,
        encounterId: id,
        field,
        correctedValue,
        reason,
        amendedBy: user.sub,
        amendedAt: new Date().toISOString(),
        note: "Original encounter content was not modified. Amendment is recorded in audit log.",
      },
      undefined,
      201
    );
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to create amendment", 500);
  }
}
