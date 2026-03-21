import { useState, useRef, useEffect } from "react";
import { analyseIntent, generateDraft, parseDocument, suggestBlocks } from "../services/api.js";
import ReferenceFileIntelligence from "../components/ReferenceFileIntelligence.jsx";

// ─── State Machine ─────────────────────────────────────────────────────────
// draftState controls UI rendering — no parallel boolean states.
// All transitions are explicit and predictable.

const DraftState = {
  MODE_SELECTION:    "MODE_SELECTION",
  INTENT_INPUT:      "INTENT_INPUT",
  ANALYSING:         "ANALYSING",
  SUGGESTIONS_READY: "SUGGESTIONS_READY",
  CONFIGURING:       "CONFIGURING",
  GENERATING:        "GENERATING",
  COMPLETE:          "COMPLETE",
  ERROR:             "ERROR",
};

// Ordered for >= comparisons (is the flow at or past this state?)
const STATE_ORDER = [
  DraftState.MODE_SELECTION,
  DraftState.INTENT_INPUT,
  DraftState.ANALYSING,
  DraftState.SUGGESTIONS_READY,
  DraftState.CONFIGURING,
  DraftState.GENERATING,
  DraftState.COMPLETE,
];
function stateAtLeast(current, target) {
  return STATE_ORDER.indexOf(current) >= STATE_ORDER.indexOf(target);
}

// ─── Default library data (Lexlegis built-in) ──────────────────────────────

const DEFAULT_CLAUSES = [
  "Confidentiality", "Indemnity", "Limitation of Liability", "Arbitration",
  "Governing Law", "Payment Terms", "Intellectual Property", "Force Majeure",
  "Non-Compete", "Representations & Warranties", "Termination", "Assignment",
  "Entire Agreement", "Severability", "Notice", "Waiver", "Data Protection",
  "Non-Solicitation", "Dispute Resolution", "Insurance",
];

const DEFAULT_TEMPLATES = [
  "Vendor Service Agreement", "Non-Disclosure Agreement", "Employment Agreement",
  "Shareholder Agreement", "Lease Agreement", "Consulting Agreement",
  "Software License Agreement", "Partnership Agreement", "Loan Agreement",
  "Franchise Agreement", "Distribution Agreement", "Terms of Service",
  "Privacy Policy", "Purchase Order", "Mutual Confidentiality Agreement",
  "Independent Contractor Agreement", "Master Service Agreement",
  "Affiliate/Referral Agreement", "General Licensing Agreement",
  "Bill of Sale / Asset Purchase",
];

const DEFAULT_RULEBOOKS = [
  "Corporate Contract Policy", "Standard Legal Guidelines", "GDPR Compliance Rules",
  "Arbitration-First Policy", "Indian Contract Act Compliance", "ISO Legal Standards",
  "US Employment Law Compliance", "HIPAA Compliance Rules",
];

// ─── Design tokens ─────────────────────────────────────────────────────────

const T = {
  bg:        "#ffffff",
  white:     "#ffffff",
  border:    "#eae6e0",
  borderHov: "#fdfdfd",
  activeBg:  "#fefdfbee",
  black:     "#111111",
  blackHov:  "#333333",
  textSec:   "#666666",
  textMuted: "#999999",
  textLight: "#aaaaaa",
};

// ─── SVG icons ──────────────────────────────────────────────────────────────

const SparkIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.09 6.26L20.18 9.27l-4.09 3.87 1.09 6.13L12 16.26l-5.18 2.99 1.09-6.13L3.82 9.27l6.09-1.01L12 2z"/>
  </svg>
);
const ChevUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);
const ChevDn = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const CheckIco = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const PlusIco = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const SearchIco = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const UploadIco = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const FileIco = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);
const XIco = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ─── Shared: SearchInput ───────────────────────────────────────────────────

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}>
        <SearchIco />
      </span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "8px 10px 8px 30px",
          border: `1px solid ${T.border}`, borderRadius: 8,
          fontSize: 13, color: T.black, outline: "none",
          boxSizing: "border-box", background: T.white,
          fontFamily: "inherit",
        }}
        onFocus={e => e.target.style.borderColor = T.borderHov}
        onBlur={e => e.target.style.borderColor = T.border}
      />
    </div>
  );
}

// ─── Shared: AddCustomRow ──────────────────────────────────────────────────

function AddCustomRow({ placeholder, onAdd }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
    inputRef.current?.focus();
  };

  return (
    <div style={{
      display: "flex", gap: 7, marginTop: 12,
      paddingTop: 12, borderTop: `1px dashed ${T.border}`,
    }}>
      <input
        ref={inputRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleAdd()}
        placeholder={placeholder}
        style={{
          flex: 1, padding: "7px 10px",
          border: `1px solid ${T.border}`, borderRadius: 8,
          fontSize: 13, color: T.black, outline: "none",
          background: T.bg, fontFamily: "inherit",
        }}
        onFocus={e => e.target.style.borderColor = T.borderHov}
        onBlur={e => e.target.style.borderColor = T.border}
      />
      <button
        onClick={handleAdd}
        disabled={!value.trim()}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          padding: "7px 13px", borderRadius: 8,
          border: `1px solid ${value.trim() ? T.black : T.border}`,
          background: value.trim() ? T.black : T.white,
          color: value.trim() ? "white" : T.textMuted,
          fontSize: 12, fontWeight: 600, cursor: value.trim() ? "pointer" : "default",
          transition: "all .15s", fontFamily: "inherit", flexShrink: 0,
        }}
      >
        <PlusIco /> Add
      </button>
    </div>
  );
}

// ─── Shared: ConfigurationCard ─────────────────────────────────────────────

function ConfigurationCard({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center",
          justifyContent: "space-between", padding: "13px 18px",
          background: "none", border: "none", cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: T.black }}>{title}</span>
        <span style={{ color: T.textMuted }}>{open ? <ChevUp /> : <ChevDn />}</span>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "14px 18px" }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── StepLabel ─────────────────────────────────────────────────────────────

