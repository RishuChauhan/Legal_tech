// ─── Hybrid NLP Pipeline ───────────────────────────────────────────────────
// Combines rule-based pre/post-processing with LLM structured extraction.
// If LLM fails, falls back to pure rule-based output. Never returns empty fields.

import Anthropic from "@anthropic-ai/sdk";
import {
  detectDocumentType,
  detectJurisdiction,
  detectIndustry,
  matchTemplates,
  recommendClauses,
  mapRulebooks,
} from "./templateRegistry.js";

// ─── LLM Client ───────────────────────────────────────────────────────────

let anthropic = null;
function getClient() {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic();
  }
  return anthropic;
}

// ─── Rule-based party extraction ───────────────────────────────────────────

const PARTY_PATTERNS = [
  /between\s+(?:a\s+)?(.+?)\s+and\s+(?:a\s+)?(.+?)(?:\.|,|$)/i,
  /for\s+(?:a\s+)?(.+?)(?:\s+(?:in|based|located)\s+|$)/i,
  /(?:with|involving)\s+(?:a\s+)?(.+?)\s+and\s+(?:a\s+)?(.+?)(?:\.|,|$)/i,
];

function extractPartiesRuleBased(intentText) {
  for (const pattern of PARTY_PATTERNS) {
    const match = intentText.match(pattern);
    if (match) {
      const parties = [];
      if (match[1]) parties.push({ role: "party_1", description: match[1].trim() });
      if (match[2]) parties.push({ role: "party_2", description: match[2].trim() });
      return parties;
    }
  }
  return [];
}

// ─── Purpose extraction (rule-based) ───────────────────────────────────────

function extractPurpose(intentText) {
  const lower = intentText.toLowerCase();
  const purposePatterns = [
    /(?:for|regarding|concerning|about|related to)\s+(.+?)(?:\.|,|$)/i,
    /(?:to cover|covering|addressing)\s+(.+?)(?:\.|,|$)/i,
  ];
  for (const p of purposePatterns) {
    const m = intentText.match(p);
    if (m) return m[1].trim();
  }
  // Fallback: use document type context
  if (lower.includes("vendor") || lower.includes("service")) return "vendor services engagement";
  if (lower.includes("employ")) return "employment relationship";
  if (lower.includes("confiden") || lower.includes("nda")) return "confidentiality protection";
  if (lower.includes("license") || lower.includes("software")) return "software licensing";
  if (lower.includes("lease") || lower.includes("rent")) return "property lease";
  if (lower.includes("partner")) return "business partnership";
  if (lower.includes("consult")) return "consulting engagement";
  return "legal agreement";
}

// ─── LLM Structured Extraction ─────────────────────────────────────────────

