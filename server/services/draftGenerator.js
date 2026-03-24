// ─── Draft Generation Service ──────────────────────────────────────────────
// Uses Gemini to generate structured legal document sections.
// Falls back to template-based generation if LLM is unavailable.

import { generateJSON } from "./llmClient.js";
import crypto from "crypto";

// ─── Tone descriptions for LLM prompt ────────────────────────────────────

const TONE_DESCRIPTIONS = {
  "Neutral legal": "Use standard legal language that is balanced, professional, and impartial. Avoid advocacy or persuasion.",
  "Concise": "Keep language tight and minimal. Use short sentences, avoid redundancy, and eliminate unnecessary legal boilerplate where possible.",
  "Detailed / Explanatory": "Provide thorough explanations for each provision. Include context, reasoning, and detailed definitions. Err on the side of completeness.",
  "Diplomatic": "Use polite, cooperative language that emphasises mutual benefit. Soften obligations with phrases like 'the Parties agree' rather than 'Party shall'.",
  "Firm": "Use assertive, unambiguous language. Emphasise obligations, consequences, and enforcement. Leave no room for interpretation.",
  "Formal / court-style": "Use traditional, highly formal legal prose suitable for court filings or judicial proceedings. Include formal recitals, whereases, and witnesseth clauses.",
  "Layman-Friendly Legal": "Write in plain English that a non-lawyer can understand while maintaining legal enforceability. Define technical terms inline and use simple sentence structures.",
  "Objective / Impersonal": "Use third-person, passive constructions throughout. Avoid any language that could imply bias toward either party. Maintain strict neutrality.",
};

// ─── Template-based fallback sections ──────────────────────────────────────

