import { NextRequest } from "next/server";
import { QueueService } from "@/server/services/queue.service";
import { getAuthUser } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    const body = await req.json();
    const { appointmentId, patientId, doctorId, isWalkIn, priorityTier } = body;

    const result = await QueueService.checkIn({
      appointmentId,
      patientId,
      doctorId,
      isWalkIn,
      priorityTier,
      actorId: auth?.sub,
    });

    if (!result.success) {
      return apiError(result.code || "CHECK_IN_FAILED", "Check-in failed", result.status || 400);
    }

    return apiSuccess(result.data, undefined, 201);
  } catch (err) {
    console.error("[CHECK-IN ERROR]", err);
    return apiError("INTERNAL_SERVER_ERROR", "Check-in failed", 500);
  }
}