function StepLabel({ n, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{
        width: 22, height: 22, borderRadius: "50%",
        background: T.black, color: T.white,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 11, fontWeight: 700, flexShrink: 0,
      }}>
        {n}
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: T.textSec }}>{label}</span>
    </div>
  );
}

// ─── LibraryBadge ──────────────────────────────────────────────────────────

function LibraryBadge({ custom }) {
  if (!custom) return null;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 6,
      background: "#fefce8", border: "1px solid #fde68a", color: "#92400e",
      flexShrink: 0,
    }}>
      Custom
    </span>
  );
}

// ─── Fallback Warning Banner ───────────────────────────────────────────────

function FallbackBanner() {
  return (
    <div style={{
      background: "#faf6ec", border: "1px solid #e2ceA0", borderRadius: 8,
      padding: "8px 14px", display: "flex", alignItems: "center", gap: 8,
      marginBottom: 16,
    }}>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="7" cy="7" r="6" stroke="#b08a30" strokeWidth="1.25"/>
        <path d="M7 6.5v3.5" stroke="#b08a30" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="7" cy="4.5" r="0.75" fill="#b08a30"/>
      </svg>
      <span style={{ fontSize: 12, color: "#4a3510", fontWeight: 500 }}>
        Using offline suggestions — connect backend for intelligent analysis
      </span>
    </div>
  );
}

// ─── Pipeline Progress ─────────────────────────────────────────────────────

