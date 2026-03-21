// ─── Template Registry ─────────────────────────────────────────────────────
// Pure rule-based matching and scoring. No LLM dependency.
// Each template, clause, and rulebook has metadata for keyword-based scoring.

// ─── Document Type Taxonomy ────────────────────────────────────────────────

export const DOCUMENT_TYPES = [
  { id: "vendor-agreement",     label: "Vendor Agreement",     keywords: ["vendor", "supplier", "service provider", "outsource", "procurement"] },
  { id: "nda",                  label: "Non-Disclosure Agreement", keywords: ["nda", "non-disclosure", "confidential", "secrecy", "proprietary"] },
  { id: "employment-agreement", label: "Employment Agreement", keywords: ["employment", "employee", "hire", "hiring", "job", "offer letter", "compensation", "salary"] },
  { id: "shareholder-agreement",label: "Shareholder Agreement",keywords: ["shareholder", "stockholder", "equity", "shares", "dividend", "voting rights"] },
  { id: "lease-agreement",      label: "Lease Agreement",      keywords: ["lease", "rent", "tenant", "landlord", "premises", "property", "occupancy"] },
  { id: "consulting-agreement", label: "Consulting Agreement", keywords: ["consultant", "consulting", "advisory", "advisor", "freelance", "independent contractor"] },
  { id: "software-license",     label: "Software License Agreement", keywords: ["software", "license", "saas", "subscription", "end user", "eula", "api"] },
  { id: "partnership-agreement",label: "Partnership Agreement",keywords: ["partnership", "partner", "joint venture", "collaboration", "co-founder"] },
  { id: "loan-agreement",       label: "Loan Agreement",       keywords: ["loan", "lending", "borrower", "lender", "interest rate", "repayment", "mortgage"] },
  { id: "franchise-agreement",  label: "Franchise Agreement",  keywords: ["franchise", "franchisee", "franchisor", "brand", "territory", "royalty"] },
  { id: "distribution-agreement", label: "Distribution Agreement", keywords: ["distribution", "distributor", "reseller", "channel", "wholesale"] },
  { id: "merger-acquisition",   label: "Merger & Acquisition Agreement", keywords: ["merger", "acquisition", "m&a", "buyout", "takeover", "due diligence"] },
  { id: "power-of-attorney",    label: "Power of Attorney",    keywords: ["power of attorney", "poa", "authorize", "representative", "agent", "proxy"] },
  { id: "terms-of-service",     label: "Terms of Service",     keywords: ["terms of service", "tos", "terms and conditions", "user agreement", "acceptable use"] },
  { id: "privacy-policy",       label: "Privacy Policy",       keywords: ["privacy", "data protection", "personal data", "gdpr", "cookies", "consent"] },
];

// ─── Templates with metadata ───────────────────────────────────────────────

export const TEMPLATES = [
  { id: "t1",  name: "Vendor Service Agreement",       docTypes: ["vendor-agreement"],       keywords: ["vendor", "service", "deliverable", "sow"] },
  { id: "t2",  name: "Non-Disclosure Agreement",       docTypes: ["nda"],                    keywords: ["confidential", "disclosure", "proprietary"] },
  { id: "t3",  name: "Employment Agreement",            docTypes: ["employment-agreement"],   keywords: ["employment", "compensation", "benefits", "termination"] },
  { id: "t4",  name: "Shareholder Agreement",           docTypes: ["shareholder-agreement"],  keywords: ["shares", "voting", "board", "dividend"] },
  { id: "t5",  name: "Lease Agreement",                 docTypes: ["lease-agreement"],        keywords: ["lease", "rent", "premises", "maintenance"] },
  { id: "t6",  name: "Consulting Agreement",            docTypes: ["consulting-agreement"],   keywords: ["consulting", "scope", "deliverable", "hourly"] },
  { id: "t7",  name: "Software License Agreement",      docTypes: ["software-license"],       keywords: ["license", "software", "subscription", "support"] },
  { id: "t8",  name: "Partnership Agreement",           docTypes: ["partnership-agreement"],  keywords: ["partnership", "profit", "contribution", "management"] },
  { id: "t9",  name: "Loan Agreement",                  docTypes: ["loan-agreement"],         keywords: ["loan", "interest", "repayment", "collateral"] },
  { id: "t10", name: "Franchise Agreement",             docTypes: ["franchise-agreement"],     keywords: ["franchise", "territory", "royalty", "training"] },
  { id: "t11", name: "Distribution Agreement",          docTypes: ["distribution-agreement"], keywords: ["distribution", "territory", "pricing", "inventory"] },
  { id: "t12", name: "Terms of Service",                docTypes: ["terms-of-service"],       keywords: ["terms", "user", "account", "liability"] },
  { id: "t13", name: "Privacy Policy",                  docTypes: ["privacy-policy"],         keywords: ["privacy", "data", "collection", "consent"] },
];

