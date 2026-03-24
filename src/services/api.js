// ─── API Service Layer ─────────────────────────────────────────────────────
// All API calls: accept AbortSignal, return { data, error }, never throw.
// Fallback to mock data when backend is unavailable.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// ─── Mock data (fallback when backend is offline) ──────────────────────────

const MOCK_SUGGESTIONS = {
  documentType: "Vendor Agreement",
  confidence: 72,
  entities: {
    parties: [
      { role: "client", description: "First Party" },
      { role: "vendor", description: "Second Party" },
    ],
    jurisdiction: null,
    industry: null,
    purpose: "vendor services engagement",
  },
  suggestions: {
    clauses: [
      { id: "c1", label: "Confidentiality", relevanceScore: 95, selected: true },
      { id: "c2", label: "Indemnity", relevanceScore: 90, selected: true },
      { id: "c3", label: "Limitation of Liability", relevanceScore: 88, selected: true },
      { id: "c4", label: "Arbitration", relevanceScore: 82, selected: true },
      { id: "c5", label: "Governing Law", relevanceScore: 85, selected: true },
      { id: "c6", label: "Payment Terms", relevanceScore: 92, selected: false },
      { id: "c7", label: "Intellectual Property", relevanceScore: 87, selected: false },
      { id: "c8", label: "Force Majeure", relevanceScore: 75, selected: false },
      { id: "c9", label: "Termination", relevanceScore: 93, selected: true },
      { id: "c10", label: "Representations & Warranties", relevanceScore: 86, selected: false },
    ],
    template: { id: "t1", name: "Vendor Service Agreement", matchScore: 92 },
    rulebook: { id: "r1", name: "Corporate Contract Policy", matchScore: 88 },
    alternativeTemplates: [
      { id: "t6", name: "Consulting Agreement", matchScore: 74 },
    ],
  },
  customizationPrompts: [],
};

const MOCK_DRAFT = {
  draftId: "d_mock",
  title: "Vendor Agreement",
  generatedAt: new Date().toISOString(),
  sections: [
    { id: "s0", title: "PARTIES", body: 'This Vendor Agreement ("Agreement") is entered into by and between:\n\n1. First Party (hereinafter referred to as "Client")\n\n2. Second Party (hereinafter referred to as "Vendor")\n\n(each a "Party" and collectively the "Parties").', clauseSource: null, editable: true },
    { id: "s1", title: "RECITALS", body: "WHEREAS, the Parties desire to enter into this Vendor Agreement to establish the terms and conditions governing their relationship;\n\nWHEREAS, each Party has the legal capacity and authority to enter into this Agreement;\n\nNOW, THEREFORE, in consideration of the mutual covenants and agreements set forth herein, the Parties agree as follows:", clauseSource: null, editable: true },
    { id: "s2", title: "CONFIDENTIALITY", body: 'Each Party agrees to keep confidential all information disclosed by the other Party that is designated as confidential or that reasonably should be understood to be confidential ("Confidential Information"). This obligation shall survive the termination of this Agreement for a period of [CONFIDENTIALITY_PERIOD_YEARS] years.', clauseSource: "Confidentiality", editable: true },
    { id: "s3", title: "INDEMNITY", body: "Each Party shall indemnify, defend, and hold harmless the other Party from and against any claims, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or relating to any breach of this Agreement.", clauseSource: "Indemnity", editable: true },
    { id: "s4", title: "LIMITATION OF LIABILITY", body: "IN NO EVENT SHALL EITHER PARTY BE LIABLE TO THE OTHER PARTY FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, REGARDLESS OF THE CAUSE OF ACTION OR THE THEORY OF LIABILITY. THE TOTAL LIABILITY OF EITHER PARTY SHALL NOT EXCEED [LIABILITY_CAP].", clauseSource: "Limitation of Liability", editable: true },
    { id: "s5", title: "GOVERNING LAW", body: "This Agreement shall be governed by and construed in accordance with the laws of [GOVERNING_JURISDICTION], without regard to its conflict of laws provisions.", clauseSource: "Governing Law", editable: true },
    { id: "s6", title: "TERMINATION", body: "This Agreement may be terminated: (a) by mutual written agreement of the Parties; (b) by either Party upon [NOTICE_PERIOD_DAYS] days' written notice; (c) immediately by either Party upon material breach by the other Party that remains uncured after [CURE_PERIOD_DAYS] days' notice.", clauseSource: "Termination", editable: true },
    { id: "s7", title: "EXECUTION", body: "IN WITNESS WHEREOF, the Parties have executed this Agreement as of the date last written below.\n\nFirst Party\n\nBy: ________________________\nName: ________________________\nTitle: ________________________\nDate: ________________________\n\nSecond Party\n\nBy: ________________________\nName: ________________________\nTitle: ________________________\nDate: ________________________", clauseSource: null, editable: true },
  ],
  variables: [
    { id: "v1", key: "CONFIDENTIALITY_PERIOD_YEARS", label: "Confidentiality Period Years", type: "number", unit: "years", occurrences: 1 },
    { id: "v2", key: "LIABILITY_CAP", label: "Liability Cap", type: "currency", unit: null, occurrences: 1 },
    { id: "v3", key: "GOVERNING_JURISDICTION", label: "Governing Jurisdiction", type: "text", unit: null, occurrences: 1 },
    { id: "v4", key: "NOTICE_PERIOD_DAYS", label: "Notice Period Days", type: "number", unit: "days", occurrences: 1 },
    { id: "v5", key: "CURE_PERIOD_DAYS", label: "Cure Period Days", type: "number", unit: "days", occurrences: 1 },
  ],
  metadata: { templateUsed: "Vendor Service Agreement", clauseCount: 5, rulebooksApplied: ["Corporate Contract Policy"], wordCount: 320, llmGenerated: false },
};