function PipelineProgress({ draftState }) {
  const steps = [
    { key: DraftState.INTENT_INPUT, label: "Intent" },
    { key: DraftState.ANALYSING, label: "Analysis" },
    { key: DraftState.CONFIGURING, label: "Configuration" },
    { key: DraftState.GENERATING, label: "Generation" },
  ];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 0,
      marginBottom: 20, padding: "10px 0",
    }}>
      {steps.map((step, i) => {
        const isActive = draftState === step.key ||
          (step.key === DraftState.CONFIGURING && draftState === DraftState.SUGGESTIONS_READY);
        const isComplete = stateAtLeast(draftState, step.key) && !isActive &&
          draftState !== DraftState.ERROR;
        const isPast = stateAtLeast(draftState, step.key);

        return (
          <div key={step.key} style={{ display: "flex", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                background: isComplete ? T.black : isActive ? T.black : "#e5e5e5",
                color: isComplete || isActive ? "white" : T.textMuted,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 700,
                transition: "all 0.2s",
              }}>
                {isComplete ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span style={{
                fontSize: 11.5, fontWeight: isActive ? 600 : 400,
                color: isPast ? T.black : T.textMuted,
                transition: "all 0.2s",
              }}>
                {step.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{
                width: 32, height: 1, margin: "0 8px",
                background: isPast && !isActive ? T.black : T.border,
                transition: "background 0.2s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── DraftIntentInput ──────────────────────────────────────────────────────

function DraftIntentInput({ onSubmit, loading }) {
  const [value, setValue] = useState("");

  const examples = [
    "Draft a Vendor Agreement between a SaaS company and a marketing agency",
    "Draft an NDA between a startup and a potential investor",
    "Create an Employment Agreement for a senior engineer in India",
    "Draft a Software License Agreement for a B2B product",
  ];

  return (
    <div style={{
      background: T.white, border: `1px solid ${T.border}`,
      borderRadius: 12, overflow: "hidden",
      boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
    }}>
      <div style={{ padding: "18px 18px 10px" }}>
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && value.trim())
              onSubmit(value.trim());
          }}
          placeholder={"Describe the legal document you want to create…\n\ne.g. Draft a Non-Disclosure Agreement between a startup and an investor."}
          style={{
            width: "100%", minHeight: 100, border: "none", outline: "none",
            resize: "none", fontSize: 14, lineHeight: 1.7, color: T.black,
            background: "transparent", fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
      </div>

      {/* example pills */}
      <div style={{ padding: "0 18px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => setValue(ex)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.black; e.currentTarget.style.color = T.black; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSec; }}
            style={{
              fontSize: 11.5, padding: "3px 10px", borderRadius: 20,
              border: `1px solid ${T.border}`, background: T.bg,
              color: T.textSec, cursor: "pointer", transition: "all .15s",
              fontFamily: "inherit",
            }}
          >
            {ex.length > 54 ? ex.slice(0, 54) + "…" : ex}
          </button>
        ))}
      </div>

      <div style={{
        borderTop: `1px solid ${T.border}`, padding: "10px 14px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: T.bg,
      }}>
        <span style={{ fontSize: 11.5, color: T.textLight }}>⌘ Enter to analyse</span>
        <button
          onClick={() => value.trim() && !loading && onSubmit(value.trim())}
          disabled={!value.trim() || loading}
          onMouseEnter={e => { if (!loading && value.trim()) e.currentTarget.style.background = T.blackHov; }}
          onMouseLeave={e => { e.currentTarget.style.background = value.trim() && !loading ? T.black : "#d1d5db"; }}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: value.trim() && !loading ? T.black : "#d1d5db",
            color: "white", border: "none", borderRadius: 8,
            padding: "8px 16px", fontSize: 13, fontWeight: 600,
            cursor: value.trim() && !loading ? "pointer" : "default",
            transition: "background .2s", fontFamily: "inherit",
          }}
        >
          {loading ? (
            <>
              <span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,.35)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "lexSpin .7s linear infinite" }} />
              Analysing…
            </>
          ) : (
            <><SparkIcon /> Analyse</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── AISuggestionsPanel ────────────────────────────────────────────────────
// Updated to handle new API response structure with entities

function AISuggestionsPanel({ suggestions }) {
  const templateName = typeof suggestions.template === "string"
    ? suggestions.template
    : suggestions.suggestions?.template?.name || "—";
  const rulebookName = typeof suggestions.rulebook === "string"
    ? suggestions.rulebook
    : suggestions.suggestions?.rulebook?.name || "—";
  const clauses = suggestions.clauses || suggestions.suggestions?.clauses || [];
  const entities = suggestions.entities || {};

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 1, background: T.border }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>
          AI Analysis
        </span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
        {/* Document Type */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Detected Type</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.black }}>{suggestions.documentType}</div>
          <div style={{ marginTop: 6, display: "inline-flex", background: suggestions.confidence >= 70 ? "#f0fdf4" : "#fefce8", border: `1px solid ${suggestions.confidence >= 70 ? "#bbf7d0" : "#fde68a"}`, borderRadius: 10, padding: "2px 8px" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: suggestions.confidence >= 70 ? "#16a34a" : "#92400e" }}>{suggestions.confidence}% confidence</span>
          </div>
        </div>

        {/* Recommended Clauses */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Recommended Clauses</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {clauses.filter(c => c.selected).slice(0, 6).map(c => (
              <span key={c.id} style={{ fontSize: 11.5, padding: "2px 8px", borderRadius: 10, background: T.activeBg, color: T.black, border: `1px solid ${T.border}`, fontWeight: 500 }}>
                {c.label}
              </span>
            ))}
            {clauses.filter(c => c.selected).length > 6 && (
              <span style={{ fontSize: 11.5, padding: "2px 8px", color: T.textMuted }}>
                +{clauses.filter(c => c.selected).length - 6} more
              </span>
            )}
          </div>
        </div>

        {/* Template */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Suggested Template</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.black }}>{templateName}</div>
          <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2 }}>Lexlegis Template Library</div>
        </div>

        {/* Entities (new) */}
        {entities.parties?.length > 0 && (
          <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Identified Entities</div>
            {entities.parties.map((p, i) => (
              <div key={i} style={{ fontSize: 12.5, color: T.black, marginBottom: 3 }}>
                <span style={{ fontWeight: 600 }}>{p.role}:</span> {p.description}
              </div>
            ))}
            {entities.jurisdiction && (
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 4 }}>
                Jurisdiction: <span style={{ fontWeight: 500, color: T.black }}>{entities.jurisdiction}</span>
              </div>
            )}
            {entities.industry && (
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>
                Industry: <span style={{ fontWeight: 500, color: T.black }}>{entities.industry}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Customization prompts */}
      {suggestions.customizationPrompts?.length > 0 && (
        <div style={{ marginTop: 12, padding: "10px 14px", background: "#f8f7f4", borderRadius: 8, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Clarifying Questions</div>
          {suggestions.customizationPrompts.map((q, i) => (
            <div key={i} style={{ fontSize: 12.5, color: T.textSec, marginBottom: 4, paddingLeft: 10, borderLeft: `2px solid ${T.border}` }}>
              {q}
            </div>
          ))}
          <div style={{ fontSize: 11, color: T.textLight, marginTop: 6 }}>
            Address these in the "Additional Instructions" section below for better results.
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ClauseSelector ────────────────────────────────────────────────────────

// ─── Lock icon for required items ──────────────────────────────────────────
const LockIco = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

function ClauseSelector({ clauses, onChange, customClauses, onAddCustom }) {
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [q, setQ] = useState("");

  const selectedClauses = clauses.filter(c => c.selected);
  const unselectedClauses = clauses.filter(c => !c.selected);

  // All possible labels for the add panel
  const allLabels = [...new Set([...DEFAULT_CLAUSES, ...customClauses, ...clauses.map(c => c.label)])];
  const selectedLabels = new Set(selectedClauses.map(c => c.label));
  const availableLabels = allLabels.filter(l => !selectedLabels.has(l));
  const filteredAvailable = availableLabels.filter(l => l.toLowerCase().includes(q.toLowerCase()));

  const addClause = (label) => {
    const existing = clauses.find(c => c.label === label);
    if (existing) {
      onChange(clauses.map(c => c.label === label ? { ...c, selected: true } : c));
    } else {
      onChange([...clauses, { id: `cx-${Date.now()}`, label, selected: true }]);
    }
  };

  const removeClause = (label) => {
    onChange(clauses.map(c => c.label === label ? { ...c, selected: false } : c));
  };

  const handleAddCustom = (label) => {
    if (allLabels.includes(label)) return;
    onAddCustom(label);
    onChange([...clauses, { id: `cx-${Date.now()}`, label, selected: true }]);
  };

  return (
    <div>
      {/* Zone 1: Selected clauses as chips with × */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, minHeight: 28 }}>
        {selectedClauses.length === 0 && (
          <span style={{ fontSize: 12.5, color: T.textMuted, padding: "5px 0" }}>No clauses selected</span>
        )}
        {selectedClauses.map((c, i) => {
          const isMandated = c.mandatedBy?.length > 0;
          const isRequired = c.source === "template-required";
          const hasWarning = c.warnings?.length > 0;
          return (
            <span
              key={c.label}
              className="lex-popin"
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 8px 5px 11px", borderRadius: 20, fontSize: 12.5, fontWeight: 500,
                background: T.black, color: "white",
                border: `1px solid ${hasWarning ? "#f59e0b" : T.black}`,
                animationDelay: `${i * 50}ms`,
                position: "relative",
              }}
              title={[
                isRequired ? "Required by template" : "",
                isMandated ? `Mandated by: ${c.mandatedBy.join(", ")}` : "",
                hasWarning ? c.warnings.join("; ") : "",
              ].filter(Boolean).join(" · ") || undefined}
            >
              {isRequired && <LockIco />}
              {c.label}
              {isMandated && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: "0 4px", borderRadius: 4, background: "rgba(255,255,255,.2)", color: "rgba(255,255,255,.8)" }}>
                  {c.mandatedBy[0].split(" ")[0]}
                </span>
              )}
              {hasWarning && (
                <span style={{ fontSize: 9, fontWeight: 700, padding: "0 4px", borderRadius: 4, background: "#f59e0b", color: "#fff" }}>⚠</span>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); removeClause(c.label); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.6)", padding: 0, display: "flex", lineHeight: 1 }}
                onMouseEnter={e => e.currentTarget.style.color = "white"}
                onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.6)"}
              >
                <XIco size={10} />
              </button>
            </span>
          );
        })}
      </div>

      {selectedClauses.length > 0 && (
        <div style={{ marginTop: 6, fontSize: 12, color: T.textMuted }}>
          {selectedClauses.length} clause{selectedClauses.length !== 1 ? "s" : ""} selected
        </div>
      )}

      {/* Zone 2: Add more button + expandable search panel */}
      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => { setAddPanelOpen(o => !o); setQ(""); }}
          onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHov}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 13px", borderRadius: 20, fontSize: 12.5, fontWeight: 500,
            border: `1px solid ${T.border}`, background: T.white, color: T.textSec,
            cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
          }}
        >
          <PlusIco /> Add clause
        </button>

        {addPanelOpen && (
          <div style={{
            marginTop: 8, padding: "12px", background: T.bg,
            border: `1px solid ${T.border}`, borderRadius: 10,
            animation: "lexSlideDown .25s ease forwards",
          }}>
            <SearchInput value={q} onChange={setQ} placeholder="Search available clauses…" />
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, maxHeight: 180, overflowY: "auto" }}>
              {filteredAvailable.map(label => {
                const clauseData = unselectedClauses.find(c => c.label === label);
                return (
                  <button
                    key={label}
                    onClick={() => addClause(label)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.black; e.currentTarget.style.color = T.black; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSec; }}
                    style={{
                      display: "flex", alignItems: "center", gap: 5,
                      padding: "5px 11px", borderRadius: 20, fontSize: 12.5, fontWeight: 500,
                      border: `1px solid ${T.border}`, background: T.white, color: T.textSec,
                      cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
                    }}
                  >
                    <PlusIco /> {label}
                    {clauseData?.relevanceScore && (
                      <span style={{ fontSize: 10, color: T.textLight }}>{clauseData.relevanceScore}%</span>
                    )}
                  </button>
                );
              })}
              {filteredAvailable.length === 0 && (
                <span style={{ fontSize: 12, color: T.textMuted, padding: "4px 0" }}>No matching clauses</span>
              )}
            </div>
            <AddCustomRow placeholder="Add a custom clause…" onAdd={handleAddCustom} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TemplateSelector ──────────────────────────────────────────────────────

