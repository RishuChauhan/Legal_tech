import { useState, useRef } from "react";

// ─── Mock AI suggestion data ──────────────────────────────────────────────
// TODO: Replace handleAnalyse / handleGenerate timeouts with real API calls

const MOCK_SUGGESTIONS = {
  documentType: "Vendor Agreement",
  confidence: 94,
  clauses: [
    { id: "c1", label: "Confidentiality",        selected: true  },
    { id: "c2", label: "Indemnity",               selected: true  },
    { id: "c3", label: "Limitation of Liability", selected: true  },
    { id: "c4", label: "Arbitration",             selected: true  },
    { id: "c5", label: "Governing Law",           selected: true  },
    { id: "c6", label: "Payment Terms",           selected: false },
    { id: "c7", label: "Intellectual Property",   selected: false },
    { id: "c8", label: "Force Majeure",           selected: false },
  ],
  template: "Vendor Service Agreement",
  rulebook: "Corporate Contract Policy",
};

// ─── Default library data (Lexlegis built-in) ─────────────────────────────

const DEFAULT_CLAUSES = [
  "Confidentiality", "Indemnity", "Limitation of Liability", "Arbitration",
  "Governing Law", "Payment Terms", "Intellectual Property", "Force Majeure",
  "Non-Compete", "Representations & Warranties", "Termination", "Assignment",
  "Entire Agreement", "Severability", "Notice", "Waiver",
];

const DEFAULT_TEMPLATES = [
  "Vendor Service Agreement", "Non-Disclosure Agreement", "Employment Agreement",
  "Shareholder Agreement", "Lease Agreement", "Consulting Agreement",
  "Software License Agreement", "Partnership Agreement",
];

const DEFAULT_RULEBOOKS = [
  "Corporate Contract Policy", "Standard Legal Guidelines", "GDPR Compliance Rules",
  "Arbitration-First Policy", "Indian Contract Act Compliance", "ISO Legal Standards",
];

// ─── Design tokens — matches existing Lexlegis app exactly ───────────────

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

// ─── SVG icons ────────────────────────────────────────────────────────────

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

// ─── Shared: SearchInput ──────────────────────────────────────────────────

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

// ─── Shared: AddCustomRow — inline input to add a new item to any library ─

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

// ─── Shared: ConfigurationCard ────────────────────────────────────────────

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

// ─── StepLabel ────────────────────────────────────────────────────────────

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

// ─── LibraryBadge — "Lexlegis" vs "Custom" tag ───────────────────────────

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

// ─── DraftIntentInput ─────────────────────────────────────────────────────

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

// ─── AISuggestionsPanel ───────────────────────────────────────────────────

function AISuggestionsPanel({ suggestions }) {
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
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Detected Type</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.black }}>{suggestions.documentType}</div>
          <div style={{ marginTop: 6, display: "inline-flex", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "2px 8px" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a" }}>{suggestions.confidence}% confidence</span>
          </div>
        </div>

        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Recommended Clauses</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {suggestions.clauses.filter(c => c.selected).map(c => (
              <span key={c.id} style={{ fontSize: 11.5, padding: "2px 8px", borderRadius: 10, background: T.activeBg, color: T.black, border: `1px solid ${T.border}`, fontWeight: 500 }}>
                {c.label}
              </span>
            ))}
          </div>
        </div>

        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Suggested Template</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.black }}>{suggestions.template}</div>
          <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2 }}>Lexlegis Template Library</div>
        </div>

        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Suggested Rulebook</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.black }}>{suggestions.rulebook}</div>
          <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2 }}>Applied automatically</div>
        </div>
      </div>
    </div>
  );
}

// ─── ClauseSelector ──────────────────────────────────────────────────────
// Shows Lexlegis library + user-added custom clauses, with + Add clause row

