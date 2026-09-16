import axios from "axios";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export interface AiDecisionResult<T> {
  data: T;
  source: "ai_model" | "fallback";
  confidence?: number;
}

/**
 * Predict wait time with 500ms hard timeout and rule-based fallback (AI-01)
 */
export async function predictWaitTime(
  queuePosition: number,
  avgConsultationMinutes = 12
): Promise<AiDecisionResult<{ estimatedMinutes: number }>> {
  // Deterministic fallback rule: position * avgConsultationMinutes
  const fallbackMinutes = Math.max(5, queuePosition * avgConsultationMinutes);

  if (!OPENROUTER_API_KEY) {
    return {
      data: { estimatedMinutes: fallbackMinutes },
      source: "fallback",
      confidence: 0.85,
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 500); // 500ms hard timeout

    const prompt = `You are a clinical queue optimizer. Return ONLY a single integer estimated wait time in minutes for patient at position ${queuePosition} with doctor historical average ${avgConsultationMinutes} minutes per visit.`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 10,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://goingmerry.hms",
          "X-Title": "Going Merry HMS",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);
    const content = response.data?.choices?.[0]?.message?.content?.trim();
    const parsed = parseInt(content, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return {
        data: { estimatedMinutes: parsed },
        source: "ai_model",
        confidence: 0.92,
      };
    }
  } catch {
    // Graceful fallback on network failure, timeout, or invalid format
  }

  return {
    data: { estimatedMinutes: fallbackMinutes },
    source: "fallback",
    confidence: 0.85,
  };
}

/**
 * Predict No-Show Risk for Appointment (AI-02)
 */
export async function predictNoShowRisk(
  pastNoShowsCount: number,
  leadDays: number
): Promise<AiDecisionResult<{ riskScore: number; level: "LOW" | "MODERATE" | "HIGH" }>> {
  // Deterministic rule: based on past no show count and lead time
  let score = 0.1;
  if (pastNoShowsCount > 0) score += pastNoShowsCount * 0.25;
  if (leadDays > 14) score += 0.15;
  score = Math.min(0.95, Math.max(0.05, score));

  const level = score >= 0.6 ? "HIGH" : score >= 0.3 ? "MODERATE" : "LOW";

  return {
    data: { riskScore: parseFloat(score.toFixed(2)), level },
    source: "fallback",
  };
}

/**
 * AI Clinical Note and Differential Diagnosis Assistant (EMR / AI-01)
 */
export async function generateClinicalSuggestions(
  chiefComplaint: string,
  vitalsSummary: string
): Promise<AiDecisionResult<{ suggestions: string[]; considerations: string }>> {
  if (!OPENROUTER_API_KEY) {
    return {
      data: {
        suggestions: [
          "Check cardiac markers (Troponin I/T) if chest pain or tightness present",
          "Review medication adherence for hypertensive therapies",
          "Schedule follow-up lipid profile and CMP in 4-6 weeks",
        ],
        considerations:
          "Advisory guidance only. Final diagnosis and care plan remain solely the physician's clinical responsibility.",
      },
      source: "fallback",
      confidence: 0.8,
    };
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a clinical decision support advisor for a licensed physician. Suggest 3 concise, bulleted clinical recommendations based on symptoms. Always maintain advisory tone.",
          },
          {
            role: "user",
            content: `Chief Complaint: ${chiefComplaint}\nVitals: ${vitalsSummary}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://goingmerry.hms",
        },
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content;
    if (reply) {
      const suggestions = reply
        .split("\n")
        .map((s: string) => s.replace(/^[-*•\d.]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 4);

      return {
        data: {
          suggestions,
          considerations:
            "Advisory decision support generated via AI model. Clinical verification required.",
        },
        source: "ai_model",
        confidence: 0.9,
      };
    }
  } catch {
    // fallback
  }

  return {
    data: {
      suggestions: [
        "Evaluate symptom duration and exacerbating factors",
        "Consider standard baseline metabolic and CBC panel",
        "Maintain current therapy pending diagnostic review",
      ],
      considerations: "Advisory guidance fallback.",
    },
    source: "fallback",
  };
}
