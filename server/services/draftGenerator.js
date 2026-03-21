// ─── Draft Generation Service ──────────────────────────────────────────────
// Uses Claude API to generate structured legal document sections.
// Falls back to template-based generation if LLM is unavailable.

import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";

let anthropic = null;
function getClient() {
  if (!anthropic && process.env.ANTHROPIC_API_KEY) {
    anthropic = new Anthropic();
  }
  return anthropic;
}

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

  const clauseLabels = selectedClauses.map(c =>
    typeof c === "string" ? c : c.label
  );

  const clauseTemplates = {
    "Confidentiality": `Each Party agrees to keep confidential all information disclosed by the other Party that is designated as confidential or that reasonably should be understood to be confidential ("Confidential Information"). This obligation shall survive the termination of this Agreement for a period of [__] years.`,
    "Indemnity": `Each Party shall indemnify, defend, and hold harmless the other Party from and against any claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to any breach of this Agreement or any negligent or wrongful act or omission of the indemnifying Party.`,
    "Limitation of Liability": `IN NO EVENT SHALL EITHER PARTY BE LIABLE TO THE OTHER PARTY FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, REGARDLESS OF THE CAUSE OF ACTION OR THE THEORY OF LIABILITY, EVEN IF SUCH PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. THE TOTAL LIABILITY OF EITHER PARTY SHALL NOT EXCEED [__].`,
    "Arbitration": `Any dispute, controversy, or claim arising out of or relating to this Agreement shall be resolved by binding arbitration in accordance with the rules of [__]. The arbitration shall be conducted in [__], and the decision of the arbitrator(s) shall be final and binding upon both Parties.`,
    "Governing Law": `This Agreement shall be governed by and construed in accordance with the laws of [${entities.jurisdiction || "__"}], without regard to its conflict of laws provisions.`,
    "Payment Terms": `Payment shall be made in accordance with the following terms: [__]. All payments shall be made in [currency] within [__] days of receipt of a valid invoice. Late payments shall accrue interest at the rate of [__]% per annum.`,
    "Intellectual Property": `All intellectual property rights in any work product created under this Agreement shall vest in [__]. Each Party retains all rights in its pre-existing intellectual property. Neither Party shall use the other's intellectual property except as expressly authorized under this Agreement.`,
    "Force Majeure": `Neither Party shall be liable for any failure or delay in performing its obligations under this Agreement to the extent such failure or delay results from circumstances beyond the reasonable control of that Party, including but not limited to acts of God, natural disasters, war, terrorism, epidemics, government orders, or labor disputes.`,
    "Non-Compete": `During the term of this Agreement and for a period of [__] months following its termination, [Party] shall not directly or indirectly engage in any business that competes with the business of [other Party] within [geographic scope].`,
    "Representations & Warranties": `Each Party represents and warrants that: (a) it has full power and authority to enter into this Agreement; (b) this Agreement constitutes a valid and binding obligation; (c) the execution and performance of this Agreement does not conflict with any other agreement to which it is a party.`,
    "Termination": `This Agreement may be terminated: (a) by mutual written agreement of the Parties; (b) by either Party upon [__] days' written notice; (c) immediately by either Party upon material breach by the other Party that remains uncured after [__] days' notice. Upon termination, all rights and obligations shall cease, except those that by their nature are intended to survive.`,
    "Assignment": `Neither Party may assign this Agreement or any rights or obligations hereunder without the prior written consent of the other Party. Any attempted assignment in violation of this provision shall be void.`,
    "Entire Agreement": `This Agreement constitutes the entire agreement between the Parties with respect to the subject matter hereof and supersedes all prior and contemporaneous agreements, understandings, negotiations, and discussions, whether oral or written.`,
    "Severability": `If any provision of this Agreement is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect.`,
    "Notice": `All notices under this Agreement shall be in writing and shall be deemed given when delivered personally, sent by registered mail, or sent by email to the addresses specified by the Parties.`,
    "Waiver": `The failure of either Party to enforce any provision of this Agreement shall not constitute a waiver of such provision or the right to enforce it at a later time.`,
    "Data Protection": `Each Party shall comply with all applicable data protection laws and regulations in connection with the processing of personal data under this Agreement. The Parties shall enter into a separate data processing agreement where required by applicable law.`,
    "Non-Solicitation": `During the term of this Agreement and for a period of [__] months following its termination, neither Party shall directly or indirectly solicit or attempt to hire any employee, contractor, or agent of the other Party.`,
    "Dispute Resolution": `The Parties shall attempt to resolve any dispute arising under this Agreement through good faith negotiation. If the dispute cannot be resolved within [__] days, either Party may initiate [mediation/arbitration/litigation] in accordance with the provisions of this Agreement.`,
    "Insurance": `[Party] shall maintain at all times during the term of this Agreement insurance coverage of the types and in the amounts specified in Schedule [__], and shall provide certificates of insurance to the other Party upon request.`,
  };

  // Add clause sections
  clauseLabels.forEach((label, i) => {
    const body = clauseTemplates[label] || `[${label} clause content to be drafted based on specific requirements and applicable law.]`;
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
  const client = getClient();
  if (!client) return null;

  const { documentType, template, clauses, rulebooks, referenceBlocks, instructions, entities } = config;
  const selectedClauses = (clauses || [])
    .filter(c => typeof c === "string" ? true : c.selected)
    .map(c => typeof c === "string" ? c : c.label);

  const prompt = `You are a legal document drafting expert. Generate a professional ${documentType} with the following specifications:

Template: ${template || "Standard"}
Selected Clauses: ${selectedClauses.join(", ")}
${rulebooks?.length ? `Applicable Rulebooks: ${rulebooks.join(", ")}` : ""}
${entities?.jurisdiction ? `Jurisdiction: ${entities.jurisdiction}` : ""}
${entities?.industry ? `Industry: ${entities.industry}` : ""}
${entities?.parties?.length ? `Parties:\n${entities.parties.map(p => `- ${p.role}: ${p.description}`).join("\n")}` : ""}
${instructions ? `Additional Instructions: ${instructions}` : ""}
${referenceBlocks?.length ? `Reference Content to Incorporate:\n${referenceBlocks.map(b => `- ${b.title}: ${b.preview || b.fullText || ""}`).join("\n")}` : ""}

Generate the document as a JSON array of sections:
[{"title": "SECTION TITLE", "body": "section content", "clauseSource": "clause name or null"}]

Requirements:
- Use formal legal language
- Include proper recitals and execution sections
- Each selected clause must have its own section
- Fill in reasonable placeholder values where possible
- Mark areas needing user input with [__]
- Return ONLY the JSON array, no markdown or explanation`;

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.text;
    if (!text) return null;

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;

    const sections = JSON.parse(jsonMatch[0]);
    return sections.map((s, i) => ({
      id: `s${i}`,
      title: s.title,
      body: s.body,
      clauseSource: s.clauseSource || null,
      editable: true,
    }));
  } catch (err) {
    console.error("LLM draft generation failed:", err.message);
    return null;
  }
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

  const selectedClauses = (config.clauses || [])
    .filter(c => typeof c === "string" ? true : c.selected);

  return {
    draftId,
    title: config.documentType,
    generatedAt: new Date().toISOString(),
    sections,
    metadata: {
      templateUsed: config.template || "Default",
      clauseCount: selectedClauses.length,
      rulebooksApplied: config.rulebooks || [],
      wordCount: sections.reduce((sum, s) => sum + s.body.split(/\s+/).length, 0),
      llmGenerated,
    },
  };
}