function TemplateSelector({ selected, onChange, customTemplates, onAddCustom }) {
  const [changePanelOpen, setChangePanelOpen] = useState(false);
  const [q, setQ] = useState("");
  const all = [...new Set([...DEFAULT_TEMPLATES, ...customTemplates])];
  const alternatives = all.filter(t => t !== selected && t.toLowerCase().includes(q.toLowerCase()));

  const handleAddCustom = (label) => {
    if (all.includes(label)) return;
    onAddCustom(label);
    onChange(label);
  };

  return (
    <div>
      {/* Zone 1: Current template */}
      {selected ? (
        <div className="lex-popin" style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: 10,
          border: `1px solid ${T.black}`, background: T.activeBg,
        }}>
          <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, border: `2px solid ${T.black}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.black }} />
          </div>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.black }}>{selected}</span>
          <button
            onClick={() => { setChangePanelOpen(o => !o); setQ(""); }}
            style={{ fontSize: 12, color: T.textSec, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}
          >
            Change
          </button>
        </div>
      ) : (
        <span style={{ fontSize: 12.5, color: T.textMuted }}>No template selected</span>
      )}

      {/* Zone 2: Change panel */}
      {changePanelOpen && (
        <div style={{
          marginTop: 8, padding: "12px", background: T.bg,
          border: `1px solid ${T.border}`, borderRadius: 10,
          animation: "lexSlideDown .25s ease forwards",
        }}>
          <SearchInput value={q} onChange={setQ} placeholder="Search templates…" />
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10, maxHeight: 240, overflowY: "auto" }}>
            {alternatives.map(t => {
              const isCustom = customTemplates.includes(t) && !DEFAULT_TEMPLATES.includes(t);
              return (
                <label
                  key={t}
                  onClick={() => { onChange(t); setChangePanelOpen(false); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${T.border}`, background: T.white,
                    transition: "all .15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.black}
                  onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                >
                  <span style={{ flex: 1, fontSize: 13, color: T.black }}>{t}</span>
                  <LibraryBadge custom={isCustom} />
                </label>
              );
            })}
          </div>
          <AddCustomRow placeholder="Add a custom template…" onAdd={handleAddCustom} />
        </div>
      )}
    </div>
  );
}

// ─── RulebookSelector ──────────────────────────────────────────────────────

