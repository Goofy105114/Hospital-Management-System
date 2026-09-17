import { NextRequest } from "next/server";
import { apiError, apiSuccess } from "@/lib/api-envelope";
import { QueueService } from "@/server/services/queue.service";
import { authorizeQueueStaff } from "../../../route-auth";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = authorizeQueueStaff(request);
  if (auth.error || !auth.user) return auth.error;
  const result = await QueueService.startConsultation(params.id, auth.user.sub, auth.user.role);
  return result.success
    ? apiSuccess({ status: result.data.status })
    : apiError(result.code, "Unable to start consultation", result.status, result.details);
}
