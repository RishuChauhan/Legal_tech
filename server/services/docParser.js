// ─── Document Parser Service ───────────────────────────────────────────────
// Extracts structured blocks from PDF, DOCX, and TXT files.
// Uses rule-based section detection + optional LLM classification.

import crypto from "crypto";
import Anthropic from "@anthropic-ai/sdk";

let anthropic = null;
function getClient() {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic();
  }
  return anthropic;
}

// ─── Text Extraction ───────────────────────────────────────────────────────

async function extractText(file) {
  const { mimetype, buffer, originalname } = file;

  if (mimetype === "text/plain") {
    return buffer.toString("utf-8");
  }

  if (mimetype === "application/pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer);
    return data.text;
  }

  if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  throw new Error(`Unsupported file type: ${mimetype} (${originalname})`);
}

// ─── Section Detection (Rule-based) ────────────────────────────────────────

// Patterns for detecting section headings
const HEADING_PATTERNS = [
  // Numbered sections: "1.", "1.1", "1.1.1", "Article 1", "Section 1"
  /^(?:article|section|clause)\s+\d+[\.\):]?\s*/i,
  /^\d+\.(?:\d+\.?)*\s+/,
  // ALL CAPS headings (at least 3 chars, not just numbers)
  /^[A-Z][A-Z\s&,\-]{2,}$/,
  // Roman numeral sections
  /^(?:I{1,3}|IV|V|VI{0,3}|IX|X)[\.\)]\s+/,
  // Lettered sections: "a)", "A.", "(a)"
  /^\(?[a-zA-Z]\)\.?\s+/,
];

function isHeading(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length < 3) return false;
  return HEADING_PATTERNS.some(p => p.test(trimmed));
}

function splitIntoSections(text) {
  const lines = text.split("\n");
  const sections = [];
  let currentTitle = "";
  let currentBody = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (isHeading(trimmed) && currentBody.length > 0) {
      // Save previous section
      if (currentTitle || currentBody.join("\n").trim().length > 20) {
        sections.push({
          title: currentTitle || "Untitled Section",
          body: currentBody.join("\n").trim(),
        });
      }
      currentTitle = trimmed;
      currentBody = [];
    } else if (isHeading(trimmed) && currentBody.length === 0) {
      // First heading or consecutive headings
      if (currentTitle) {
        sections.push({ title: currentTitle, body: "" });
      }
      currentTitle = trimmed;
    } else {
      currentBody.push(line);
    }
  }

  // Save last section
  if (currentTitle || currentBody.join("\n").trim().length > 20) {
    sections.push({
      title: currentTitle || "Untitled Section",
      body: currentBody.join("\n").trim(),
    });
  }

  // If no sections detected, treat entire text as one block
  if (sections.length === 0 && text.trim().length > 0) {
    sections.push({
      title: "Full Document",
      body: text.trim(),
    });
  }

  return sections;
}

// ─── Block Classification (Rule-based) ─────────────────────────────────────

const OBLIGATION_KEYWORDS = ["shall", "must", "obligated", "required to", "agrees to", "undertakes to", "will ensure"];
const LIABILITY_KEYWORDS = ["liable", "liability", "indemnify", "indemnification", "damages", "penalty", "penalties"];
const DEFINITION_KEYWORDS = ["means", "defined as", "refers to", "shall mean", "hereinafter"];