function buildFallbackSections(config) {
  const { documentType, clauses = [], entities = {} } = config;
  const parties = entities.parties || [
    { role: "Party A", description: "First Party" },
    { role: "Party B", description: "Second Party" },
  ];

  const sections = [
    {
      id: "s0",
      title: "PARTIES",
      body: `This ${documentType} ("Agreement") is entered into by and between:\n\n` +
        parties.map((p, i) => `${i + 1}. ${p.description} (hereinafter referred to as "${p.role}")`).join("\n\n") +
        `\n\n(each a "Party" and collectively the "Parties").`,
      clauseSource: null,
      editable: true,
    },
    {
      id: "s1",
      title: "RECITALS",
      body: `WHEREAS, the Parties desire to enter into this ${documentType} to establish the terms and conditions governing their relationship;\n\n` +
        `WHEREAS, each Party has the legal capacity and authority to enter into this Agreement;\n\n` +
        `NOW, THEREFORE, in consideration of the mutual covenants and agreements set forth herein, the Parties agree as follows:`,
      clauseSource: null,
      editable: true,
    },
  ];

  const selectedClauses = (clauses || []).filter(c =>
    typeof c === "string" ? true : c.selected
  );

  // Clause boilerplate keyed by ID (primary) with label fallback
  // Now uses labelled [VARIABLE_NAME] placeholders instead of [__]
  const jurisdiction = entities.jurisdiction || null;
  const clauseTemplatesById = {
    "c1":  `Each Party agrees to keep confidential all information disclosed by the other Party that is designated as confidential or that reasonably should be understood to be confidential ("Confidential Information"). This obligation shall survive the termination of this Agreement for a period of [CONFIDENTIALITY_PERIOD_YEARS] years.`,
    "c2":  `Each Party shall indemnify, defend, and hold harmless the other Party from and against any claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to any breach of this Agreement or any negligent or wrongful act or omission of the indemnifying Party.`,
    "c3":  `IN NO EVENT SHALL EITHER PARTY BE LIABLE TO THE OTHER PARTY FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, REGARDLESS OF THE CAUSE OF ACTION OR THE THEORY OF LIABILITY, EVEN IF SUCH PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. THE TOTAL LIABILITY OF EITHER PARTY SHALL NOT EXCEED [LIABILITY_CAP].`,
    "c4":  `Any dispute, controversy, or claim arising out of or relating to this Agreement shall be resolved by binding arbitration in accordance with the rules of [ARBITRATION_BODY]. The arbitration shall be conducted in [ARBITRATION_VENUE], and the decision of the arbitrator(s) shall be final and binding upon both Parties.`,
    "c5":  `This Agreement shall be governed by and construed in accordance with the laws of [GOVERNING_JURISDICTION], without regard to its conflict of laws provisions.`,
    "c6":  `Payment shall be made in accordance with the following terms: [PAYMENT_TERMS]. All payments shall be made in [PAYMENT_CURRENCY] within [PAYMENT_PERIOD_DAYS] days of receipt of a valid invoice. Late payments shall accrue interest at the rate of [LATE_INTEREST_RATE]% per annum.`,
    "c7":  `All intellectual property rights in any work product created under this Agreement shall vest in [IP_OWNER]. Each Party retains all rights in its pre-existing intellectual property. Neither Party shall use the other's intellectual property except as expressly authorized under this Agreement.`,
    "c8":  `Neither Party shall be liable for any failure or delay in performing its obligations under this Agreement to the extent such failure or delay results from circumstances beyond the reasonable control of that Party, including but not limited to acts of God, natural disasters, war, terrorism, epidemics, government orders, or labor disputes.`,
    "c9":  `During the term of this Agreement and for a period of [NON_COMPETE_PERIOD_MONTHS] months following its termination, [RESTRICTED_PARTY] shall not directly or indirectly engage in any business that competes with the business of [OTHER_PARTY] within [NON_COMPETE_GEOGRAPHIC_SCOPE].`,
    "c10": `Each Party represents and warrants that: (a) it has full power and authority to enter into this Agreement; (b) this Agreement constitutes a valid and binding obligation; (c) the execution and performance of this Agreement does not conflict with any other agreement to which it is a party.`,
    "c11": `This Agreement may be terminated: (a) by mutual written agreement of the Parties; (b) by either Party upon [NOTICE_PERIOD_DAYS] days' written notice; (c) immediately by either Party upon material breach by the other Party that remains uncured after [CURE_PERIOD_DAYS] days' notice. Upon termination, all rights and obligations shall cease, except those that by their nature are intended to survive.`,
    "c12": `Neither Party may assign this Agreement or any rights or obligations hereunder without the prior written consent of the other Party. Any attempted assignment in violation of this provision shall be void.`,
    "c13": `This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements, understandings, negotiations, and discussions, whether oral or written.`,
    "c14": `If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.`,
    "c15": `All notices under this Agreement shall be in writing and shall be deemed given when delivered personally, sent by registered mail, or sent by email to the addresses specified by the Parties.`,
    "c16": `The failure of either Party to enforce any provision of this Agreement shall not constitute a waiver of such provision or the right to enforce it at a later time.`,
    "c17": `Each Party shall comply with all applicable data protection laws and regulations in connection with the processing of personal data under this Agreement. The Parties shall enter into a separate data processing agreement where required by applicable law.`,
    "c18": `During the term of this Agreement and for a period of [NON_SOLICITATION_PERIOD_MONTHS] months following its termination, neither Party shall directly or indirectly solicit or attempt to hire any employee, contractor, or agent of the other Party.`,
    "c19": `The Parties shall attempt to resolve any dispute arising under this Agreement through good faith negotiation. If the dispute cannot be resolved within [NEGOTIATION_PERIOD_DAYS] days, either Party may initiate [DISPUTE_RESOLUTION_METHOD] in accordance with the provisions of this Agreement.`,
    "c20": `[INSURED_PARTY] shall maintain at all times during the term of this Agreement insurance coverage of the types and in the amounts specified in Schedule [INSURANCE_SCHEDULE], and shall provide certificates of insurance to the other Party upon request.`,
    "c21": `The scope of services under this Agreement shall include: [SCOPE_OF_SERVICES]. The service provider shall perform the services in a professional and workmanlike manner, in accordance with industry standards. Any changes to the scope of work shall be documented in a written amendment signed by both Parties.`,
    "c22": `Each Party shall comply with all applicable federal, state, and local laws, regulations, and ordinances in the performance of its obligations under this Agreement. Each Party shall obtain and maintain all necessary licenses, permits, and certifications required for the performance of its obligations hereunder.`,
    "c23": `Each Party shall have the right, at its own expense and upon reasonable prior written notice, to audit and inspect the other Party's books, records, and accounts relating to the performance of this Agreement. Such audits shall be conducted during normal business hours and no more than [AUDIT_FREQUENCY] time(s) per year.`,
    "c24": `This Agreement may only be amended, modified, or supplemented by a written instrument duly executed by authorized representatives of both Parties. No oral modification or waiver of any provision of this Agreement shall be effective.`,
    "c25": `The provisions of Sections [SURVIVAL_SECTIONS] (including but not limited to Confidentiality, Intellectual Property, Limitation of Liability, and Indemnification) shall survive the expiration or termination of this Agreement for any reason.`,
    "c26": `Neither Party shall subcontract, delegate, or assign any of its obligations under this Agreement to any third party without the prior written consent of the other Party. Any unauthorized subcontracting shall be void and of no effect. The subcontracting Party shall remain fully responsible for the performance of any subcontractor.`,
    "c27": `Each Party represents, warrants, and undertakes that it shall comply with all applicable anti-bribery and anti-corruption laws, including but not limited to the Foreign Corrupt Practices Act (FCPA) and the UK Bribery Act 2010. Neither Party shall offer, promise, give, or authorize any bribe, kickback, or other corrupt payment to any person in connection with this Agreement.`,
  };

  // Fill jurisdiction if available
  if (jurisdiction) {
    clauseTemplatesById["c5"] = clauseTemplatesById["c5"].replace("[GOVERNING_JURISDICTION]", jurisdiction);
  }

  // Add clause sections — lookup by ID first, then label fallback
  selectedClauses.forEach((clause, i) => {
    const id = typeof clause === "string" ? null : clause.id;
    const label = typeof clause === "string" ? clause : clause.label;
    const body = (id && clauseTemplatesById[id]) || `[${label} clause content to be drafted based on specific requirements and applicable law.]`;
    sections.push({
      id: `s${i + 2}`,
      title: label.toUpperCase(),
      body,
      clauseSource: label,
      editable: true,
    });
  });

  // Closing section
  sections.push({
    id: `s${sections.length}`,
    title: "EXECUTION",
    body: `IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date last written below.\n\n` +
      parties.map(p => `${p.description}\n\nBy: ________________________\nName: ________________________\nTitle: ________________________\nDate: ________________________`).join("\n\n"),
    clauseSource: null,
    editable: true,
  });

  return sections;
}