function RulebookSelector({ selected, onChange, customRulebooks, onAddCustom }) {
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [q, setQ] = useState("");
  const all = [...new Set([...DEFAULT_RULEBOOKS, ...customRulebooks])];
  const available = all.filter(r => !selected.includes(r) && r.toLowerCase().includes(q.toLowerCase()));

  const handleAddCustom = (label) => {
    if (all.includes(label)) return;
    onAddCustom(label);
    onChange([...selected, label]);
  };

  return (
    <div>
      {/* Zone 1: Selected rulebooks as chips with × */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, minHeight: 28 }}>
        {selected.length === 0 && (
          <span style={{ fontSize: 12.5, color: T.textMuted, padding: "5px 0" }}>No rulebooks selected</span>
        )}
        {selected.map((r, i) => (
          <span
            key={r}
            className="lex-popin"
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "5px 8px 5px 11px", borderRadius: 20, fontSize: 12.5, fontWeight: 500,
              background: T.black, color: "white", border: `1px solid ${T.black}`,
              animationDelay: `${i * 50}ms`,
            }}
          >
            {r}
            <button
              onClick={() => onChange(selected.filter(x => x !== r))}
              style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,.6)", padding: 0, display: "flex", lineHeight: 1 }}
              onMouseEnter={e => e.currentTarget.style.color = "white"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,.6)"}
            >
              <XIco size={10} />
            </button>
          </span>
        ))}
      </div>

      {/* Zone 2: Add more */}
      <div style={{ marginTop: 10 }}>
        <button
          onClick={() => { setAddPanelOpen(o => !o); setQ(""); }}
          onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHov}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "6px 13px", borderRadius: 20, fontSize: 12.5, fontWeight: 500,
            border: `1px solid ${T.border}`, background: T.white, color: T.textSec,
            cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
          }}
        >
          <PlusIco /> Add rulebook
        </button>

        {addPanelOpen && (
          <div style={{
            marginTop: 8, padding: "12px", background: T.bg,
            border: `1px solid ${T.border}`, borderRadius: 10,
            animation: "lexSlideDown .25s ease forwards",
          }}>
            <SearchInput value={q} onChange={setQ} placeholder="Search available rulebooks…" />
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10, maxHeight: 180, overflowY: "auto" }}>
              {available.map(r => (
                <label
                  key={r}
                  onClick={() => { onChange([...selected, r]); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                    border: `1px solid ${T.border}`, background: T.white,
                    transition: "all .15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = T.black}
                  onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                >
                  <PlusIco />
                  <span style={{ flex: 1, fontSize: 13, color: T.black }}>{r}</span>
                </label>
              ))}
              {available.length === 0 && (
                <span style={{ fontSize: 12, color: T.textMuted, padding: "4px 0" }}>All rulebooks already selected</span>
              )}
            </div>
            <AddCustomRow placeholder="Add a custom rulebook…" onAdd={handleAddCustom} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── InstructionsEditor ────────────────────────────────────────────────────

function InstructionsEditor({ value, onChange }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={"Add specific instructions for the AI to follow when drafting…\n\ne.g. Use Indian governing law. Favour arbitration over litigation."}
      onFocus={e => e.target.style.borderColor = T.borderHov}
      onBlur={e => e.target.style.borderColor = T.border}
      style={{ width: "100%", minHeight: 90, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13.5, lineHeight: 1.65, color: T.black, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: T.white }}
    />
  );
}

// ─── GeneratedDraftView ────────────────────────────────────────────────────

function GeneratedDraftView({ draftData, onReset }) {
  const sections = draftData?.sections || [];
  const title = draftData?.title || "Legal Document";
  const metadata = draftData?.metadata || {};

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ background: T.black, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{title}</div>
          <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12, marginTop: 2 }}>
            Draft generated · {new Date(draftData?.generatedAt || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            {metadata.wordCount ? ` · ${metadata.wordCount} words` : ""}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["Edit", "Export"].map(label => (
            <button key={label} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.1)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: "28px 32px", maxHeight: 480, overflowY: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 11.5, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Draft Document</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.black }}>{title}</div>
        </div>
        {sections.map((s, i) => (
          <div key={s.id || i} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: T.black, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${T.border}` }}>
              {i + 1}. {s.title}
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.8, color: T.textSec, whiteSpace: "pre-wrap" }}>{s.body}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, padding: "11px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: T.bg }}>
        <span style={{ fontSize: 12, color: T.textMuted }}>
          Preview only — review carefully before use
          {metadata.llmGenerated === false && " (template-based)"}
        </span>
        <button onClick={onReset} style={{ fontSize: 12, color: T.black, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
          Start new draft
        </button>
      </div>
    </div>
  );
}

// ─── ModeSelector ──────────────────────────────────────────────────────────

function ModeSelector({ selected, onChange, transitioning }) {
  const modes = [
    {
      id: "reactive",
      title: "Reactive drafting",
      desc: "Draft a response to a notice, petition, or other legal document. Upload the document you're responding to, along with any reference files.",
    },
    {
      id: "proactive",
      title: "Proactive drafting",
      desc: "Creating a first-instance draft like a contract or agreement, petition, or any other legal document.",
    },
  ];

  return (
    <div>
      <p style={{ fontSize: 14, fontWeight: 600, color: T.black, marginBottom: 4 }}>
        Are you drafting in response to something?
      </p>
      <p style={{ fontSize: 13, color: T.textSec, marginBottom: 18 }}>
        Please select an option to proceed.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {modes.map(m => {
          const on = selected === m.id;
          const hidden = transitioning && !on;
          return (
            <div
              key={m.id}
              onClick={() => !transitioning && onChange(m.id)}
              onMouseEnter={e => { if (!on && !transitioning) e.currentTarget.style.borderColor = T.borderHov; }}
              onMouseLeave={e => { if (!on && !transitioning) e.currentTarget.style.borderColor = T.border; }}
              style={{
                borderRadius: 10, cursor: transitioning ? "default" : "pointer",
                border: `1px solid ${on ? T.black : T.border}`,
                background: on ? T.activeBg : T.white,
                transition: "all 0.3s ease-in-out",
                opacity: hidden ? 0 : 1,
                maxHeight: hidden ? 0 : 200,
                overflow: "hidden",
                padding: hidden ? "0 20px" : "18px 20px",
                marginBottom: hidden ? -14 : 0,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{
                  width: 17, height: 17, borderRadius: "50%", flexShrink: 0, marginTop: 2,
                  border: `2px solid ${on ? T.black : T.borderHov}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {on && <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.black }} />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.black, marginBottom: 5 }}>{m.title}</div>
                  <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.55 }}>{m.desc}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ReactiveDraftPlaceholder ──────────────────────────────────────────────

