// ─── Shared LLM Client (Groq) ───────────────────────────────────────────────
// Centralizes Groq client init, prompt execution, and JSON extraction.
// Uses llama-3.3-70b-versatile via Groq's OpenAI-compatible API.
// Free tier: 30 RPM, 14,400 req/day.

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

/**
 * Generate a response from Groq and parse as JSON.
 * Returns parsed JSON object/array, or null on failure.
 *
 * @param {string} prompt - The prompt to send
 * @param {object} options - { maxTokens, jsonType: "object" | "array" }
 */
export async function generateJSON(prompt, { maxTokens = 1024, jsonType = "object" } = {}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || DEFAULT_MODEL,
        messages: [{ role: "user", content: prompt }],
        max_tokens: maxTokens,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      console.error(`Groq API error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return null;

    // Extract JSON from response (handle markdown code blocks)
    const pattern = jsonType === "array" ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
    const jsonMatch = text.match(pattern);
    if (!jsonMatch) return null;

    // Strip JS-style comments that LLMs sometimes add (// ... and /* ... */)
    const cleaned = jsonMatch[0]
      .replace(/\/\/[^\n]*/g, "")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/,\s*([}\]])/g, "$1"); // trailing commas

    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Groq generation failed:", err.message);
    return null;
  }
}

/**
 * Check if the LLM client is available (API key configured).
 */
export function isLLMAvailable() {
  return !!process.env.GROQ_API_KEY;
}
