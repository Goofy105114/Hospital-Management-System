import { NextRequest } from "next/server";
import { QueueService } from "@/server/services/queue.service";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { authorizeQueueStaff } from "../../../route-auth";

export async function POST(request: NextRequest, { params }: { params: { doctorId: string } }) {
  const auth = authorizeQueueStaff(request);
  if (auth.error || !auth.user) return auth.error;
  const result = await QueueService.callNext(params.doctorId, auth.user.sub, auth.user.role);
  return result.success
    ? apiSuccess({ token: result.data })
    : apiError(result.code, "Unable to call next patient", result.status, result.details);
}