// ─── LLM-based draft generation ────────────────────────────────────────────

async function generateWithLLM(config) {
  const { documentType, template, clauses, rulebooks, referenceContext, instructions, entities, tone } = config;
  const selectedClauses = (clauses || [])
    .filter(c => typeof c === "string" ? true : c.selected)
    .map(c => typeof c === "string" ? c : c.label);

  const toneInstruction = tone && TONE_DESCRIPTIONS[tone]
    ? `\nTone: Write this document in a "${tone}" style. ${TONE_DESCRIPTIONS[tone]}`
    : "";

  const prompt = `You are a legal document drafting expert. Generate a professional ${documentType} with the following specifications:

Template: ${template || "Standard"}
Selected Clauses: ${selectedClauses.join(", ")}
${rulebooks?.length ? `Applicable Rulebooks: ${rulebooks.join(", ")}` : ""}
${entities?.jurisdiction ? `Jurisdiction: ${entities.jurisdiction}` : ""}
${entities?.industry ? `Industry: ${entities.industry}` : ""}
${entities?.parties?.length ? `Parties:\n${entities.parties.map(p => `- ${p.role}: ${p.description}`).join("\n")}` : ""}
${instructions ? `Additional Instructions: ${instructions}` : ""}${toneInstruction}
${referenceContext ? `\n${referenceContext}` : ""}

Generate the document as a JSON array of sections:
[{"title": "SECTION TITLE", "body": "section content", "clauseSource": "clause name or null"}]

Requirements:
- Use formal legal language
- Include proper recitals and execution sections
- Each selected clause must have its own section
- For any value that needs user input (dates, amounts, names, periods, jurisdictions, etc.), use labelled placeholders in the format [VARIABLE_NAME] — e.g. [GOVERNING_JURISDICTION], [LIABILITY_CAP], [NOTICE_PERIOD_DAYS], [PARTY_A_ADDRESS], [EFFECTIVE_DATE]. Use SCREAMING_SNAKE_CASE for variable names. Make the names descriptive and unique.
- Do NOT use bare [__] placeholders — every placeholder must have a descriptive label.
- Return ONLY the JSON array, no markdown or explanation`;

  const sections = await generateJSON(prompt, { maxTokens: 4096, jsonType: "array" });
  if (!Array.isArray(sections)) return null;

  return sections.map((s, i) => ({
    id: `s${i}`,
    title: s.title,
    body: s.body,
    clauseSource: s.clauseSource || null,
    editable: true,
  }));
}

