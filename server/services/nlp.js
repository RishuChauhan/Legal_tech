// ─── Hybrid NLP Pipeline ───────────────────────────────────────────────────
// Hybrid approach: Rule-based system detects document type, template,
// jurisdiction, and industry (deterministic, reliable). LLM handles what
// needs intelligence: clause selection, rulebook mapping, party extraction.
// Falls back to full rule-based if LLM is unavailable. Never returns empty fields.

import { generateJSON } from "./llmClient.js";
import {
  DOCUMENT_TYPES,
  CLAUSES,
  RULEBOOKS,
  detectDocumentType,
  detectJurisdiction,
  detectIndustry,
  matchTemplates,
  recommendClauses,
  mapRulebooks,
  holisticRescore,
} from "./templateRegistry.js";

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

// ─── Build catalogue strings for LLM prompt ────────────────────────────────

function buildClauseCatalogue() {
  return CLAUSES.map(c => `- ${c.id}: ${c.label}`).join("\n");
}

function buildRulebookCatalogue() {
  return RULEBOOKS.map(r => `- ${r.id}: ${r.name}`).join("\n");
}

// ─── LLM: Intent Normalization (fuzzy matching, typos, spacing) ─────────────

/**
 * Lightweight LLM call to normalize the user's intent into a canonical
 * document type ID. Handles misspellings, word spacing ("share holder"),
 * abbreviations the rule-based system doesn't know, and natural language.
 * Small prompt (~200 tokens) — fast and cheap.
 */
async function normalizeIntent(intentText) {
  const docTypeList = DOCUMENT_TYPES.map(dt => `${dt.id}: ${dt.label}`).join("\n");

  const prompt = `Given this user request for a legal document, identify which document type they want.

REQUEST: "${intentText}"

DOCUMENT TYPES:
${docTypeList}

Reply with ONLY valid JSON, no comments:
{"documentTypeId":"the-id","documentTypeLabel":"The Label"}

If unclear, pick the closest match. Consider misspellings, abbreviations, and spacing variations (e.g. "share holder" = "shareholder", "emplyment" = "employment", "non discloser" = "non-disclosure").`;

  const result = await generateJSON(prompt, { maxTokens: 128, jsonType: "object" });

  if (result?.documentTypeId) {
    const matched = DOCUMENT_TYPES.find(dt => dt.id === result.documentTypeId);
    if (matched) {
      console.log(`─── LLM NORMALIZED: "${intentText}" → ${matched.id} (${matched.label}) ───`);
      return matched;
    }
  }
  return null;
}

// ─── LLM: Full Analysis + Mapping ──────────────────────────────────────────

/**
 * AI-powered analysis. The LLM receives pre-detected context from the
 * rule-based system (which is reliable for doc type / jurisdiction / industry)
 * and focuses on what needs intelligence: entity extraction, clause selection,
 * rulebook applicability, and clarifying questions.
 */
async function analyseWithLLM(intentText, ruleBasedContext) {
  const { documentType, documentTypeId, jurisdiction, industry, templateName, templateId } = ruleBasedContext;

  const prompt = `You are a senior legal counsel. A user wants to draft a legal document.

REQUEST: "${intentText}"

DETECTED CONTEXT (from pre-analysis — trust these unless clearly wrong):
- Document type: ${documentType} (${documentTypeId})
- Template: ${templateName} (${templateId})
- Jurisdiction: ${jurisdiction || "not specified"}
- Industry: ${industry || "not specified"}

YOUR TASKS — focus on these:

1. PARTIES: Extract from the request. Use descriptive roles (Vendor, Client, Employer, Licensor, Buyer, Seller, etc.).

2. CLAUSES: Select 6-10 clauses genuinely relevant to a "${documentType}". Pick from this list:
${buildClauseCatalogue()}

Select clauses that:
- Are core to this document type (what makes a ${documentType} a ${documentType})
- Are explicitly mentioned or implied by the user
- A competent lawyer would always include for this type
Do NOT select clauses irrelevant to this document type. Quality over quantity.

3. RULEBOOKS: Select ONLY if directly applicable. Pick from:
${buildRulebookCatalogue()}
Rules: India jurisdiction → r5. GDPR/EU data → r3. HIPAA/health → r8. US employment → r7. If none apply, return [].
NEVER include r1 or r2 — these are generic filler.

4. CLARIFYING QUESTIONS: 1-3 questions about missing critical details.

5. PURPOSE: One sentence describing the document's purpose.

Return ONLY valid JSON, no comments:
{"parties":[{"role":"Role","description":"..."}],"selectedClauseIds":["c1","c5"],"rulebookIds":[],"clarifyingQuestions":["..."],"purpose":"..."}`;

  console.log("\n─── LLM PROMPT ───");
  console.log(prompt);
  console.log("─── END PROMPT ───\n");

  const result = await generateJSON(prompt, { maxTokens: 1024, jsonType: "object" });

  if (result) {
    console.log("─── LLM RESPONSE ───");
    console.log(JSON.stringify(result, null, 2));
    console.log("─── END RESPONSE ───\n");
  }

  return result;
}