function ClauseSelector({ clauses, onChange, customClauses, onAddCustom }) {
  const [q, setQ] = useState("");
  const selected = clauses.filter(c => c.selected).map(c => c.label);

  // Merge default library + any custom clauses added by the company
  const allLabels = [...new Set([...DEFAULT_CLAUSES, ...customClauses, ...clauses.map(c => c.label)])];
  const filtered = allLabels.filter(l => l.toLowerCase().includes(q.toLowerCase()));

  const toggle = (label) => {
    const existing = clauses.find(c => c.label === label);
    if (existing) {
      onChange(clauses.map(c => c.label === label ? { ...c, selected: !c.selected } : c));
    } else {
      onChange([...clauses, { id: `cx-${Date.now()}`, label, selected: true }]);
    }
  };

  const handleAddCustom = (label) => {
    if (allLabels.includes(label)) return; // already exists
    onAddCustom(label);
    // Auto-select the newly added clause
    onChange([...clauses, { id: `cx-${Date.now()}`, label, selected: true }]);
  };

  return (
    <div>
      <SearchInput value={q} onChange={setQ} placeholder="Search clauses…" />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
        {filtered.map(label => {
          const on = selected.includes(label);
          const isCustom = customClauses.includes(label) && !DEFAULT_CLAUSES.includes(label);
          return (
            <button
              key={label}
              onClick={() => toggle(label)}
              onMouseEnter={e => { if (!on) { e.currentTarget.style.borderColor = T.borderHov; e.currentTarget.style.color = T.black; } }}
              onMouseLeave={e => { if (!on) { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSec; } }}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "5px 11px", borderRadius: 20, fontSize: 12.5, fontWeight: 500,
                border: `1px solid ${on ? T.black : T.border}`,
                background: on ? T.black : T.white,
                color: on ? "white" : T.textSec,
                cursor: "pointer", transition: "all .15s", fontFamily: "inherit",
              }}
            >
              {on && <CheckIco />}
              {label}
              {isCustom && !on && (
                <span style={{ fontSize: 9.5, fontWeight: 700, padding: "0px 4px", borderRadius: 4, background: "#fefce8", border: "1px solid #fde68a", color: "#92400e", marginLeft: 2 }}>
                  Custom
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div style={{ marginTop: 8, fontSize: 12, color: T.textMuted }}>
          {selected.length} clause{selected.length !== 1 ? "s" : ""} selected
        </div>
      )}

      <AddCustomRow
        placeholder="Add a clause from your company library…"
        onAdd={handleAddCustom}
      />
    </div>
  );
}

// ─── TemplateSelector ────────────────────────────────────────────────────
// Shows Lexlegis templates + custom company templates, with + Add row

function TemplateSelector({ selected, onChange, customTemplates, onAddCustom }) {
  const [q, setQ] = useState("");
  const all = [...new Set([...DEFAULT_TEMPLATES, ...customTemplates])];
  const filtered = all.filter(t => t.toLowerCase().includes(q.toLowerCase()));

  const handleAddCustom = (label) => {
    if (all.includes(label)) return;
    onAddCustom(label);
    onChange(label); // auto-select the new template
  };

  return (
    <div>
      <SearchInput value={q} onChange={setQ} placeholder="Search templates…" />

      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
        {filtered.map(t => {
          const on = selected === t;
          const isCustom = customTemplates.includes(t) && !DEFAULT_TEMPLATES.includes(t);
          return (
            <label
              key={t}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${on ? T.black : T.border}`,
                background: on ? T.activeBg : T.white,
                transition: "all .15s",
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${on ? T.black : T.borderHov}`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {on && <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.black }} />}
              </div>
              <span style={{ flex: 1, fontSize: 13, color: T.black, fontWeight: on ? 600 : 400 }}>{t}</span>
              <LibraryBadge custom={isCustom} />
              <input type="radio" checked={on} onChange={() => onChange(t)} style={{ display: "none" }} />
            </label>
          );
        })}
      </div>

      <AddCustomRow
        placeholder="Add a template from your company library…"
        onAdd={handleAddCustom}
      />
    </div>
  );
}

