// ─── Template Registry ─────────────────────────────────────────────────────
// Pure rule-based matching and scoring. No LLM dependency.
// Templates, clauses, and rulebooks are cross-referenced for holistic scoring.

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Word-boundary keyword match (prevents "lease" matching "release") */
function kwMatch(text, keyword) {
  if (keyword.includes(" ")) {
    // Multi-word: exact phrase with boundaries
    return text.includes(keyword);
  }
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

// ─── Document Type Taxonomy (20 types) ───────────────────────────────────────

export const DOCUMENT_TYPES = [
  { id: "vendor-agreement",      label: "Vendor Agreement",                  keywords: ["vendor", "supplier", "service provider", "outsource", "procurement"] },
  { id: "nda",                   label: "Non-Disclosure Agreement",          keywords: ["nda", "non-disclosure", "confidential", "secrecy", "proprietary"] },
  { id: "employment-agreement",  label: "Employment Agreement",              keywords: ["employment", "employee", "hire", "hiring", "job", "offer letter", "compensation", "salary"] },
  { id: "shareholder-agreement", label: "Shareholder Agreement",             keywords: ["shareholder", "stockholder", "equity", "shares", "dividend", "voting rights"] },
  { id: "lease-agreement",       label: "Lease Agreement",                   keywords: ["lease", "rent", "tenant", "landlord", "premises", "occupancy"] },
  { id: "consulting-agreement",  label: "Consulting Agreement",              keywords: ["consultant", "consulting", "advisory", "advisor"] },
  { id: "software-license",      label: "Software License Agreement",        keywords: ["software", "license", "saas", "subscription", "end user", "eula"] },
  { id: "partnership-agreement", label: "Partnership Agreement",             keywords: ["partnership", "partner", "joint venture", "co-founder"] },
  { id: "loan-agreement",        label: "Loan Agreement",                    keywords: ["loan", "lending", "borrower", "lender", "interest rate", "repayment", "mortgage"] },
  { id: "franchise-agreement",   label: "Franchise Agreement",               keywords: ["franchise", "franchisee", "franchisor", "territory", "royalty"] },
  { id: "distribution-agreement",label: "Distribution Agreement",            keywords: ["distribution", "distributor", "reseller", "channel", "wholesale"] },
  { id: "merger-acquisition",    label: "Merger & Acquisition Agreement",    keywords: ["merger", "acquisition", "m&a", "buyout", "takeover", "due diligence"] },
  { id: "power-of-attorney",     label: "Power of Attorney",                 keywords: ["power of attorney", "poa", "authorize", "representative", "proxy"] },
  { id: "terms-of-service",      label: "Terms of Service",                  keywords: ["terms of service", "tos", "terms and conditions", "user agreement", "acceptable use"] },
  { id: "privacy-policy",        label: "Privacy Policy",                    keywords: ["privacy", "data protection", "personal data", "gdpr", "cookies", "consent"] },
  // ─── 7 new document types ───
  { id: "purchase-order",        label: "Purchase Order",                    keywords: ["purchase order", "purchase", "order", "invoice", "procurement order"] },
  { id: "mutual-nda",            label: "Mutual Confidentiality Agreement",  keywords: ["mutual nda", "mutual confidentiality", "bilateral nda", "two-way nda"] },
  { id: "contractor-agreement",  label: "Independent Contractor Agreement",  keywords: ["contractor", "independent contractor", "freelancer", "1099", "freelance"] },
  { id: "msa",                   label: "Master Service Agreement",          keywords: ["master service", "msa", "framework agreement", "umbrella agreement"] },
  { id: "affiliate-agreement",   label: "Affiliate/Referral Agreement",      keywords: ["affiliate", "referral", "commission", "partner program", "referral fee"] },
  { id: "licensing-agreement",   label: "General Licensing Agreement",       keywords: ["licensor", "licensee", "patent", "trademark", "royalty license", "ip license"] },
  { id: "bill-of-sale",          label: "Bill of Sale / Asset Purchase",     keywords: ["bill of sale", "asset purchase", "transfer of ownership", "sale deed"] },
];

// ─── Templates with clause bindings ──────────────────────────────────────────

export const TEMPLATES = [
  { id: "t1",  name: "Vendor Service Agreement",         docTypes: ["vendor-agreement"],       keywords: ["vendor", "service", "deliverable", "sow"],
    requiredClauses: ["c1","c2","c5","c6","c11"],       optionalClauses: ["c3","c7","c8","c10","c12","c15","c20"] },
  { id: "t2",  name: "Non-Disclosure Agreement",         docTypes: ["nda"],                    keywords: ["confidential", "disclosure", "proprietary"],
    requiredClauses: ["c1","c5","c11"],                  optionalClauses: ["c13","c18"] },
  { id: "t3",  name: "Employment Agreement",              docTypes: ["employment-agreement"],   keywords: ["employment", "compensation", "benefits", "termination"],
    requiredClauses: ["c1","c5","c7","c9","c11","c17"],  optionalClauses: ["c18","c13","c14","c16"] },
  { id: "t4",  name: "Shareholder Agreement",             docTypes: ["shareholder-agreement"],  keywords: ["shares", "voting", "board", "dividend"],
    requiredClauses: ["c5","c10","c11","c19"],           optionalClauses: ["c4","c1","c13","c15"] },
  { id: "t5",  name: "Lease Agreement",                   docTypes: ["lease-agreement"],        keywords: ["lease", "rent", "premises", "maintenance"],
    requiredClauses: ["c5","c6","c11"],                  optionalClauses: ["c2","c4","c8","c12","c15","c20"] },
  { id: "t6",  name: "Consulting Agreement",              docTypes: ["consulting-agreement"],   keywords: ["consulting", "scope", "deliverable", "hourly"],
    requiredClauses: ["c1","c5","c6","c7","c11"],        optionalClauses: ["c2","c3","c9","c18","c20"] },
  { id: "t7",  name: "Software License Agreement",        docTypes: ["software-license"],       keywords: ["license", "software", "subscription", "support"],
    requiredClauses: ["c3","c5","c7","c11","c17"],       optionalClauses: ["c1","c2","c12","c14"] },
  { id: "t8",  name: "Partnership Agreement",             docTypes: ["partnership-agreement"],  keywords: ["partnership", "profit", "contribution", "management"],
    requiredClauses: ["c5","c9","c11","c19"],            optionalClauses: ["c1","c8","c13","c15"] },
  { id: "t9",  name: "Loan Agreement",                    docTypes: ["loan-agreement"],         keywords: ["loan", "interest", "repayment", "collateral"],
    requiredClauses: ["c5","c6","c10","c11"],            optionalClauses: ["c4","c15","c19"] },
  { id: "t10", name: "Franchise Agreement",                docTypes: ["franchise-agreement"],    keywords: ["franchise", "territory", "royalty", "training"],
    requiredClauses: ["c1","c2","c5","c6","c9","c11"],   optionalClauses: ["c4","c7","c10","c20"] },
  { id: "t11", name: "Distribution Agreement",            docTypes: ["distribution-agreement"], keywords: ["distribution", "territory", "pricing", "inventory"],
    requiredClauses: ["c1","c2","c5","c6","c11"],        optionalClauses: ["c3","c4","c8","c12"] },
  { id: "t12", name: "Terms of Service",                  docTypes: ["terms-of-service"],       keywords: ["terms", "user", "account", "liability"],
    requiredClauses: ["c3","c5","c11","c17"],            optionalClauses: ["c14","c19"] },
  { id: "t13", name: "Privacy Policy",                    docTypes: ["privacy-policy"],         keywords: ["privacy", "data", "collection", "consent"],
    requiredClauses: ["c17","c5"],                       optionalClauses: ["c14"] },
  // ─── 7 new templates ───
  { id: "t14", name: "Purchase Order",                    docTypes: ["purchase-order"],          keywords: ["purchase", "order", "invoice", "delivery"],
    requiredClauses: ["c5","c6"],                        optionalClauses: ["c3","c10","c11"] },
  { id: "t15", name: "Mutual Confidentiality Agreement",  docTypes: ["mutual-nda"],             keywords: ["mutual", "bilateral", "two-way", "confidential"],
    requiredClauses: ["c1","c5","c11"],                  optionalClauses: ["c13","c18"] },
  { id: "t16", name: "Independent Contractor Agreement",  docTypes: ["contractor-agreement"],   keywords: ["contractor", "freelance", "independent", "scope"],
    requiredClauses: ["c1","c5","c6","c7","c11"],        optionalClauses: ["c2","c9","c18"] },
  { id: "t17", name: "Master Service Agreement",          docTypes: ["msa"],                    keywords: ["master", "framework", "umbrella", "ongoing"],
    requiredClauses: ["c1","c3","c5","c6","c7","c11"],   optionalClauses: ["c2","c8","c12","c17","c19"] },
  { id: "t18", name: "Affiliate/Referral Agreement",      docTypes: ["affiliate-agreement"],    keywords: ["affiliate", "referral", "commission", "program"],
    requiredClauses: ["c5","c6","c7","c11"],             optionalClauses: ["c1","c9","c10"] },
  { id: "t19", name: "General Licensing Agreement",       docTypes: ["licensing-agreement"],    keywords: ["licensor", "licensee", "patent", "trademark"],
    requiredClauses: ["c5","c6","c7","c11"],             optionalClauses: ["c1","c2","c3","c19"] },
  { id: "t20", name: "Bill of Sale / Asset Purchase",     docTypes: ["bill-of-sale"],           keywords: ["sale", "asset", "transfer", "ownership"],
    requiredClauses: ["c5","c10"],                       optionalClauses: ["c2","c11","c13"] },
];

// ─── Clauses with relevance mapping ──────────────────────────────────────────

export const CLAUSES = [
  { id: "c1",  label: "Confidentiality",              weight: 95,
    applicableTo: ["vendor-agreement", "nda", "mutual-nda", "employment-agreement", "consulting-agreement", "contractor-agreement", "software-license", "partnership-agreement", "franchise-agreement", "distribution-agreement", "merger-acquisition", "msa", "licensing-agreement"] },
  { id: "c2",  label: "Indemnity",                    weight: 90,
    applicableTo: ["vendor-agreement", "consulting-agreement", "contractor-agreement", "software-license", "lease-agreement", "distribution-agreement", "franchise-agreement", "msa", "licensing-agreement"] },
  { id: "c3",  label: "Limitation of Liability",      weight: 88,
    applicableTo: ["vendor-agreement", "software-license", "consulting-agreement", "contractor-agreement", "terms-of-service", "distribution-agreement", "msa", "licensing-agreement"] },
  { id: "c4",  label: "Arbitration",                  weight: 82,
    applicableTo: ["vendor-agreement", "shareholder-agreement", "partnership-agreement", "franchise-agreement", "distribution-agreement", "lease-agreement"] },
  { id: "c5",  label: "Governing Law",                weight: 85,
    applicableTo: ["vendor-agreement", "nda", "mutual-nda", "employment-agreement", "consulting-agreement", "contractor-agreement", "software-license", "shareholder-agreement", "partnership-agreement", "lease-agreement", "loan-agreement", "franchise-agreement", "distribution-agreement", "msa", "affiliate-agreement", "licensing-agreement", "purchase-order", "bill-of-sale", "terms-of-service", "privacy-policy"] },
  { id: "c6",  label: "Payment Terms",                weight: 92,
    applicableTo: ["vendor-agreement", "consulting-agreement", "contractor-agreement", "lease-agreement", "loan-agreement", "franchise-agreement", "distribution-agreement", "msa", "affiliate-agreement", "licensing-agreement", "purchase-order"] },
  { id: "c7",  label: "Intellectual Property",        weight: 87,
    applicableTo: ["vendor-agreement", "employment-agreement", "consulting-agreement", "contractor-agreement", "software-license", "partnership-agreement", "franchise-agreement", "msa", "affiliate-agreement", "licensing-agreement"] },
  { id: "c8",  label: "Force Majeure",                weight: 75,
    applicableTo: ["vendor-agreement", "lease-agreement", "distribution-agreement", "franchise-agreement", "consulting-agreement", "contractor-agreement", "msa"] },
  { id: "c9",  label: "Non-Compete",                  weight: 80,
    applicableTo: ["employment-agreement", "partnership-agreement", "franchise-agreement", "consulting-agreement", "contractor-agreement", "merger-acquisition", "affiliate-agreement"] },
  { id: "c10", label: "Representations & Warranties", weight: 86,
    applicableTo: ["vendor-agreement", "shareholder-agreement", "merger-acquisition", "loan-agreement", "franchise-agreement", "bill-of-sale", "purchase-order", "licensing-agreement"] },
  { id: "c11", label: "Termination",                  weight: 93,
    applicableTo: ["vendor-agreement", "nda", "mutual-nda", "employment-agreement", "consulting-agreement", "contractor-agreement", "software-license", "lease-agreement", "partnership-agreement", "franchise-agreement", "distribution-agreement", "msa", "affiliate-agreement", "licensing-agreement"] },
  { id: "c12", label: "Assignment",                   weight: 70,
    applicableTo: ["vendor-agreement", "lease-agreement", "software-license", "distribution-agreement", "msa"] },
  { id: "c13", label: "Entire Agreement",             weight: 65,
    applicableTo: ["vendor-agreement", "nda", "mutual-nda", "employment-agreement", "consulting-agreement", "contractor-agreement", "software-license", "shareholder-agreement", "partnership-agreement", "bill-of-sale"] },
  { id: "c14", label: "Severability",                 weight: 60,
    applicableTo: ["vendor-agreement", "employment-agreement", "software-license", "terms-of-service", "privacy-policy"] },
  { id: "c15", label: "Notice",                       weight: 68,
    applicableTo: ["vendor-agreement", "lease-agreement", "shareholder-agreement", "partnership-agreement", "loan-agreement", "msa"] },
  { id: "c16", label: "Waiver",                       weight: 55,
    applicableTo: ["vendor-agreement", "employment-agreement", "software-license"] },
  { id: "c17", label: "Data Protection",              weight: 89,
    applicableTo: ["software-license", "employment-agreement", "vendor-agreement", "terms-of-service", "privacy-policy", "msa", "contractor-agreement"] },
  { id: "c18", label: "Non-Solicitation",             weight: 78,
    applicableTo: ["employment-agreement", "consulting-agreement", "contractor-agreement", "nda", "mutual-nda", "merger-acquisition"] },
  { id: "c19", label: "Dispute Resolution",           weight: 84,
    applicableTo: ["shareholder-agreement", "partnership-agreement", "franchise-agreement", "loan-agreement", "merger-acquisition", "msa", "licensing-agreement"] },
  { id: "c20", label: "Insurance",                    weight: 72,
    applicableTo: ["vendor-agreement", "consulting-agreement", "contractor-agreement", "lease-agreement", "franchise-agreement"] },
];

// ─── Clause Relationships ────────────────────────────────────────────────────

export const CLAUSE_RELATIONSHIPS = [
  { type: "conflict", clauses: ["c4", "c19"], reason: "Arbitration and Dispute Resolution overlap — pick one" },
  { type: "synergy",  clauses: ["c9", "c18"], reason: "Non-Compete and Non-Solicitation are typically paired" },
  { type: "synergy",  clauses: ["c2", "c3"],  reason: "Indemnity and Limitation of Liability often appear together" },
  { type: "synergy",  clauses: ["c1", "c17"], reason: "Confidentiality and Data Protection reinforce each other" },
  { type: "implies",  clauses: ["c17", "c1"], reason: "Data Protection typically requires Confidentiality" },
];

// ─── Rulebooks with jurisdiction/industry mapping + clause mandates ──────────

export const RULEBOOKS = [
  { id: "r1", name: "Corporate Contract Policy",       jurisdictions: ["*"],     industries: ["*"],          docTypes: ["vendor-agreement", "consulting-agreement", "contractor-agreement", "distribution-agreement", "msa"],  mandatoryClauses: [] },
  { id: "r2", name: "Standard Legal Guidelines",       jurisdictions: ["*"],     industries: ["*"],          docTypes: ["*"],  mandatoryClauses: [] },
  { id: "r3", name: "GDPR Compliance Rules",           jurisdictions: ["eu", "uk", "germany", "france"],  industries: ["*"],  docTypes: ["privacy-policy", "terms-of-service", "software-license", "employment-agreement", "msa"],  mandatoryClauses: ["c17"] },
  { id: "r4", name: "Arbitration-First Policy",        jurisdictions: ["*"],     industries: ["*"],          docTypes: ["vendor-agreement", "shareholder-agreement", "partnership-agreement", "franchise-agreement"],  mandatoryClauses: ["c4"] },
  { id: "r5", name: "Indian Contract Act Compliance",  jurisdictions: ["india"], industries: ["*"],          docTypes: ["*"],  mandatoryClauses: [] },
  { id: "r6", name: "ISO Legal Standards",             jurisdictions: ["*"],     industries: ["technology", "manufacturing", "healthcare"], docTypes: ["vendor-agreement", "software-license", "msa"],  mandatoryClauses: [] },
  { id: "r7", name: "US Employment Law Compliance",    jurisdictions: ["us", "usa", "united states"],  industries: ["*"],  docTypes: ["employment-agreement", "contractor-agreement"],  mandatoryClauses: ["c9", "c18"] },
  { id: "r8", name: "HIPAA Compliance Rules",          jurisdictions: ["us", "usa"],                   industries: ["healthcare", "health", "medical"], docTypes: ["vendor-agreement", "software-license", "privacy-policy", "msa"],  mandatoryClauses: ["c1", "c17"] },
];

// ─── Jurisdiction keywords ─────────────────────────────────────────────────

const JURISDICTION_KEYWORDS = {
  india:     ["india", "indian", "delhi", "mumbai", "bangalore", "bengaluru", "chennai", "kolkata", "hyderabad", "pune", "indian contract act"],
  us:        ["usa", "united states", "america", "american", "california", "new york", "texas", "delaware", "florida"],
  uk:        ["united kingdom", "england", "british", "london", "scotland", "wales"],
  eu:        ["european union", "europe", "gdpr"],
  germany:   ["germany", "german", "berlin", "munich"],
  france:    ["france", "french", "paris"],
  singapore: ["singapore"],
  australia: ["australia", "australian", "sydney", "melbourne"],
  canada:    ["canada", "canadian", "toronto", "vancouver"],
};

// Short keywords that need word-boundary matching (handled separately)
const JURISDICTION_SHORT = { us: ["us"], uk: ["uk"], eu: ["eu"] };

// ─── Industry keywords ─────────────────────────────────────────────────────

const INDUSTRY_KEYWORDS = {
  technology:     ["tech", "technology", "software", "saas", "ai", "app", "platform", "digital", "cloud", "api", "startup"],
  healthcare:     ["health", "healthcare", "medical", "hospital", "pharma", "pharmaceutical", "clinic", "patient", "biotech"],
  finance:        ["finance", "financial", "banking", "bank", "investment", "fintech", "insurance", "fund", "trading"],
  manufacturing:  ["manufacturing", "factory", "production", "industrial", "assembly", "supply chain"],
  realestate:     ["real estate", "property", "construction", "building", "housing", "commercial space"],
  education:      ["education", "university", "school", "academic", "training", "edtech"],
  media:          ["media", "entertainment", "advertising", "marketing", "content", "publishing", "agency"],
  retail:         ["retail", "ecommerce", "e-commerce", "consumer", "store", "marketplace"],
  legal:          ["legal", "law firm", "attorney", "litigation"],
};

// ─── Scoring Functions ─────────────────────────────────────────────────────

/**
 * Detect document type from intent text using keyword scoring with word boundaries.
 * Returns sorted array of { id, label, score }.
 */
export function detectDocumentType(intentText) {
  const lower = intentText.toLowerCase();
  const scores = DOCUMENT_TYPES.map(dt => {
    let score = 0;
    for (const kw of dt.keywords) {
      if (kwMatch(lower, kw)) {
        score += kw.includes(" ") ? 15 : 10;
      }
    }
    return { id: dt.id, label: dt.label, score };
  });
  return scores.filter(s => s.score > 0).sort((a, b) => b.score - a.score);
}

/**
 * Extract jurisdiction from intent text.
 */
export function detectJurisdiction(intentText) {
  const lower = intentText.toLowerCase();
  // Check multi-word/long keywords first (safe with .includes)
  for (const [key, keywords] of Object.entries(JURISDICTION_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return key;
    }
  }
  // Check short keywords with word boundaries
  for (const [key, keywords] of Object.entries(JURISDICTION_SHORT)) {
    for (const kw of keywords) {
      if (kwMatch(lower, kw)) return key;
    }
  }
  return null;
}

/**
 * Extract industry from intent text.
 */
export function detectIndustry(intentText) {
  const lower = intentText.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const [key, keywords] of Object.entries(INDUSTRY_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (kwMatch(lower, kw)) score += kw.includes(" ") ? 2 : 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  }
  return best;
}

/**
 * Match templates to a document type. Returns sorted array of { id, name, matchScore }.
 */
export function matchTemplates(documentTypeId, intentText) {
  const lower = intentText.toLowerCase();
  return TEMPLATES.map(t => {
    let score = 0;
    if (t.docTypes.includes(documentTypeId)) score += 60;
    for (const kw of t.keywords) {
      if (kwMatch(lower, kw)) score += 10;
    }
    return { id: t.id, name: t.name, matchScore: Math.min(score, 100) };
  })
    .filter(t => t.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Recommend clauses for a document type. Returns array of { id, label, relevanceScore, selected }.
 */
export function recommendClauses(documentTypeId) {
  return CLAUSES.map(c => {
    const isApplicable = c.applicableTo.includes(documentTypeId);
    const relevanceScore = isApplicable ? c.weight : Math.floor(c.weight * 0.3);
    return {
      id: c.id,
      label: c.label,
      relevanceScore,
      selected: isApplicable && c.weight >= 80,
    };
  })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Map rulebooks based on jurisdiction, industry, and document type.
 * Returns array of { id, name, matchScore, mandatoryClauses }.
 */
export function mapRulebooks(documentTypeId, jurisdiction, industry) {
  return RULEBOOKS.map(r => {
    let score = 0;
    if (r.docTypes.includes("*") || r.docTypes.includes(documentTypeId)) score += 30;
    if (r.jurisdictions.includes("*")) score += 10;
    else if (jurisdiction && r.jurisdictions.includes(jurisdiction)) score += 40;
    if (r.industries.includes("*")) score += 5;
    else if (industry && r.industries.includes(industry)) score += 30;
    return { id: r.id, name: r.name, matchScore: Math.min(score, 100), mandatoryClauses: r.mandatoryClauses || [] };
  })
    .filter(r => r.matchScore >= 30)
    .sort((a, b) => b.matchScore - a.matchScore);
}

// ─── Holistic Re-scoring ─────────────────────────────────────────────────────

/**
 * Cross-reference clauses with matched template and rulebooks.
 * Applies template bindings, rulebook mandates, and clause relationships.
 * Returns re-scored clauses array (same shape, with optional additive fields).
 */
export function holisticRescore(clauses, templates, rulebooks) {
  // Deep copy to avoid mutating originals
  const scored = clauses.map(c => ({ ...c, mandatedBy: [], warnings: [], source: null }));
  const clauseMap = new Map(scored.map(c => [c.id, c]));

  // ── Step 1: Template clause bindings ──
  const bestTemplate = templates[0];
  if (bestTemplate) {
    const tpl = TEMPLATES.find(t => t.id === bestTemplate.id);
    if (tpl) {
      for (const cid of (tpl.requiredClauses || [])) {
        const c = clauseMap.get(cid);
        if (c) {
          c.relevanceScore = Math.min(c.relevanceScore + 15, 100);
          c.selected = true;
          if (!c.source) c.source = "template-required";
        }
      }
      for (const cid of (tpl.optionalClauses || [])) {
        const c = clauseMap.get(cid);
        if (c) {
          c.relevanceScore = Math.min(c.relevanceScore + 8, 100);
          if (!c.source) c.source = "template-optional";
        }
      }
    }
  }

  // ── Step 2: Rulebook mandate enforcement ──
  for (const rb of rulebooks) {
    if (rb.matchScore < 30) continue;
    for (const cid of (rb.mandatoryClauses || [])) {
      const c = clauseMap.get(cid);
      if (c) {
        c.relevanceScore = Math.min(c.relevanceScore + 20, 100);
        c.selected = true;
        c.mandatedBy.push(rb.name);
        if (!c.source) c.source = "rulebook-mandated";
      }
    }
  }

  // ── Step 3: Clause relationships ──
  for (const rel of CLAUSE_RELATIONSHIPS) {
    const [id1, id2] = rel.clauses;
    const c1 = clauseMap.get(id1);
    const c2 = clauseMap.get(id2);
    if (!c1 || !c2) continue;

    if (rel.type === "synergy") {
      if (c1.selected && !c2.selected) {
        c2.relevanceScore = Math.min(c2.relevanceScore + 10, 100);
        if (!c2.source) c2.source = "relationship";
      } else if (c2.selected && !c1.selected) {
        c1.relevanceScore = Math.min(c1.relevanceScore + 10, 100);
        if (!c1.source) c1.source = "relationship";
      }
    } else if (rel.type === "conflict") {
      if (c1.selected && c2.selected) {
        c1.warnings.push(rel.reason);
        c2.warnings.push(rel.reason);
        // Penalize the lower-scored one
        if (c1.relevanceScore <= c2.relevanceScore) {
          c1.relevanceScore = Math.max(c1.relevanceScore - 10, 0);
        } else {
          c2.relevanceScore = Math.max(c2.relevanceScore - 10, 0);
        }
      }
    } else if (rel.type === "implies") {
      // Directed: first implies second
      if (c1.selected) {
        c2.relevanceScore = Math.min(c2.relevanceScore + 12, 100);
        c2.selected = true;
        if (!c2.source) c2.source = "relationship";
      }
    }
  }

  // ── Step 4: Re-sort ──
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Clean up empty arrays for cleaner JSON
  return scored.map(c => {
    const result = { id: c.id, label: c.label, relevanceScore: c.relevanceScore, selected: c.selected };
    if (c.mandatedBy.length > 0) result.mandatedBy = c.mandatedBy;
    if (c.warnings.length > 0) result.warnings = c.warnings;
    if (c.source) result.source = c.source;
    return result;
  });
}
