import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { QueueService } from "@/server/services/queue.service";
import { authorizeQueueStaff } from "../../../route-auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorizeQueueStaff(request);
  if (auth.error || !auth.user) return auth.error;
  const { toDoctorId, reason } = await request.json();
  if (!toDoctorId || !reason?.trim()) {
    return apiError("QUE_TRANSFER_INVALID_REQUEST", "toDoctorId and reason are required", 400);
  }
  const result = await QueueService.transferToken(
    params.id,
    toDoctorId,
    reason,
    auth.user.sub,
    auth.user.role
  );
  return result.success
    ? apiSuccess({ newTokenId: result.data.id })
    : apiError(result.code, "Unable to transfer token", result.status, result.details);
}
