import { NextRequest } from "next/server";
import { WaitTimePredictionService } from "@/server/services/wait-time-prediction.service";
import { apiSuccess, apiError } from "@/lib/api-envelope";
import { getAuthUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) return apiError("UNAUTHENTICATED", "Authentication required", 401);
    const body = await req.json();
    const { doctorId, queuePosition, appointmentType } = body;

    if (!doctorId || queuePosition === undefined) {
      return apiError("AI_INVALID_WAIT_INPUT", "doctorId and queuePosition are required", 400);
    }

    const result = await WaitTimePredictionService.predict({
      doctorId,
      queuePosition: Number(queuePosition),
      appointmentType,
    });
    return apiSuccess(result);
  } catch (err) {
    console.error("[AI WAIT TIME PREDICTION ERROR]", err);
    return apiError("INTERNAL_SERVER_ERROR", "Wait time prediction failed", 500);
  }
}
