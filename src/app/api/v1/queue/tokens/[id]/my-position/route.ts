import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser } from "@/lib/auth";
import { QueueTokenStatus, UserRole } from "@prisma/client";
import { deterministicWaitEstimate } from "@/server/domain/wait-time";

/**
 * QUE-02 / QUE-03 — GET /api/v1/queue/tokens/:id/my-position
 *
 * Patient-facing view: returns position in queue and estimated wait time.
 * Patients may only query their own token (scope-enforced by userId check).
 * Clinical staff may query any token.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);

  try {
    let token = null;
    try {
      token = await prisma.queueToken.findUnique({
        where: { id: params.id },
        include: {
          patient: { select: { userId: true } },
          doctor: { select: { id: true, roomNumber: true, user: { select: { name: true } } } },
        },
      });
    } catch {
      // DB offline — return deterministic fallback
    }

    if (token === null) {
      return apiError("QUE_TOKEN_NOT_FOUND", "Queue token not found", 404);
    }

    // Patients may only view their own position
    if (user.role === UserRole.PATIENT && token && token.patient.userId !== user.sub) {
      return apiError("QUE_TOKEN_SCOPE_DENIED", "Patients may only view their own position", 403);
    }

    // If token is no longer active, return final status
    if (
      token &&
      (
        [
          QueueTokenStatus.COMPLETED,
          QueueTokenStatus.CANCELLED,
          QueueTokenStatus.NO_RESPONSE,
          QueueTokenStatus.TRANSFERRED,
        ] as QueueTokenStatus[]
      ).includes(token.status)
    ) {
      return apiSuccess({
        tokenId: token.id,
        tokenNumber: token.tokenNumber,
        status: token.status,
        position: null,
        estimatedWaitMinutes: 0,
        message: `Token is ${token.status.toLowerCase()}`,
      });
    }

    // Count tokens ahead (WAITING with lower position, or CALLED/IN_CONSULTATION)
    let position = token?.position ?? 1;
    let estimatedWaitMinutes = token?.estimatedWaitMinutes ?? 15;

    if (token) {
      try {
        // Recompute live position: count WAITING tokens at same doctor ahead of this one
        const tokensAhead = await prisma.queueToken.count({
          where: {
            doctorId: token.doctorId,
            status: QueueTokenStatus.WAITING,
            position: { lt: token.position },
          },
        });
        // Add 1 for any currently CALLED or IN_CONSULTATION token
        const activeCount = await prisma.queueToken.count({
          where: {
            doctorId: token.doctorId,
            status: { in: [QueueTokenStatus.CALLED, QueueTokenStatus.IN_CONSULTATION] },
          },
        });

        position = tokensAhead + (token.status === QueueTokenStatus.WAITING ? 1 : 0);
        estimatedWaitMinutes = deterministicWaitEstimate({
          queuePosition: tokensAhead + activeCount,
          avgConsultationMinutes: 12,
          activeWalkIns: 0,
          doctorAvailable: true,
        });
      } catch {
        // DB error — use stored values
      }
    }

    return apiSuccess({
      tokenId: params.id,
      tokenNumber: token?.tokenNumber ?? "—",
      status: token?.status ?? "WAITING",
      position,
      estimatedWaitMinutes,
      doctorName: token?.doctor.user.name ?? null,
      roomNumber: token?.doctor.roomNumber ?? null,
    });
  } catch (err: any) {
    return apiError("INTERNAL_ERROR", err.message || "Failed to retrieve queue position", 500);
  }
}
