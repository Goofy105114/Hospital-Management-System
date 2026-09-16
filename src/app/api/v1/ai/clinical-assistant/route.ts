import { NextRequest } from "next/server";
import { generateClinicalSuggestions } from "@/lib/openrouter";
import { apiSuccess, apiError } from "@/lib/api-envelope";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { chiefComplaint, vitalsSummary } = body;

    if (!chiefComplaint) {
      return apiError("AI_MISSING_SYMPTOMS", "chiefComplaint is required", 400);
    }

    const result = await generateClinicalSuggestions(
      chiefComplaint,
      vitalsSummary || "Vitals within normal limits"
    );

    return apiSuccess(result.data, {
      source: result.source,
      confidence: result.confidence,
    });
  } catch (err) {
    console.error("[AI CLINICAL ASSISTANT ERROR]", err);
    return apiError("INTERNAL_SERVER_ERROR", "Clinical suggestion failed", 500);
  }
}
