import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { QueueService } from "@/server/services/queue.service";
import { authorizeQueueStaff } from "../../../route-auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorizeQueueStaff(request);
  if (auth.error || !auth.user) return auth.error;
  const result = await QueueService.recallToken(params.id, auth.user.sub, auth.user.role);
  return result.success
    ? apiSuccess({ recallCount: result.data.recallCount })
    : apiError(result.code, "Unable to recall patient", result.status, result.details);
}