// ─── Helper: fetch with timeout + retry ────────────────────────────────────

async function fetchWithRetry(url, options, { timeoutMs = 15000, retries = 1 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Merge external signal with timeout
    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) return { data: await res.json(), error: null };

      const errBody = await res.json().catch(() => ({}));
      const errMsg = errBody.error || errBody.message || `HTTP ${res.status}`;

      // Retry on 5xx
      if (res.status >= 500 && attempt < retries) {
        console.warn(`Retrying ${url} after ${res.status}...`);
        continue;
      }

      return { data: null, error: errMsg };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError" && options.signal?.aborted) {
        return { data: null, error: "Request cancelled" };
      }
      if (attempt < retries) {
        console.warn(`Retrying ${url} after error:`, err.message);
        continue;
      }
      return { data: null, error: err.message || "Network error" };
    }
  }
  return { data: null, error: "Request failed after retries" };
}

// ─── API Functions ─────────────────────────────────────────────────────────

/**
 * Analyse user intent. Falls back to MOCK_SUGGESTIONS if backend unavailable.
 * Returns { data, error, usingFallback }.
 */
export async function analyseIntent(intentText, signal) {
  const { data, error } = await fetchWithRetry(
    `${API_BASE}/draft/analyse`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: intentText }),
      signal,
    },
    { timeoutMs: 15000 },
  );

  if (data) return { data, error: null, usingFallback: false };

  // Fallback to mock
  console.warn("analyseIntent fallback to mock:", error);
  return { data: MOCK_SUGGESTIONS, error, usingFallback: true };
}

/**
 * Generate draft content. Falls back to MOCK_DRAFT if backend unavailable.
 * Returns { data, error, usingFallback }.
 */
export async function generateDraft(config, signal) {
  const { data, error } = await fetchWithRetry(
    `${API_BASE}/draft/generate`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
      signal,
    },
    { timeoutMs: 30000 },
  );

  if (data) return { data, error: null, usingFallback: false };

  console.warn("generateDraft fallback to mock:", error);
  return { data: MOCK_DRAFT, error, usingFallback: true };
}

/**
 * Parse uploaded document. No fallback — returns error if backend unavailable.
 * Returns { data, error }.
 */
export async function parseDocument(file, signal) {
  const formData = new FormData();
  formData.append("file", file);

  return await fetchWithRetry(
    `${API_BASE}/documents/parse`,
    { method: "POST", body: formData, signal },
    { timeoutMs: 60000 },
  );
}
