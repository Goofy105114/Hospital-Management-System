import axios from 'axios';

/**
 * OpenRouter AI Client Wrapper
 * Provides access to frontier models with deterministic fallback per PRD A.4.10.
 */
export async function queryOpenRouter(prompt: string, systemInstruction?: string) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';

  if (!apiKey || apiKey.startsWith('sk-or-v1-sample')) {
    // Deterministic fallback per PRD A.4.10
    return {
      text: 'AI decision support is operating in fallback rule-based mode.',
      source: 'fallback' as const,
      model: 'deterministic-rules',
    };
  }

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages: [
          ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
          { role: 'user', content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Going Merry Hospital Management System',
        },
      }
    );

    return {
      text: response.data.choices[0]?.message?.content || '',
      source: 'ai_model' as const,
      model,
    };
  } catch (err: any) {
    console.warn('[OpenRouter] AI call failed, engaging fallback per PRD A.4.10:', err.message);
    return {
      text: 'Rule-based fallback response engaged.',
      source: 'fallback' as const,
      model: 'fallback-rules',
    };
  }
}