// ─── Merge LLM selections with registry data ───────────────────────────────

function buildClausesFromLLM(selectedIds, documentTypeId) {
  // Build full clause list with LLM-selected ones marked
  const selectedSet = new Set(selectedIds || []);
  return CLAUSES.map(c => {
    const isApplicable = c.applicableTo.includes(documentTypeId);
    const isSelected = selectedSet.has(c.id);
    return {
      id: c.id,
      label: c.label,
      relevanceScore: isSelected ? Math.max(c.weight, 85) : (isApplicable ? c.weight : Math.floor(c.weight * 0.3)),
      selected: isSelected,
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function buildRulebooksFromLLM(rulebookIds) {
  const selectedSet = new Set(rulebookIds || []);
  return RULEBOOKS
    .filter(r => selectedSet.has(r.id))
    .map(r => ({
      id: r.id,
      name: r.name,
      matchScore: 80,
      mandatoryClauses: r.mandatoryClauses || [],
    }));
}

// ─── Rule-based fallback (used when LLM is unavailable) ────────────────────

function ruleBasedAnalysis(intentText) {
  const detectedTypes = detectDocumentType(intentText);
  const jurisdiction = detectJurisdiction(intentText);
  const industry = detectIndustry(intentText);
  const partiesRuleBased = extractPartiesRuleBased(intentText);

  const topType = detectedTypes[0] || null;
  const finalDocTypeId = topType?.id || "vendor-agreement";
  const finalDocType = topType?.label || "General Agreement";
  const ruleBasedConfidence = topType ? Math.min(topType.score * 5, 85) : 30;

  const templates = matchTemplates(finalDocTypeId, intentText);
  const rawClauses = recommendClauses(finalDocTypeId, intentText);
  const rulebooks = mapRulebooks(finalDocTypeId, jurisdiction, industry, intentText);
  const clauses = holisticRescore(rawClauses, templates, rulebooks);

  const bestTemplate = templates[0] || { id: "t1", name: "General Agreement Template", matchScore: 50 };
  const alternativeTemplates = templates.slice(1, 4);
  const bestRulebook = rulebooks[0] || { id: "r2", name: "Standard Legal Guidelines", matchScore: 40 };
  const additionalRulebooks = rulebooks.slice(1, 4);

  return {
    documentType: finalDocType,
    confidence: Math.max(20, Math.min(99, ruleBasedConfidence)),
    entities: {
      parties: partiesRuleBased.length > 0 ? partiesRuleBased : [{ role: "party_1", description: "First Party" }, { role: "party_2", description: "Second Party" }],
      jurisdiction,
      industry,
      purpose: extractPurpose(intentText),
    },
    suggestions: {
      clauses: clauses.filter(c => c.relevanceScore > 20),
      template: bestTemplate,
      rulebook: bestRulebook,
      additionalRulebooks,
      alternativeTemplates,
    },
    customizationPrompts: [],
  };
}

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
  if (lower.includes("vendor") || lower.includes("service")) return "vendor services engagement";
  if (lower.includes("employ")) return "employment relationship";
  if (lower.includes("confiden") || lower.includes("nda")) return "confidentiality protection";
  if (lower.includes("license") || lower.includes("software")) return "software licensing";
  if (lower.includes("lease") || lower.includes("rent")) return "property lease";
  if (lower.includes("partner")) return "business partnership";
  if (lower.includes("consult")) return "consulting engagement";
  if (lower.includes("shareholder") || lower.includes("stockholder")) return "shareholder rights and obligations";
  if (lower.includes("franchise")) return "franchise relationship";
  if (lower.includes("distribution")) return "distribution arrangement";
  if (lower.includes("merger") || lower.includes("acquisition")) return "merger or acquisition";
  if (lower.includes("mou") || lower.includes("memorandum")) return "pre-contractual understanding";
  if (lower.includes("loi") || lower.includes("letter of intent")) return "preliminary agreement";
  if (lower.includes("sla") || lower.includes("service level")) return "service level commitments";
  if (lower.includes("sow") || lower.includes("scope of work")) return "project scope definition";
  if (lower.includes("contractor") || lower.includes("freelance")) return "independent contractor engagement";
  return "legal agreement";
}

// ─── Main Analysis Function ────────────────────────────────────────────────

/**
 * Analyse user intent and return structured suggestions.
 * HYBRID approach:
 *   1. Rule-based system detects document type, jurisdiction, industry, template
 *      (deterministic and reliable for pattern matching)
 *   2. LLM receives that context and focuses on what needs intelligence:
 *      clause selection, rulebook applicability, party extraction, questions
 *   3. Falls back to full rule-based if LLM is unavailable
 * Always returns a complete response — never empty or undefined fields.
 */
export async function analyseIntent(intentText) {
  // ── Step 1: Rule-based pre-processing (reliable, deterministic) ──
  const detectedTypes = detectDocumentType(intentText);
  const jurisdiction = detectJurisdiction(intentText);
  const industry = detectIndustry(intentText);

  let topType = detectedTypes[0] || null;
  const ruleBasedScore = topType?.score || 0;

  // ── Step 1B: LLM normalization for fuzzy/ambiguous inputs ──
  // If rule-based confidence is low (score < 15) or no match, ask LLM to
  // interpret the intent. Handles typos, spacing, unknown abbreviations.
  if (ruleBasedScore < 15) {
    console.log(`Rule-based score low (${ruleBasedScore}) — asking LLM to normalize intent...`);
    const llmNormalized = await normalizeIntent(intentText);
    if (llmNormalized) {
      topType = { id: llmNormalized.id, label: llmNormalized.label, score: 20 };
    }
  }

  const finalDocTypeId = topType?.id || "vendor-agreement";
  const finalDocType = topType?.label || "General Agreement";
  const ruleBasedConfidence = topType ? Math.min(topType.score * 5, 85) : 30;

  const ruleBasedTemplates = matchTemplates(finalDocTypeId, intentText);
  const bestTemplate = ruleBasedTemplates[0] || { id: "t1", name: "General Agreement Template", matchScore: 50 };
  const alternativeTemplates = ruleBasedTemplates.slice(1, 4);

  // ── Step 2: Build context for LLM ──
  const ruleBasedContext = {
    documentType: finalDocType,
    documentTypeId: finalDocTypeId,
    jurisdiction,
    industry,
    templateName: bestTemplate.name,
    templateId: bestTemplate.id,
  };

  console.log("─── RULE-BASED CONTEXT ───");
  console.log(JSON.stringify(ruleBasedContext, null, 2));
  console.log("─── END CONTEXT ───\n");

  // ── Step 3: LLM-powered clause/rulebook/party selection ──
  const llmResult = await analyseWithLLM(intentText, ruleBasedContext);

  if (llmResult) {
    // LLM succeeded — use its clause/rulebook/party selections
    // but keep rule-based doc type and template (they're more reliable)

    // Build clauses: LLM-selected ones are pre-checked, rest are available
    const rawClauses = buildClausesFromLLM(llmResult.selectedClauseIds, finalDocTypeId);

    // Build rulebooks from LLM selection (no generic filler)
    const llmRulebooks = buildRulebooksFromLLM(llmResult.rulebookIds);

    // Apply holistic rescoring (template bindings + rulebook mandates + relationships)
    const clauses = holisticRescore(rawClauses, [bestTemplate], llmRulebooks);

    // Split rulebooks into primary + additional
    const bestRulebook = llmRulebooks[0] || null;
    const additionalRulebooks = llmRulebooks.slice(1);

    // Parties: prefer LLM extraction, fall back to rule-based
    const parties = (llmResult.parties?.length > 0)
      ? llmResult.parties
      : extractPartiesRuleBased(intentText);

    const confidence = Math.max(ruleBasedConfidence, 60); // LLM available → at least 60

    return {
      documentType: finalDocType,
      confidence: Math.min(99, confidence),
      entities: {
        parties: parties.length > 0 ? parties : [{ role: "party_1", description: "First Party" }, { role: "party_2", description: "Second Party" }],
        jurisdiction: jurisdiction || null,
        industry: industry || null,
        purpose: llmResult.purpose || extractPurpose(intentText),
      },
      suggestions: {
        clauses: clauses.filter(c => c.relevanceScore > 20),
        template: bestTemplate,
        rulebook: bestRulebook,
        additionalRulebooks,
        alternativeTemplates,
      },
      customizationPrompts: (llmResult.clarifyingQuestions || []).slice(0, 3),
    };
  }

  // ── Fallback: Full rule-based analysis (LLM unavailable) ──
  console.log("LLM unavailable or failed — using full rule-based analysis");
  return ruleBasedAnalysis(intentText);
}
