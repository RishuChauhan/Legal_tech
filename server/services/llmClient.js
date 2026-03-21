// ─── Shared LLM Client (Google Gemini) ─────────────────────────────────────
// Centralizes Gemini client init, prompt execution, and JSON extraction.
// Uses gemini-2.0-flash (free tier: 15 RPM, 1M TPM).

import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI = null;
let model = null;

function getModel() {
  if (!model && process.env.GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  }
  return model;
}

/**
 * Generate a response from Gemini and parse as JSON.
 * Returns parsed JSON object/array, or null on failure.
 *
 * @param {string} prompt - The prompt to send
 * @param {object} options - { maxTokens, jsonType: "object" | "array" }
 */
export async function generateJSON(prompt, { maxTokens = 1024, jsonType = "object" } = {}) {
  const m = getModel();
  if (!m) return null;

  try {
    const result = await m.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: 0.3,
      },
    });

    const text = result.response?.text();
    if (!text) return null;

    // Extract JSON from response (handle markdown code blocks)
    const pattern = jsonType === "array" ? /\[[\s\S]*\]/ : /\{[\s\S]*\}/;
    const jsonMatch = text.match(pattern);
    if (!jsonMatch) return null;

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("Gemini generation failed:", err.message);
    return null;
  }
}

/**
 * Check if the LLM client is available (API key configured).
 */
export function isLLMAvailable() {
  return !!process.env.GEMINI_API_KEY;
}