function ReactiveDraftPlaceholder() {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [instructions, setInstructions] = useState("");

  const handlePick = (e) => {
    setFiles(prev => [...prev, ...Array.from(e.target.files).map(f => ({ name: f.name }))]);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files).map(f => ({ name: f.name }))]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }} className="lex-fadein">
      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "13px 18px", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.black }}>Upload the document you are responding to</span>
          <span style={{ marginLeft: 8, fontSize: 12, color: T.textMuted }}>Required</span>
        </div>
        <div style={{ padding: "14px 18px" }}>
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHov}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            style={{ border: `2px dashed ${T.border}`, borderRadius: 10, padding: "22px", textAlign: "center", background: T.bg, cursor: "pointer", transition: "border-color .15s" }}
          >
            <div style={{ marginBottom: 6 }}><UploadIco /></div>
            <div style={{ fontSize: 13, color: T.textSec }}>
              Drop the source document here or <span style={{ color: T.black, textDecoration: "underline" }}>browse</span>
            </div>
            <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 4 }}>PDF, DOCX, TXT supported</div>
            <input ref={inputRef} type="file" multiple onChange={handlePick} style={{ display: "none" }} />
          </div>
          {files.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
              {files.map((f, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}><FileIco /><span style={{ fontSize: 13, color: T.black }}>{f.name}</span></div>
                  <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 2 }}>
                    <XIco />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
        <div style={{ padding: "13px 18px", borderBottom: `1px solid ${T.border}` }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: T.black }}>Instructions for your response</span>
        </div>
        <div style={{ padding: "14px 18px" }}>
          <textarea
            value={instructions}
            onChange={e => setInstructions(e.target.value)}
            placeholder={"Describe how you want to respond to this document…\n\ne.g. Draft a counter-notice disputing the claims in section 3. Use a firm but professional tone."}
            onFocus={e => e.target.style.borderColor = T.borderHov}
            onBlur={e => e.target.style.borderColor = T.border}
            style={{ width: "100%", minHeight: 90, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13.5, lineHeight: 1.65, color: T.black, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: T.bg }}
          />
        </div>
      </div>

      <button
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 24px", borderRadius: 10, border: "none", background: T.black, color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
        onMouseEnter={e => e.currentTarget.style.background = T.blackHov}
        onMouseLeave={e => e.currentTarget.style.background = T.black}
      >
        <SparkIcon /> Generate Response Draft
      </button>
    </div>
  );
}

// ─── Error Display ─────────────────────────────────────────────────────────

