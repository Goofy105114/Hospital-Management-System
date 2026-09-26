import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser } from "@/lib/auth";
import { logAuditEvent } from "@/lib/audit";
import { AuditAction } from "@prisma/client";
import { validateBreakGlassRequest } from "@/server/domain/security-emergency";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

const JWT_SECRET =
  process.env.JWT_SECRET || "going-merry-hms-super-secret-jwt-key-minimum-32-chars-long";

export async function POST(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user) {
      return apiError("UNAUTHENTICATED", "Authentication required for emergency break-glass access", 401);
    }

    const body = await req.json();
    const { patientId, justification } = body;

    const validation = validateBreakGlassRequest({
      patientId,
      justification,
      actorRole: user.role,
      actorId: user.sub,
    });

    if (!validation.isValid) {
      return apiError(
        validation.errorCode || "SEC_BREAK_GLASS_REJECTED",
        validation.errorMessage || "Invalid break-glass request",
        validation.errorCode === "FORBIDDEN" ? 403 : 400
      );
    }

    // Generate time-boxed, short TTL break-glass token (15 minutes)
    const temporaryAccessToken = jwt.sign(
      {
        sub: user.sub,
        role: user.role,
        name: user.name,
        patientId,
        scope: "EMERGENCY_BREAK_GLASS",
      },
      JWT_SECRET,
      { expiresIn: "15m" }
    );

    // High-visibility mandatory audit event
    await logAuditEvent({
      actorId: user.sub,
      actorRole: user.role,
      action: AuditAction.VIEW,
      entityType: "BreakGlassAccess",
      entityId: patientId,
      changes: {
        after: {
          patientId,
          justification,
          scope: "EMERGENCY_BREAK_GLASS",
          grantedAt: new Date().toISOString(),
          expiresInMinutes: 15,
        },
      },
    });

    return apiSuccess({
      temporaryAccessToken,
      patientId,
      scope: "EMERGENCY_BREAK_GLASS",
      expiresInMinutes: 15,
      auditLogged: true,
    });
  } catch (error: any) {
    return apiError(
      "SEC_BREAK_GLASS_FAILED",
      error?.message || "Failed to process emergency break-glass access",
      500
    );
  }
}