// ─── Variable Extraction ──────────────────────────────────────────────────

function inferVariableType(key) {
  const k = key.toUpperCase();
  if (/DAYS?$|PERIOD_DAYS/.test(k)) return { type: "number", unit: "days" };
  if (/YEARS?$|PERIOD_YEARS/.test(k)) return { type: "number", unit: "years" };
  if (/MONTHS?$|PERIOD_MONTHS/.test(k)) return { type: "number", unit: "months" };
  if (/DATE/.test(k)) return { type: "date", unit: null };
  if (/CAP|VALUE|AMOUNT|FEE|PRICE|COST|RATE/.test(k)) return { type: "currency", unit: null };
  if (/FREQUENCY|COUNT|NUMBER|LIMIT/.test(k)) return { type: "number", unit: null };
  return { type: "text", unit: null };
}

function keyToLabel(key) {
  return key
    .split("_")
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function extractVariables(sections) {
  const variablePattern = /\[([A-Z][A-Z0-9_]+)\]/g;
  const occurrenceMap = {};

  for (const section of sections) {
    const matches = section.body.matchAll(variablePattern);
    for (const match of matches) {
      const key = match[1];
      if (!occurrenceMap[key]) occurrenceMap[key] = 0;
      occurrenceMap[key]++;
    }
  }

  const variables = Object.entries(occurrenceMap).map(([key, count], i) => {
    const { type, unit } = inferVariableType(key);
    return {
      id: `v${i + 1}`,
      key,
      label: keyToLabel(key),
      type,
      unit,
      occurrences: count,
    };
  });

  return variables;
}

// ─── Main Generation Function ──────────────────────────────────────────────

export async function generateDraftContent(config) {
  const draftId = `d_${crypto.randomBytes(6).toString("hex")}`;

  // Try LLM generation first, fall back to template-based
  let sections = await generateWithLLM(config);
  const llmGenerated = sections !== null;

  if (!sections) {
    sections = buildFallbackSections(config);
  }

  // Extract variables from generated sections
  const variables = extractVariables(sections);

  const selectedClauses = (config.clauses || [])
    .filter(c => typeof c === "string" ? true : c.selected);

  return {
    draftId,
    title: config.documentType,
    generatedAt: new Date().toISOString(),
    sections,
    variables,
    metadata: {
      templateUsed: config.template || "Default",
      clauseCount: selectedClauses.length,
      rulebooksApplied: config.rulebooks || [],
      wordCount: sections.reduce((sum, s) => sum + s.body.split(/\s+/).length, 0),
      llmGenerated,
    },
  };
}