function ErrorDisplay({ error, onRetry }) {
  return (
    <div style={{
      background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
      padding: "14px 18px", display: "flex", alignItems: "center", gap: 12,
    }}>
      <svg width="16" height="16" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
        <path d="M7 1.5L13 12.5H1L7 1.5Z" stroke="#b91c1c" strokeWidth="1.25" strokeLinejoin="round"/>
        <path d="M7 5.5v3" stroke="#b91c1c" strokeWidth="1.3" strokeLinecap="round"/>
        <circle cx="7" cy="10" r="0.75" fill="#b91c1c"/>
      </svg>
      <span style={{ flex: 1, fontSize: 13, color: "#7f1d1d" }}>{error}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 6,
            border: "1px solid #fca5a5", background: "#fef2f2", color: "#b91c1c",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ─── DraftPage ─────────────────────────────────────────────────────────────

export default function DraftPage() {
  // ── State machine ──
  const [draftState, setDraftState] = useState(DraftState.MODE_SELECTION);
  const [mode, setMode] = useState(null);
  const [modeTransitioning, setModeTransitioning] = useState(false);

  // ── Data state ──
  const [intentText, setIntentText] = useState("");
  const [suggestions, setSuggestions] = useState(null);
  const [draftData, setDraftData] = useState(null);
  const [clauses, setClauses] = useState([]);
  const [template, setTemplate] = useState("");
  const [rulebooks, setRulebooks] = useState([]);
  const [instructions, setInstructions] = useState("");

  // ── Reference file intelligence ──
  const [refFiles, setRefFiles] = useState([]);        // Array of { file, fileId, fileName, blocks, parsing }
  const [selectedBlocks, setSelectedBlocks] = useState([]);
  const [suggestedBlockIds, setSuggestedBlockIds] = useState([]);

  // ── Company custom library (persists across draft sessions) ──
  const [customClauses, setCustomClauses] = useState([]);
  const [customTemplates, setCustomTemplates] = useState([]);
  const [customRulebooks, setCustomRulebooks] = useState([]);

  // ── Error / fallback ──
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  // ── Refs ──
  const configRef = useRef(null);
  const abortRef = useRef(null);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // ── Mode selection handler ──
  const handleModeSelect = (modeId) => {
    setMode(modeId);
    setModeTransitioning(true);
    setTimeout(() => {
      setModeTransitioning(false);
      setDraftState(DraftState.INTENT_INPUT);
    }, 350);
  };

  // ── Analyse intent ──
  // Pipeline: Intent → analyseIntent() → suggestions (template + clauses + rulebooks)
  const handleAnalyse = async (text) => {
    setIntentText(text);
    setDraftState(DraftState.ANALYSING);
    setError(null);
    setUsingFallback(false);

    // Abort previous request if any
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const result = await analyseIntent(text, abortRef.current.signal);

    if (result.error === "Request cancelled") return;

    if (result.usingFallback) {
      setUsingFallback(true);
    }

    if (result.data) {
      setSuggestions(result.data);

      // Map API response to component state
      const apiClauses = result.data.suggestions?.clauses || result.data.clauses || [];
      setClauses(apiClauses);

      const apiTemplate = result.data.suggestions?.template;
      setTemplate(typeof apiTemplate === "string" ? apiTemplate : apiTemplate?.name || "");

      const apiRulebook = result.data.suggestions?.rulebook;
      const rbName = typeof apiRulebook === "string" ? apiRulebook : apiRulebook?.name || "";
      setRulebooks(rbName ? [rbName] : []);

      setDraftState(DraftState.SUGGESTIONS_READY);
      setTimeout(() => configRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);

      // Auto-suggest blocks for any already-parsed reference files
      if (refFiles.some(f => f.blocks?.length > 0)) {
        autoSuggestBlocks(
          refFiles.flatMap(f => f.blocks || []),
          text,
          result.data.documentType,
          apiClauses,
        );
      }
    } else {
      setError(result.error || "Analysis failed");
      setDraftState(DraftState.ERROR);
    }
  };

  // ── Auto-suggest relevant blocks from parsed reference files ──
  const autoSuggestBlocks = async (blocks, intent, documentType, selectedClauses) => {
    const result = await suggestBlocks(blocks, intent, documentType, selectedClauses);
    if (result.data?.suggestedBlockIds) {
      setSuggestedBlockIds(result.data.suggestedBlockIds);
      // Auto-select suggested blocks
      setSelectedBlocks(prev => {
        const newIds = result.data.suggestedBlockIds.filter(id => !prev.includes(id));
        return [...prev, ...newIds];
      });
    }
  };

  // ── Generate draft ──
  // Pipeline: configuration → generateDraft() → draft output
  const handleGenerate = async () => {
    setDraftState(DraftState.GENERATING);
    setError(null);

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    // Build reference blocks from selected blocks
    const referenceBlocks = refFiles
      .flatMap(f => f.blocks || [])
      .filter(b => selectedBlocks.includes(b.id))
      .map(b => ({ title: b.title, preview: b.preview, fullText: b.fullText }));

    const config = {
      documentType: suggestions?.documentType || "Legal Document",
      template,
      clauses,
      rulebooks,
      referenceBlocks,
      instructions,
      entities: suggestions?.entities || {},
    };

    const result = await generateDraft(config, abortRef.current.signal);

    if (result.error === "Request cancelled") return;

    if (result.usingFallback) {
      setUsingFallback(true);
    }

    if (result.data) {
      setDraftData(result.data);
      setDraftState(DraftState.COMPLETE);
    } else {
      setError(result.error || "Generation failed");
      setDraftState(DraftState.ERROR);
    }
  };

  // ── Reference file upload & parse ──
  const handleFileUpload = async (fileList) => {
    const newFiles = Array.from(fileList);
    const fileEntries = newFiles.map(f => ({
      file: f,
      fileId: `f_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fileName: f.name,
      blocks: [],
      parsing: true,
    }));

    setRefFiles(prev => [...prev, ...fileEntries]);

    // Parse each file
    for (const entry of fileEntries) {
      const result = await parseDocument(entry.file);

      setRefFiles(prev => prev.map(f =>
        f.fileId === entry.fileId
          ? {
              ...f,
              parsing: false,
              blocks: result.data?.blocks || [],
              fileId: result.data?.fileId || f.fileId,
            }
          : f
      ));

      // Auto-suggest if we already have suggestions
      if (result.data?.blocks?.length > 0 && suggestions) {
        autoSuggestBlocks(
          result.data.blocks,
          intentText,
          suggestions.documentType,
          clauses,
        );
      }
    }
  };

  const handleRemoveFile = (index) => {
    const removed = refFiles[index];
    if (removed?.blocks) {
      const blockIds = removed.blocks.map(b => b.id);
      setSelectedBlocks(prev => prev.filter(id => !blockIds.includes(id)));
      setSuggestedBlockIds(prev => prev.filter(id => !blockIds.includes(id)));
    }
    setRefFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleBlock = (blockId) => {
    setSelectedBlocks(prev =>
      prev.includes(blockId) ? prev.filter(id => id !== blockId) : [...prev, blockId]
    );
  };

  const handleSelectAllBlocks = (fileIndex) => {
    const file = refFiles[fileIndex];
    if (!file?.blocks) return;
    const blockIds = file.blocks.map(b => b.id);
    setSelectedBlocks(prev => [...new Set([...prev, ...blockIds])]);
  };

  const handleDeselectAllBlocks = (fileIndex) => {
    const file = refFiles[fileIndex];
    if (!file?.blocks) return;
    const blockIds = new Set(file.blocks.map(b => b.id));
    setSelectedBlocks(prev => prev.filter(id => !blockIds.has(id)));
  };

  // ── Reset ──
  const handleReset = () => {
    if (abortRef.current) abortRef.current.abort();
    setDraftState(DraftState.MODE_SELECTION);
    setMode(null);
    setModeTransitioning(false);
    setIntentText("");
    setSuggestions(null);
    setDraftData(null);
    setClauses([]);
    setTemplate("");
    setRulebooks([]);
    setInstructions("");
    setRefFiles([]);
    setSelectedBlocks([]);
    setSuggestedBlockIds([]);
    setError(null);
    setUsingFallback(false);
    // Note: customClauses / customTemplates / customRulebooks intentionally
    // NOT reset — they belong to the company's library, not the draft session.
  };

  // ── Retry from error ──
  const handleRetry = () => {
    if (draftState === DraftState.ERROR) {
      // Determine what to retry based on where we were
      if (suggestions) {
        setDraftState(DraftState.CONFIGURING);
      } else if (intentText) {
        handleAnalyse(intentText);
      } else {
        setDraftState(DraftState.INTENT_INPUT);
      }
    }
  };

  // ── Derived values ──
  const selectedClauseCount = clauses.filter(c => c.selected).length;
  const isProactive = mode === "proactive";
  const showPipeline = isProactive && stateAtLeast(draftState, DraftState.INTENT_INPUT);

  return (
    <>
      <style>{`
        @keyframes lexSpin { to { transform: rotate(360deg); } }
        @keyframes lexFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes lexPopIn { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes lexPopOut { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.85); } }
        @keyframes lexSlideDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 500px; } }
        .lex-fadein { animation: lexFadeUp .35s ease forwards; }
        .lex-popin { animation: lexPopIn .3s ease-out forwards; }
      `}</style>

      <div style={{ flex: 1, background: T.bg, padding: "36px 36px", overflowY: "auto" }}>

        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: T.black, marginBottom: 4 }}>Draft</h1>
            <p style={{ fontSize: 13, color: T.textMuted }}>Get rapid first drafts in seconds</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {mode && draftState !== DraftState.MODE_SELECTION && (
              <button
                onClick={handleReset}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.borderHov}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, color: T.textSec, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
              >
                ← Change mode
              </button>
            )}
            <button
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, color: T.textSec, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
            >
              🕐 History
            </button>
          </div>
        </div>

        {/* Fallback warning */}
        {usingFallback && <FallbackBanner />}

        <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Pipeline progress (proactive only) */}
          {showPipeline && draftState !== DraftState.COMPLETE && (
            <PipelineProgress draftState={draftState} />
          )}

          {/* ── Mode selection ── */}
          {draftState === DraftState.MODE_SELECTION && (
            <ModeSelector selected={mode} onChange={handleModeSelect} transitioning={modeTransitioning} />
          )}

          {/* ── Reactive drafting flow ── */}
          {mode === "reactive" && stateAtLeast(draftState, DraftState.INTENT_INPUT) && draftState !== DraftState.COMPLETE && (
            <ReactiveDraftPlaceholder />
          )}

          {/* ── Proactive drafting flow ── */}
          {isProactive && (
            <>
              {/* Step 1 — Intent */}
              {stateAtLeast(draftState, DraftState.INTENT_INPUT) && draftState !== DraftState.COMPLETE && (
                <div className="lex-fadein">
                  <StepLabel n="1" label="Describe the document you want to draft" />
                  <DraftIntentInput onSubmit={handleAnalyse} loading={draftState === DraftState.ANALYSING} />
                </div>
              )}

              {/* Analysing spinner */}
              {draftState === DraftState.ANALYSING && (
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "9px 18px", background: T.white, border: `1px solid ${T.border}`, borderRadius: 30 }}>
                    <span style={{ width: 13, height: 13, border: `2px solid ${T.border}`, borderTopColor: T.black, borderRadius: "50%", display: "inline-block", animation: "lexSpin .8s linear infinite" }} />
                    <span style={{ fontSize: 13, color: T.textSec }}>Analysing document intent…</span>
                  </div>
                </div>
              )}

              {/* Error state */}
              {draftState === DraftState.ERROR && error && (
                <ErrorDisplay error={error} onRetry={handleRetry} />
              )}

              {/* Step 2 — AI Suggestions */}
              {suggestions && stateAtLeast(draftState, DraftState.SUGGESTIONS_READY) && draftState !== DraftState.COMPLETE && (
                <div className="lex-fadein">
                  <StepLabel n="2" label="AI recommendations" />
                  <AISuggestionsPanel suggestions={suggestions} />
                </div>
              )}

              {/* Step 3 — Configuration */}
              {suggestions && stateAtLeast(draftState, DraftState.SUGGESTIONS_READY) && draftState !== DraftState.COMPLETE && (
                <div ref={configRef} className="lex-fadein">
                  <StepLabel n="3" label="Review and edit drafting components" />
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <ConfigurationCard title="Template">
                      <TemplateSelector
                        selected={template}
                        onChange={setTemplate}
                        customTemplates={customTemplates}
                        onAddCustom={label => setCustomTemplates(prev => [...prev, label])}
                      />
                    </ConfigurationCard>
                    <ConfigurationCard title="Clauses">
                      <ClauseSelector
                        clauses={clauses}
                        onChange={setClauses}
                        customClauses={customClauses}
                        onAddCustom={label => setCustomClauses(prev => [...prev, label])}
                      />
                    </ConfigurationCard>
                    <ConfigurationCard title="Rulebooks">
                      <RulebookSelector
                        selected={rulebooks}
                        onChange={setRulebooks}
                        customRulebooks={customRulebooks}
                        onAddCustom={label => setCustomRulebooks(prev => [...prev, label])}
                      />
                    </ConfigurationCard>
                    <ConfigurationCard title="Reference Files" defaultOpen={false}>
                      <ReferenceFileIntelligence
                        files={refFiles}
                        selectedBlocks={selectedBlocks}
                        suggestedBlockIds={suggestedBlockIds}
                        onUpload={handleFileUpload}
                        onRemoveFile={handleRemoveFile}
                        onToggleBlock={handleToggleBlock}
                        onSelectAllBlocks={handleSelectAllBlocks}
                        onDeselectAllBlocks={handleDeselectAllBlocks}
                      />
                    </ConfigurationCard>
                    <ConfigurationCard title="Additional Instructions" defaultOpen={false}>
                      <InstructionsEditor value={instructions} onChange={setInstructions} />
                    </ConfigurationCard>
                  </div>
                </div>
              )}

              {/* Step 4 — Generate */}
              {suggestions && stateAtLeast(draftState, DraftState.SUGGESTIONS_READY) && draftState !== DraftState.COMPLETE && draftState !== DraftState.ERROR && (
                <div className="lex-fadein">
                  <StepLabel n="4" label="Generate your draft" />
                  <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 16 }}>
                    {[
                      { label: "Template",   value: template || "None" },
                      { label: "Clauses",    value: `${selectedClauseCount} selected` },
                      { label: "Rulebooks",  value: rulebooks.length > 0 ? rulebooks.join(", ") : "None" },
                      { label: "Ref. Files", value: refFiles.length > 0 ? `${refFiles.length} file(s), ${selectedBlocks.length} block(s)` : "None" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 12.5, color: T.black, fontWeight: 500 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={draftState === DraftState.GENERATING}
                    onMouseEnter={e => { if (draftState !== DraftState.GENERATING) e.currentTarget.style.background = T.blackHov; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.black; }}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 24px", borderRadius: 10, border: "none", background: T.black, color: "white", fontSize: 14, fontWeight: 700, cursor: draftState === DraftState.GENERATING ? "default" : "pointer", transition: "background .2s", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                  >
                    {draftState === DraftState.GENERATING ? (
                      <>
                        <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.35)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "lexSpin .7s linear infinite" }} />
                        Generating Draft…
                      </>
                    ) : (
                      <><SparkIcon /> Generate Draft</>
                    )}
                  </button>
                </div>
              )}

              {/* Generated output */}
              {draftState === DraftState.COMPLETE && draftData && (
                <div className="lex-fadein">
                  <GeneratedDraftView draftData={draftData} onReset={handleReset} />
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}