// ─── RulebookSelector ────────────────────────────────────────────────────
// Shows Lexlegis rulebooks + custom company rulebooks, with + Add row

function RulebookSelector({ selected, onChange, customRulebooks, onAddCustom }) {
  const [q, setQ] = useState("");
  const all = [...new Set([...DEFAULT_RULEBOOKS, ...customRulebooks])];
  const filtered = all.filter(r => r.toLowerCase().includes(q.toLowerCase()));

  const handleAddCustom = (label) => {
    if (all.includes(label)) return;
    onAddCustom(label);
    onChange([...selected, label]); // auto-select the new rulebook
  };

  return (
    <div>
      <SearchInput value={q} onChange={setQ} placeholder="Search rulebooks…" />

      <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 10 }}>
        {filtered.map(r => {
          const on = selected.includes(r);
          const isCustom = customRulebooks.includes(r) && !DEFAULT_RULEBOOKS.includes(r);
          return (
            <label
              key={r}
              onClick={() => onChange(on ? selected.filter(x => x !== r) : [...selected, r])}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${on ? T.black : T.border}`,
                background: on ? T.activeBg : T.white,
                transition: "all .15s",
              }}
            >
              {/* Checkbox style */}
              <div style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                border: `2px solid ${on ? T.black : T.borderHov}`,
                background: on ? T.black : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {on && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
              </div>
              <span style={{ flex: 1, fontSize: 13, color: T.black, fontWeight: on ? 600 : 400 }}>{r}</span>
              <LibraryBadge custom={isCustom} />
            </label>
          );
        })}
      </div>

      <AddCustomRow
        placeholder="Add a rulebook from your company policy library…"
        onAdd={handleAddCustom}
      />
    </div>
  );
}

// ─── ReferenceFilesSelector ───────────────────────────────────────────────

function ReferenceFilesSelector({ files, onChange }) {
  const inputRef = useRef(null);
  const handleDrop = (e) => { e.preventDefault(); onChange([...files, ...Array.from(e.dataTransfer.files).map(f => ({ name: f.name }))]); };
  const handlePick = (e) => { onChange([...files, ...Array.from(e.target.files).map(f => ({ name: f.name }))]); };

  return (
    <div>
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
          Drop files here or <span style={{ color: T.black, textDecoration: "underline" }}>browse</span>
        </div>
        <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 4 }}>PDF, DOCX, TXT supported</div>
        <input ref={inputRef} type="file" multiple onChange={handlePick} style={{ display: "none" }} />
      </div>

      {files.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><FileIco /><span style={{ fontSize: 13, color: T.black }}>{f.name}</span></div>
              <button onClick={() => onChange(files.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 2 }}>
                <XIco />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── InstructionsEditor ──────────────────────────────────────────────────

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

// ─── GeneratedDraftView ───────────────────────────────────────────────────

function GeneratedDraftView({ docType, onReset }) {
  const sections = [
    { title: "PARTIES",                body: `This ${docType} ("Agreement") is entered into by and between [Party A], a company incorporated under the laws of India, having its registered office at [Address] ("Client"), and [Party B], a company incorporated under the laws of India, having its registered office at [Address] ("Vendor").` },
    { title: "SCOPE OF SERVICES",      body: "The Vendor agrees to provide the services detailed in Schedule A. The Vendor shall perform such services in a professional manner consistent with industry standards." },
    { title: "CONFIDENTIALITY",        body: "Each party agrees to keep confidential all information disclosed by the other party that is marked as confidential or that reasonably should be understood to be confidential. This obligation shall survive termination for three (3) years." },
    { title: "INDEMNITY",              body: "Each party shall indemnify and hold harmless the other party and its officers, directors, employees and agents from any claims, damages, losses, costs and expenses arising out of or relating to that party's breach of this Agreement." },
    { title: "LIMITATION OF LIABILITY", body: "In no event shall either party's aggregate liability exceed the total fees paid under this Agreement during the twelve (12) months preceding the event giving rise to the claim." },
    { title: "GOVERNING LAW",          body: "This Agreement shall be governed by the laws of India. Any dispute arising hereunder shall be subject to the exclusive jurisdiction of the courts in [City], India." },
  ];

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ background: T.black, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{docType}</div>
          <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12, marginTop: 2 }}>
            Draft generated · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
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
          <div style={{ fontSize: 20, fontWeight: 700, color: T.black }}>{docType}</div>
        </div>
        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: T.black, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${T.border}` }}>
              {i + 1}. {s.title}
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.8, color: T.textSec }}>{s.body}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, padding: "11px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: T.bg }}>
        <span style={{ fontSize: 12, color: T.textMuted }}>Preview only — review carefully before use</span>
        <button onClick={onReset} style={{ fontSize: 12, color: T.black, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>
          Start new draft
        </button>
      </div>
    </div>
  );
}

