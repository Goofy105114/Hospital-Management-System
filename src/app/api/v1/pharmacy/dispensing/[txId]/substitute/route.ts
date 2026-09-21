import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import { authorizePharmacist } from "../../../route-auth";

/**
 * PHA-05 — POST /api/v1/pharmacy/dispensing/:txId/substitute
 *
 * Records an approved generic/brand substitution made during dispensing.
 * The original dispensation record is never mutated — the substitution is
 * captured as an immutable AuditLog entry (same pattern as EMR-06 amendments).
 *
 * Required: originalMedicineId, substitutedMedicineId, reason
 * Roles: PHARMACIST only
 * Always emits 🔒AUDIT
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { txId: string } }
) {
  const auth = authorizePharmacist(request);
  if (auth.error || !auth.user) return auth.error;

  try {
    const { txId } = params;
    const body = await request.json();
    const { originalMedicineId, substitutedMedicineId, reason } = body;

    if (!originalMedicineId || !substitutedMedicineId || !reason?.trim()) {
      return apiError(
        "PHA_SUBSTITUTE_INVALID",
        "originalMedicineId, substitutedMedicineId and reason are all required",
        400
      );
    }

    // Verify the dispensation exists
    let dispensation = null;
    try {
      dispensation = await prisma.dispensation.findUnique({
        where: { id: txId },
        select: { id: true, patientId: true, prescriptionId: true },
      });
    } catch {
      // DB offline
    }

    if (dispensation === null) {
      return apiError("PHA_DISPENSATION_NOT_FOUND", "Dispensation record not found", 404);
    }

    // Resolve medicine names for the audit record (best-effort)
    let originalName = originalMedicineId;
    let substitutedName = substitutedMedicineId;
    try {
      const [orig, sub] = await Promise.all([
        prisma.medicine.findUnique({ where: { id: originalMedicineId }, select: { name: true } }),
        prisma.medicine.findUnique({ where: { id: substitutedMedicineId }, select: { name: true } }),
      ]);
      if (orig?.name) originalName = orig.name;
      if (sub?.name) substitutedName = sub.name;
    } catch {
      // DB offline — use IDs as names
    }

    const substitutionId = crypto.randomUUID();

    // Write immutable substitution record to audit log
    await logAuditEvent({
      actorId: auth.user.sub,
      actorRole: auth.user.role,
      action: AuditAction.UPDATE,
      entityType: "DispensingSubstitution",
      entityId: txId,
      changes: {
        after: {
          substitutionId,
          dispensationId: txId,
          originalMedicineId,
          originalMedicineName: originalName,
          substitutedMedicineId,
          substitutedMedicineName: substitutedName,
          reason,
          pharmacistId: auth.user.sub,
          recordedAt: new Date().toISOString(),
        },
      },
    });

    return apiSuccess({
      substitutionId,
      dispensationId: txId,
      originalMedicineId,
      originalMedicineName: originalName,
      substitutedMedicineId,
      substitutedMedicineName: substitutedName,
      reason,
      recordedAt: new Date().toISOString(),
      note: "Substitution recorded in audit log. Original dispensation record unchanged.",
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to record substitution", 500);
  }
}
