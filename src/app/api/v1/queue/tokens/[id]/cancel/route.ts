import { NextRequest } from "next/server";
import { UserRole } from "@prisma/client";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { getAuthUser, requireRole } from "@/lib/auth";
import { QueueService } from "@/server/services/queue.service";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const user = getAuthUser(request);
  if (!user) return apiError("UNAUTHENTICATED", "Authentication required", 401);
  if (
    !requireRole(user, [UserRole.PATIENT, UserRole.RECEPTIONIST, UserRole.DOCTOR, UserRole.NURSE])
  ) {
    return apiError("UNAUTHORIZED_ROLE", "Role cannot cancel queue tokens", 403);
  }
  const { reason } = await request.json();
  if (!reason?.trim()) return apiError("QUE_CANCEL_REASON_REQUIRED", "reason is required", 400);
  const result = await QueueService.cancelToken(
    params.id,
    reason,
    user.sub,
    user.role,
    user.role === UserRole.PATIENT ? user.sub : undefined
  );
  return result.success
    ? apiSuccess({ status: result.data.status })
    : apiError(result.code, "Unable to cancel token", result.status, result.details);
}