// ─── ModeSelector ─────────────────────────────────────────────────────────

function ModeSelector({ selected, onChange }) {
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
          return (
            <div
              key={m.id}
              onClick={() => onChange(m.id)}
              onMouseEnter={e => { if (!on) e.currentTarget.style.borderColor = T.borderHov; }}
              onMouseLeave={e => { if (!on) e.currentTarget.style.borderColor = T.border; }}
              style={{
                padding: "18px 20px", borderRadius: 10, cursor: "pointer",
                border: `1px solid ${on ? T.black : T.border}`,
                background: on ? T.activeBg : T.white,
                transition: "all .15s",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                {/* Radio circle */}
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

// ─── ReactiveDraftPlaceholder ─────────────────────────────────────────────

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
      {/* Upload source document */}
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

      {/* Response instructions */}
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

      {/* CTA */}
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

// ─── DraftPage ────────────────────────────────────────────────────────────

export default function DraftPage() {
  // Mode selection — null means not yet chosen
  const [mode, setMode] = useState(null);

  // AI state
  const [analysing,    setAnalysing]    = useState(false);
  const [suggestions,  setSuggestions]  = useState(null);
  const [generating,   setGenerating]   = useState(false);
  const [generated,    setGenerated]    = useState(false);

  // Draft config state
  const [clauses,      setClauses]      = useState([]);
  const [template,     setTemplate]     = useState("");
  const [rulebooks,    setRulebooks]    = useState([]);
  const [refFiles,     setRefFiles]     = useState([]);
  const [instructions, setInstructions] = useState("");

  // Company custom library state (persists across draft sessions)
  const [customClauses,    setCustomClauses]    = useState([]);
  const [customTemplates,  setCustomTemplates]  = useState([]);
  const [customRulebooks,  setCustomRulebooks]  = useState([]);

  const configRef = useRef(null);

  // TODO: Replace with real AI endpoint call
  const handleAnalyse = (text) => {
    setAnalysing(true);
    setTimeout(() => {
      setSuggestions(MOCK_SUGGESTIONS);
      setClauses(MOCK_SUGGESTIONS.clauses);
      setTemplate(MOCK_SUGGESTIONS.template);
      setRulebooks([MOCK_SUGGESTIONS.rulebook]);
      setAnalysing(false);
      setTimeout(() => configRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    }, 1600);
  };

  // TODO: Replace with real draft generation endpoint
  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1800);
  };

  const handleReset = () => {
    setMode(null);
    setSuggestions(null); setClauses([]); setTemplate(""); setRulebooks([]);
    setRefFiles([]); setInstructions(""); setGenerated(false);
    // Note: customClauses / customTemplates / customRulebooks intentionally
    // NOT reset — they belong to the company's library, not the draft session.
  };

  const selectedClauseCount = clauses.filter(c => c.selected).length;

  return (
    <>
      <style>{`
        @keyframes lexSpin { to { transform: rotate(360deg); } }
        @keyframes lexFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .lex-fadein { animation: lexFadeUp .35s ease forwards; }
      `}</style>

      <div style={{ flex: 1, background: T.bg, padding: "36px 36px", overflowY: "auto" }}>

        {/* Page header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 600, color: T.black, marginBottom: 4 }}>Draft</h1>
            <p style={{ fontSize: 13, color: T.textMuted }}>Get rapid first drafts in seconds</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {mode && (
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

        <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 24 }}>

          {/* ── Mode selection (always visible until a mode is confirmed) ── */}
          {!generated && (
            <ModeSelector selected={mode} onChange={setMode} />
          )}

          {/* ── Reactive drafting flow ── */}
          {mode === "reactive" && !generated && (
            <ReactiveDraftPlaceholder />
          )}

          {/* ── Proactive drafting flow ── */}
          {mode === "proactive" && (
            <>
              {/* Step 1 — Intent */}
              {!generated && (
                <div className="lex-fadein">
                  <StepLabel n="1" label="Describe the document you want to draft" />
                  <DraftIntentInput onSubmit={handleAnalyse} loading={analysing} />
                </div>
              )}

              {/* Analysing spinner */}
              {analysing && (
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "9px 18px", background: T.white, border: `1px solid ${T.border}`, borderRadius: 30 }}>
                    <span style={{ width: 13, height: 13, border: `2px solid ${T.border}`, borderTopColor: T.black, borderRadius: "50%", display: "inline-block", animation: "lexSpin .8s linear infinite" }} />
                    <span style={{ fontSize: 13, color: T.textSec }}>Analysing document intent…</span>
                  </div>
                </div>
              )}

              {/* Step 2 — AI Suggestions */}
              {suggestions && !generated && (
                <div className="lex-fadein">
                  <StepLabel n="2" label="AI recommendations" />
                  <AISuggestionsPanel suggestions={suggestions} />
                </div>
              )}

              {/* Step 3 — Configuration */}
              {suggestions && !generated && (
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
                      <ReferenceFilesSelector files={refFiles} onChange={setRefFiles} />
                    </ConfigurationCard>
                    <ConfigurationCard title="Additional Instructions" defaultOpen={false}>
                      <InstructionsEditor value={instructions} onChange={setInstructions} />
                    </ConfigurationCard>
                  </div>
                </div>
              )}

              {/* Step 4 — Generate */}
              {suggestions && !generated && (
                <div className="lex-fadein">
                  <StepLabel n="4" label="Generate your draft" />
                  <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 16 }}>
                    {[
                      { label: "Template",   value: template || "None" },
                      { label: "Clauses",    value: `${selectedClauseCount} selected` },
                      { label: "Rulebooks",  value: rulebooks.length > 0 ? rulebooks.join(", ") : "None" },
                      { label: "Ref. Files", value: refFiles.length > 0 ? `${refFiles.length} file(s)` : "None" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div style={{ fontSize: 10.5, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 12.5, color: T.black, fontWeight: 500 }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    onMouseEnter={e => { if (!generating) e.currentTarget.style.background = T.blackHov; }}
                    onMouseLeave={e => { e.currentTarget.style.background = T.black; }}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 24px", borderRadius: 10, border: "none", background: T.black, color: "white", fontSize: 14, fontWeight: 700, cursor: generating ? "default" : "pointer", transition: "background .2s", fontFamily: "inherit", boxShadow: "0 2px 8px rgba(0,0,0,0.15)" }}
                  >
                    {generating ? (
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
              {generated && (
                <div className="lex-fadein">
                  <GeneratedDraftView
                    docType={suggestions?.documentType || "Legal Document"}
                    onReset={handleReset}
                  />
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </>
  );
}