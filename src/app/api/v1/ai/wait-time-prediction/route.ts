import { NextRequest } from "next/server";
import { predictWaitTime, generateClinicalSuggestions } from "@/lib/openrouter";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { queuePosition, avgConsultationMinutes } = body;

    if (queuePosition === undefined) {
      return apiError("AI_MISSING_QUEUE_POSITION", "queuePosition is required", 400);
    }

    const result = await predictWaitTime(
      Number(queuePosition),
      Number(avgConsultationMinutes || 12)
    );

    return apiSuccess(result.data, {
      source: result.source,
      confidence: result.confidence,
    });
  } catch (err) {
    console.error("[AI WAIT TIME PREDICTION ERROR]", err);
    return apiError("INTERNAL_SERVER_ERROR", "Wait time prediction failed", 500);
  }
}