// ─── Clauses with relevance mapping ────────────────────────────────────────

export const CLAUSES = [
  { id: "c1",  label: "Confidentiality",            applicableTo: ["vendor-agreement", "nda", "employment-agreement", "consulting-agreement", "software-license", "partnership-agreement", "franchise-agreement", "distribution-agreement", "merger-acquisition"], weight: 95 },
  { id: "c2",  label: "Indemnity",                  applicableTo: ["vendor-agreement", "consulting-agreement", "software-license", "lease-agreement", "distribution-agreement", "franchise-agreement"], weight: 90 },
  { id: "c3",  label: "Limitation of Liability",    applicableTo: ["vendor-agreement", "software-license", "consulting-agreement", "terms-of-service", "distribution-agreement"], weight: 88 },
  { id: "c4",  label: "Arbitration",                applicableTo: ["vendor-agreement", "shareholder-agreement", "partnership-agreement", "franchise-agreement", "distribution-agreement", "lease-agreement"], weight: 82 },
  { id: "c5",  label: "Governing Law",              applicableTo: ["vendor-agreement", "nda", "employment-agreement", "consulting-agreement", "software-license", "shareholder-agreement", "partnership-agreement", "lease-agreement", "loan-agreement", "franchise-agreement", "distribution-agreement"], weight: 85 },
  { id: "c6",  label: "Payment Terms",              applicableTo: ["vendor-agreement", "consulting-agreement", "lease-agreement", "loan-agreement", "franchise-agreement", "distribution-agreement"], weight: 92 },
  { id: "c7",  label: "Intellectual Property",      applicableTo: ["vendor-agreement", "employment-agreement", "consulting-agreement", "software-license", "partnership-agreement", "franchise-agreement"], weight: 87 },
  { id: "c8",  label: "Force Majeure",              applicableTo: ["vendor-agreement", "lease-agreement", "distribution-agreement", "franchise-agreement", "consulting-agreement"], weight: 75 },
  { id: "c9",  label: "Non-Compete",                applicableTo: ["employment-agreement", "partnership-agreement", "franchise-agreement", "consulting-agreement", "merger-acquisition"], weight: 80 },
  { id: "c10", label: "Representations & Warranties", applicableTo: ["vendor-agreement", "shareholder-agreement", "merger-acquisition", "loan-agreement", "franchise-agreement"], weight: 86 },
  { id: "c11", label: "Termination",                applicableTo: ["vendor-agreement", "nda", "employment-agreement", "consulting-agreement", "software-license", "lease-agreement", "partnership-agreement", "franchise-agreement", "distribution-agreement"], weight: 93 },
  { id: "c12", label: "Assignment",                 applicableTo: ["vendor-agreement", "lease-agreement", "software-license", "distribution-agreement"], weight: 70 },
  { id: "c13", label: "Entire Agreement",           applicableTo: ["vendor-agreement", "nda", "employment-agreement", "consulting-agreement", "software-license", "shareholder-agreement", "partnership-agreement"], weight: 65 },
  { id: "c14", label: "Severability",               applicableTo: ["vendor-agreement", "employment-agreement", "software-license", "terms-of-service"], weight: 60 },
  { id: "c15", label: "Notice",                     applicableTo: ["vendor-agreement", "lease-agreement", "shareholder-agreement", "partnership-agreement", "loan-agreement"], weight: 68 },
  { id: "c16", label: "Waiver",                     applicableTo: ["vendor-agreement", "employment-agreement", "software-license"], weight: 55 },
  { id: "c17", label: "Data Protection",            applicableTo: ["software-license", "employment-agreement", "vendor-agreement", "terms-of-service", "privacy-policy"], weight: 89 },
  { id: "c18", label: "Non-Solicitation",           applicableTo: ["employment-agreement", "consulting-agreement", "nda", "merger-acquisition"], weight: 78 },
  { id: "c19", label: "Dispute Resolution",         applicableTo: ["shareholder-agreement", "partnership-agreement", "franchise-agreement", "loan-agreement", "merger-acquisition"], weight: 84 },
  { id: "c20", label: "Insurance",                  applicableTo: ["vendor-agreement", "consulting-agreement", "lease-agreement", "franchise-agreement"], weight: 72 },
];

// ─── Rulebooks with jurisdiction/industry mapping ──────────────────────────