function classifyBlock(title, body) {
  const titleLower = title.toLowerCase();
  const bodyLower = body.toLowerCase();
  const combined = `${titleLower} ${bodyLower}`;

  // Check for definitions
  if (
    titleLower.includes("definition") ||
    titleLower.includes("interpretation") ||
    DEFINITION_KEYWORDS.some(kw => bodyLower.includes(kw) && bodyLower.indexOf(kw) < 200)
  ) {
    return { type: "definition", importance: "standard" };
  }

  // Check for obligations
  const obligationCount = OBLIGATION_KEYWORDS.filter(kw => combined.includes(kw)).length;
  if (obligationCount >= 2 || titleLower.includes("obligation")) {
    return { type: "obligation", importance: "high" };
  }

  // Check for liability
  const liabilityCount = LIABILITY_KEYWORDS.filter(kw => combined.includes(kw)).length;
  if (liabilityCount >= 1 || titleLower.includes("liabilit") || titleLower.includes("indemnit")) {
    return { type: "obligation", importance: "high" };
  }

  // Check for recitals/preamble
  if (titleLower.includes("recital") || titleLower.includes("whereas") || titleLower.includes("preamble")) {
    return { type: "recital", importance: "standard" };
  }

  // Default: treat as clause
  const hasObligations = obligationCount >= 1;
  return { type: "clause", importance: hasObligations ? "standard" : "standard" };
}

// ─── Key Term Extraction ───────────────────────────────────────────────────

function extractKeyTerms(text) {
  const terms = new Set();

  // Match "Defined Term" patterns (quoted capitalized terms)
  const quotedPattern = /"([A-Z][a-zA-Z\s]{2,}?)"/g;
  let match;
  while ((match = quotedPattern.exec(text)) !== null) {
    terms.add(match[1].trim());
  }

  // Match 'Defined Term' patterns (single quotes)
  const singleQuotePattern = /'([A-Z][a-zA-Z\s]{2,}?)'/g;
  while ((match = singleQuotePattern.exec(text)) !== null) {
    terms.add(match[1].trim());
  }

  // Match bold-style defined terms (common in DOCX converted to text)
  const boldPattern = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)\b(?=\s+(?:means|shall mean|refers to))/g;
  while ((match = boldPattern.exec(text)) !== null) {
    terms.add(match[1].trim());
  }

  return [...terms].slice(0, 30); // Cap at 30 terms
}

// ─── Document Type Detection from content ──────────────────────────────────

function detectDocumentTypeFromContent(text) {
  const lower = text.toLowerCase().slice(0, 2000); // Check first 2000 chars
  const typeScores = [
    { type: "Vendor Agreement", score: 0, keywords: ["vendor", "service provider", "deliverable", "statement of work"] },
    { type: "Non-Disclosure Agreement", score: 0, keywords: ["confidential", "non-disclosure", "nda", "proprietary information"] },
    { type: "Employment Agreement", score: 0, keywords: ["employee", "employer", "compensation", "benefits", "employment"] },
    { type: "Lease Agreement", score: 0, keywords: ["lease", "tenant", "landlord", "rent", "premises"] },
    { type: "Software License Agreement", score: 0, keywords: ["software", "license", "user", "subscription", "saas"] },
    { type: "Consulting Agreement", score: 0, keywords: ["consultant", "consulting", "advisory", "scope of work"] },
    { type: "Partnership Agreement", score: 0, keywords: ["partnership", "partner", "profit sharing", "contribution"] },
    { type: "Loan Agreement", score: 0, keywords: ["loan", "borrower", "lender", "interest", "repayment"] },
  ];

  for (const ts of typeScores) {
    for (const kw of ts.keywords) {
      if (lower.includes(kw)) ts.score++;
    }
  }

  const best = typeScores.sort((a, b) => b.score - a.score)[0];
  return best.score > 0 ? best.type : "Legal Document";
}

// ─── LLM-enhanced block classification (optional) ──────────────────────────