async function extractWithLLM(intentText, ruleBasedContext) {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyse this legal document drafting request and extract structured information.

Intent: "${intentText}"

Rule-based pre-analysis detected:
- Possible document type: ${ruleBasedContext.documentType || "unknown"}
- Possible jurisdiction: ${ruleBasedContext.jurisdiction || "not specified"}
- Possible industry: ${ruleBasedContext.industry || "not specified"}

Extract the following as JSON:
{
  "documentType": "the specific type of legal document",
  "confidence": <number 0-100, how confident are you in the document type>,
  "parties": [{"role": "descriptive role name", "description": "who this party is"}],
  "jurisdiction": "country or region, or null if not specified",
  "industry": "industry/domain, or null if not specified",
  "purpose": "brief description of the document's purpose",
  "clarifyingQuestions": ["questions to ask if intent is ambiguous, max 3"]
}

Return ONLY valid JSON, no markdown or explanation.`,
        },
      ],
    });

    const text = response.content[0]?.text;
    if (!text) return null;

    // Parse JSON from response (handle potential markdown wrapping)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("LLM extraction failed, using rule-based fallback:", err.message);
    return null;
  }
}

// ─── Main Analysis Function ────────────────────────────────────────────────

/**
 * Analyse user intent and return structured suggestions.
 * Always returns a complete response — never empty or undefined fields.
 *
 * Pipeline: Intent → Rule-based pre-processing → LLM extraction →
 *           Rule-based post-processing → Template/Clause/Rulebook mapping
 */
export async function analyseIntent(intentText) {
  // ── Step 1: Rule-based pre-processing ──
  const detectedTypes = detectDocumentType(intentText);
  const jurisdiction = detectJurisdiction(intentText);
  const industry = detectIndustry(intentText);
  const partiesRuleBased = extractPartiesRuleBased(intentText);
  const purpose = extractPurpose(intentText);

  const topType = detectedTypes[0] || null;
  const ruleBasedConfidence = topType ? Math.min(topType.score * 5, 85) : 30;

  const ruleBasedContext = {
    documentType: topType?.label || null,
    documentTypeId: topType?.id || null,
    jurisdiction,
    industry,
  };

  // ── Step 2: LLM structured extraction (optional enhancement) ──
  const llmResult = await extractWithLLM(intentText, ruleBasedContext);

  // ── Step 3: Merge rule-based + LLM results ──
  // LLM results enhance rule-based, but rule-based is the fallback
  let finalDocType = topType?.label || "General Agreement";
  let finalDocTypeId = topType?.id || "vendor-agreement";
  let finalConfidence = ruleBasedConfidence;
  let finalParties = partiesRuleBased;
  let finalJurisdiction = jurisdiction;
  let finalIndustry = industry;
  let finalPurpose = purpose;
  let clarifyingQuestions = [];

  if (llmResult) {
    // LLM can refine document type if rule-based was uncertain
    if (llmResult.documentType && llmResult.confidence > finalConfidence) {
      // Find matching type ID from our taxonomy
      const llmTypeMatch = detectedTypes.find(
        dt => dt.label.toLowerCase() === llmResult.documentType.toLowerCase()
      );
      if (llmTypeMatch) {
        finalDocType = llmTypeMatch.label;
        finalDocTypeId = llmTypeMatch.id;
      } else {
        finalDocType = llmResult.documentType;
      }
      // Blend confidences: LLM gets 60% weight, rule-based 40%
      finalConfidence = Math.round(llmResult.confidence * 0.6 + ruleBasedConfidence * 0.4);
    }

    // LLM parties are usually more accurate
    if (llmResult.parties?.length > 0) {
      finalParties = llmResult.parties;
    }

    // LLM can detect jurisdiction/industry not caught by keywords
    if (llmResult.jurisdiction && !finalJurisdiction) {
      finalJurisdiction = llmResult.jurisdiction.toLowerCase();
    }
    if (llmResult.industry && !finalIndustry) {
      finalIndustry = llmResult.industry.toLowerCase();
    }
    if (llmResult.purpose) {
      finalPurpose = llmResult.purpose;
    }
    if (llmResult.clarifyingQuestions?.length > 0) {
      clarifyingQuestions = llmResult.clarifyingQuestions.slice(0, 3);
    }
  }

  // Ensure confidence is within bounds
  finalConfidence = Math.max(20, Math.min(99, finalConfidence));

  // ── Step 4: Rule-based post-processing (template/clause/rulebook mapping) ──
  const templates = matchTemplates(finalDocTypeId, intentText);
  const clauses = recommendClauses(finalDocTypeId);
  const rulebooks = mapRulebooks(finalDocTypeId, finalJurisdiction, finalIndustry);

  const bestTemplate = templates[0] || { id: "t1", name: "General Agreement Template", matchScore: 50 };
  const alternativeTemplates = templates.slice(1, 4);
  const bestRulebook = rulebooks[0] || { id: "r2", name: "Standard Legal Guidelines", matchScore: 40 };

  // ── Step 5: Build guaranteed response ──
  return {
    documentType: finalDocType,
    confidence: finalConfidence,
    entities: {
      parties: finalParties.length > 0 ? finalParties : [{ role: "party_1", description: "First Party" }, { role: "party_2", description: "Second Party" }],
      jurisdiction: finalJurisdiction,
      industry: finalIndustry,
      purpose: finalPurpose,
    },
    suggestions: {
      clauses: clauses.filter(c => c.relevanceScore > 20),
      template: bestTemplate,
      rulebook: bestRulebook,
      alternativeTemplates,
    },
    customizationPrompts: clarifyingQuestions,
  };
}
