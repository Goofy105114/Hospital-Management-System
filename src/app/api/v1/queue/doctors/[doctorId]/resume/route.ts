import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { QueueService } from "@/server/services/queue.service";
import { authorizeQueueStaff } from "../../../route-auth";

export async function POST(request: NextRequest, { params }: { params: { doctorId: string } }) {
  const auth = authorizeQueueStaff(request);
  if (auth.error || !auth.user) return auth.error;
  const result = await QueueService.setQueuePaused(
    params.doctorId,
    false,
    undefined,
    auth.user.sub,
    auth.user.role
  );
  return result.success
    ? apiSuccess({})
    : apiError(result.code, "Unable to resume queue", result.status);
}