async function classifyBlocksWithLLM(sections) {
  const client = getClient();
  if (!client || sections.length === 0) return null;

  // Only send first 15 sections to avoid token limits
  const toClassify = sections.slice(0, 15).map((s, i) => ({
    index: i,
    title: s.title,
    preview: s.body.slice(0, 200),
  }));

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Classify these legal document sections. For each, return the type and importance.

Sections:
${toClassify.map(s => `[${s.index}] "${s.title}": ${s.preview}`).join("\n\n")}

Return JSON array:
[{"index": 0, "type": "clause|definition|obligation|recital", "importance": "high|standard"}]

Types:
- clause: standard contract clause
- definition: defines terms
- obligation: creates duties/requirements (shall, must)
- recital: background/whereas statements

Importance "high" if it involves obligations, liabilities, penalties, or indemnification.
Return ONLY the JSON array.`,
      }],
    });

    const text = response.content[0]?.text;
    const jsonMatch = text?.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("LLM block classification failed:", err.message);
    return null;
  }
}

// ─── Main Parse Function ───────────────────────────────────────────────────

export async function parseDocument(file) {
  const fileId = `f_${crypto.randomBytes(6).toString("hex")}`;

  // Step 1: Extract text
  const rawText = await extractText(file);
  if (!rawText || rawText.trim().length === 0) {
    throw new Error("Could not extract text from document");
  }

  // Step 2: Split into sections
  const sections = splitIntoSections(rawText);

  // Step 3: Try LLM classification, fall back to rule-based
  const llmClassifications = await classifyBlocksWithLLM(sections);

  // Step 4: Build blocks with classification
  const blocks = sections.map((section, i) => {
    const llmClass = llmClassifications?.find(c => c.index === i);
    const ruleClass = classifyBlock(section.title, section.body);

    const type = llmClass?.type || ruleClass.type;
    const importance = llmClass?.importance || ruleClass.importance;

    return {
      id: `b_${crypto.randomBytes(4).toString("hex")}`,
      type,
      title: section.title.replace(/^\d+[\.\)]\s*/, "").trim() || "Untitled",
      preview: section.body.slice(0, 200).trim() + (section.body.length > 200 ? "…" : ""),
      fullText: section.body,
      importance,
      autoSuggested: false, // Set later by suggestRelevantBlocks
    };
  });

  // Step 5: Extract key terms
  const keyTerms = extractKeyTerms(rawText);

  // Step 6: Detect document type
  const detectedType = detectDocumentTypeFromContent(rawText);

  return {
    fileId,
    fileName: file.originalname,
    blocks,
    keyTerms,
    detectedType,
  };
}

// ─── Block Suggestion ──────────────────────────────────────────────────────

/**
 * Rank and auto-select blocks based on draft intent.
 * Returns { suggestedBlockIds, reasoning }.
 */
export function suggestRelevantBlocks(blocks, context) {
  const { intent = "", documentType = "", selectedClauses = [] } = context;
  const intentLower = (intent + " " + documentType).toLowerCase();
  const clauseLabels = selectedClauses.map(c =>
    (typeof c === "string" ? c : c.label).toLowerCase()
  );

  const scored = blocks.map(block => {
    let score = 0;
    let reason = "";
    const titleLower = block.title.toLowerCase();
    const previewLower = (block.preview || "").toLowerCase();

    // High importance blocks get a boost
    if (block.importance === "high") {
      score += 20;
      reason = "High-importance section (obligations/liabilities)";
    }

    // Match against selected clauses
    for (const clause of clauseLabels) {
      if (titleLower.includes(clause) || clause.includes(titleLower)) {
        score += 30;
        reason = `Matches selected clause: ${clause}`;
        break;
      }
    }

    // Match against intent keywords
    const titleWords = titleLower.split(/\s+/);
    for (const word of titleWords) {
      if (word.length > 3 && intentLower.includes(word)) {
        score += 10;
        if (!reason) reason = `Title keyword "${word}" matches intent`;
      }
    }

    // Clause and obligation types are more useful than recitals/definitions
    if (block.type === "clause") score += 5;
    if (block.type === "obligation") score += 10;

    return { blockId: block.id, score, reason: reason || "General relevance" };
  });

  // Sort by score, select those above threshold
  const threshold = 15;
  const suggested = scored
    .filter(s => s.score >= threshold)
    .sort((a, b) => b.score - a.score);

  const suggestedBlockIds = suggested.map(s => s.blockId);
  const reasoning = {};
  for (const s of suggested) {
    reasoning[s.blockId] = s.reason;
  }

  return { suggestedBlockIds, reasoning };
}
