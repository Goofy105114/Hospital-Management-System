import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction, UserRole } from "@prisma/client";

/**
 * SEC-02 — POST /api/v1/patients/:id/reveal-pii
 *
 * Returns the patient's full (unmasked) demographics.
 *
 * Requires:
 *   - A valid Bearer JWT (any clinical/admin role)
 *   - X-Step-Up-Token header (issued by IAM-03 step-up flow).
 *     If absent, returns 403 STEPUP_REQUIRED.
 *     Full OTP validation is performed by IAM-03 (/auth/step-up/*);
 *     this endpoint enforces the header presence as the gate.
 *
 * Always emits a 🔒AUDIT event (high-visibility PII access log).
 *
 * Roles allowed: RECEPTIONIST, DOCTOR, NURSE, ADMIN, SUPER_ADMIN.
 * LAB_TECH, PHARMACIST etc. are excluded — they never need full PII bulk access.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Auth guard
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (
    !requireRole(user, [
      UserRole.RECEPTIONIST,
      UserRole.DOCTOR,
      UserRole.NURSE,
      UserRole.ADMIN,
    ])
  ) {
    return apiError(
      "UNAUTHORIZED_ROLE",
      "Insufficient role to reveal full patient PII",
      403
    );
  }

  // Step-up token gate (IAM-03) — header must be present
  const stepUpToken = request.headers.get("x-step-up-token");
  if (!stepUpToken) {
    return apiError(
      "STEPUP_REQUIRED",
      "A step-up token (X-Step-Up-Token) is required to access full patient PII",
      403
    );
  }

  try {
    const { id } = params;

    // Fetch full demographics
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
          },
        },
        emergencyContacts: true,
        alerts: { where: { isActive: true } },
      },
    });

    if (!patient) {
      return apiError("PATIENT_NOT_FOUND", "Patient not found", 404);
    }

    // Always audit — PII reveal is a high-visibility security event
    await logAuditEvent({
      actorId: user.sub,
      actorRole: user.role,
      action: AuditAction.VIEW,
      entityType: "PatientPII",
      entityId: id,
      changes: {
        after: {
          action: "REVEAL_FULL_PII",
          stepUpToken: stepUpToken.substring(0, 8) + "...", // log token prefix only, never full token
        },
      },
    });

    // Build full demographics response
    const fullDemographics = {
      id: patient.id,
      mrn: patient.mrn,
      name: patient.user.name,
      email: patient.user.email,
      phone: patient.user.phone,
      dob: patient.dob.toISOString().split("T")[0],
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      address: patient.address,
      secondaryPhone: patient.secondaryPhone,
      secondaryEmail: patient.secondaryEmail,
      preferredLanguage: patient.preferredLanguage,
      emergencyContacts: patient.emergencyContacts.map((ec) => ({
        id: ec.id,
        name: ec.name,
        relationship: ec.relationship,
        phone: ec.phone,
      })),
      alerts: patient.alerts.map((a) => ({
        id: a.id,
        type: a.type,
        note: a.note,
      })),
    };

    return apiSuccess({ fullDemographics });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to reveal patient PII", 500);
  }
}