export const RULEBOOKS = [
  { id: "r1", name: "Corporate Contract Policy",       jurisdictions: ["*"],     industries: ["*"],          docTypes: ["vendor-agreement", "consulting-agreement", "distribution-agreement"] },
  { id: "r2", name: "Standard Legal Guidelines",       jurisdictions: ["*"],     industries: ["*"],          docTypes: ["*"] },
  { id: "r3", name: "GDPR Compliance Rules",           jurisdictions: ["eu", "uk", "germany", "france"],  industries: ["*"],  docTypes: ["privacy-policy", "terms-of-service", "software-license", "employment-agreement"] },
  { id: "r4", name: "Arbitration-First Policy",        jurisdictions: ["*"],     industries: ["*"],          docTypes: ["vendor-agreement", "shareholder-agreement", "partnership-agreement", "franchise-agreement"] },
  { id: "r5", name: "Indian Contract Act Compliance",  jurisdictions: ["india"], industries: ["*"],          docTypes: ["*"] },
  { id: "r6", name: "ISO Legal Standards",             jurisdictions: ["*"],     industries: ["technology", "manufacturing", "healthcare"], docTypes: ["vendor-agreement", "software-license"] },
  { id: "r7", name: "US Employment Law Compliance",    jurisdictions: ["us", "usa", "united states"],  industries: ["*"],  docTypes: ["employment-agreement"] },
  { id: "r8", name: "HIPAA Compliance Rules",          jurisdictions: ["us", "usa"],                   industries: ["healthcare", "health", "medical"], docTypes: ["vendor-agreement", "software-license", "privacy-policy"] },
];

// ─── Jurisdiction keywords ─────────────────────────────────────────────────

const JURISDICTION_KEYWORDS = {
  india:   ["india", "indian", "delhi", "mumbai", "bangalore", "bengaluru", "chennai", "kolkata", "hyderabad", "pune", "indian contract act"],
  us:      ["us", "usa", "united states", "america", "american", "california", "new york", "texas", "delaware", "florida"],
  uk:      ["uk", "united kingdom", "england", "british", "london", "scotland", "wales"],
  eu:      ["eu", "european union", "europe", "gdpr"],
  germany: ["germany", "german", "berlin", "munich"],
  france:  ["france", "french", "paris"],
  singapore: ["singapore"],
  australia: ["australia", "australian", "sydney", "melbourne"],
  canada:  ["canada", "canadian", "toronto", "vancouver"],
};

// ─── Industry keywords ─────────────────────────────────────────────────────

const INDUSTRY_KEYWORDS = {
  technology:     ["tech", "technology", "software", "saas", "ai", "app", "platform", "it", "digital", "cloud", "api", "startup"],
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
 * Detect document type from intent text using keyword scoring.
 * Returns sorted array of { id, label, score }.
 */
export function detectDocumentType(intentText) {
  const lower = intentText.toLowerCase();
  const scores = DOCUMENT_TYPES.map(dt => {
    let score = 0;
    for (const kw of dt.keywords) {
      if (lower.includes(kw)) {
        // Exact phrase match scores higher
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
  for (const [key, keywords] of Object.entries(JURISDICTION_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return key;
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
      if (lower.includes(kw)) score += kw.includes(" ") ? 2 : 1;
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
    // Direct doc type match
    if (t.docTypes.includes(documentTypeId)) score += 60;
    // Keyword overlap with intent
    for (const kw of t.keywords) {
      if (lower.includes(kw)) score += 10;
    }
    return { id: t.id, name: t.name, matchScore: Math.min(score, 100) };
  })
    .filter(t => t.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Recommend clauses for a document type. Returns array of { id, label, relevanceScore, selected }.
 * Clauses with relevanceScore >= 80 are auto-selected.
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
 * Returns array of { id, name, matchScore }.
 */
export function mapRulebooks(documentTypeId, jurisdiction, industry) {
  return RULEBOOKS.map(r => {
    let score = 0;
    // Document type match
    if (r.docTypes.includes("*") || r.docTypes.includes(documentTypeId)) score += 30;
    // Jurisdiction match
    if (r.jurisdictions.includes("*")) score += 10;
    else if (jurisdiction && r.jurisdictions.includes(jurisdiction)) score += 40;
    // Industry match
    if (r.industries.includes("*")) score += 5;
    else if (industry && r.industries.includes(industry)) score += 30;
    return { id: r.id, name: r.name, matchScore: Math.min(score, 100) };
  })
    .filter(r => r.matchScore >= 30)
    .sort((a, b) => b.matchScore - a.matchScore);
}
