import { useState, useRef } from "react";

// ─── Mock AI suggestion data ───────────────────────────────────────────────

const MOCK_SUGGESTIONS = {
  documentType: "Vendor Agreement",
  confidence: 94,
  clauses: [
    { id: "c1", label: "Confidentiality",         selected: true  },
    { id: "c2", label: "Indemnity",                selected: true  },
    { id: "c3", label: "Limitation of Liability",  selected: true  },
    { id: "c4", label: "Arbitration",              selected: true  },
    { id: "c5", label: "Governing Law",            selected: true  },
    { id: "c6", label: "Payment Terms",            selected: false },
    { id: "c7", label: "Intellectual Property",    selected: false },
    { id: "c8", label: "Force Majeure",            selected: false },
  ],
  template: "Vendor Service Agreement",
  rulebook: "Corporate Contract Policy",
};

const ALL_CLAUSES = [
  "Confidentiality", "Indemnity", "Limitation of Liability", "Arbitration",
  "Governing Law", "Payment Terms", "Intellectual Property", "Force Majeure",
  "Non-Compete", "Representations & Warranties", "Termination", "Assignment",
  "Entire Agreement", "Severability", "Notice", "Waiver",
];

const ALL_TEMPLATES = [
  "Vendor Service Agreement", "Non-Disclosure Agreement", "Employment Agreement",
  "Shareholder Agreement", "Lease Agreement", "Consulting Agreement",
  "Software License Agreement", "Partnership Agreement",
];

const ALL_RULEBOOKS = [
  "Corporate Contract Policy", "Standard Legal Guidelines", "GDPR Compliance Rules",
  "Arbitration-First Policy", "Indian Contract Act Compliance", "ISO Legal Standards",
];

// ─── Design tokens (matches existing Lexlegis palette) ───────────────────

const T = {
  bg:        "#ffffff",
  white:     "#ffffff",
  border:    "#eae6e0",
  borderHov: "#c8c4be",
  activeBg:  "#f4f1ec",
  navy:      "#111111",
  navyHov:   "#111111",
  text:      "#111111",
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
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="18 15 12 9 6 15"/></svg>
);
const ChevDn = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
);
const CheckIco = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
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
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.textSec} strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);
const XIco = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

// ─── Shared: SearchInput ──────────────────────────────────────────────────

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", marginBottom: 10 }}>
      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><SearchIco /></span>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "8px 10px 8px 30px",
          border: `1px solid ${T.border}`, borderRadius: 8,
          fontSize: 13, color: T.text, outline: "none",
          boxSizing: "border-box", background: T.bg, fontFamily: "inherit",
        }}
      />
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
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "13px 18px", background: "none", border: "none",
          cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{title}</span>
        <span style={{ color: T.textMuted }}>{open ? <ChevUp /> : <ChevDn />}</span>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: "14px 18px" }}>{children}</div>
      )}
    </div>
  );
}

// ─── StepLabel ────────────────────────────────────────────────────────────

function StepLabel({ n, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.navy, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{n}</div>
      <span style={{ fontSize: 13, fontWeight: 600, color: T.textSec }}>{label}</span>
    </div>
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
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: T.navy, padding: "12px 18px", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "white" }}><SparkIcon /></span>
        <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>AI Draft Intelligence</span>
      </div>

      <div style={{ padding: "18px 18px 10px" }}>
        <textarea
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && value.trim()) onSubmit(value.trim()); }}
          placeholder={"Describe the legal document you want to create…\n\ne.g. Draft a Non-Disclosure Agreement between a startup and an investor."}
          style={{
            width: "100%", minHeight: 100, border: "none", outline: "none",
            resize: "none", fontSize: 14, lineHeight: 1.7, color: T.text,
            background: "transparent", fontFamily: "inherit", boxSizing: "border-box",
          }}
        />
      </div>

      {/* example pills */}
      <div style={{ padding: "0 18px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
        {examples.map((ex, i) => (
          <button key={i} onClick={() => setValue(ex)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.navy; e.currentTarget.style.color = T.navy; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textSec; }}
            style={{ fontSize: 11.5, padding: "3px 10px", borderRadius: 20, border: `1px solid ${T.border}`, background: T.bg, color: T.textSec, cursor: "pointer", transition: "all .15s", fontFamily: "inherit" }}
          >
            {ex.length > 54 ? ex.slice(0, 54) + "…" : ex}
          </button>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", background: T.bg }}>
        <span style={{ fontSize: 11.5, color: T.textLight }}>⌘ Enter to analyse</span>
        <button
          onClick={() => value.trim() && !loading && onSubmit(value.trim())}
          disabled={!value.trim() || loading}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: value.trim() && !loading ? T.navy : "#d1d5db",
            color: "white", border: "none", borderRadius: 8, padding: "8px 16px",
            fontSize: 13, fontWeight: 600, cursor: value.trim() && !loading ? "pointer" : "default",
            transition: "background .2s", fontFamily: "inherit",
          }}
        >
          {loading
            ? <><span style={{ width: 12, height: 12, border: "2px solid rgba(255,255,255,.35)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "lexSpin .7s linear infinite" }} /> Analysing…</>
            : <><SparkIcon /> Analyse</>
          }
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
        <span style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>AI Analysis</span>
        <div style={{ flex: 1, height: 1, background: T.border }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
        {/* Doc type */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Detected Type</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.navy }}>{suggestions.documentType}</div>
          <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "2px 8px" }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#16a34a" }}>{suggestions.confidence}% confidence</span>
          </div>
        </div>

        {/* Clauses */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>Recommended Clauses</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {suggestions.clauses.filter(c => c.selected).map(c => (
              <span key={c.id} style={{ fontSize: 11.5, padding: "2px 8px", borderRadius: 10, background: T.activeBg, color: T.navy, border: `1px solid ${T.border}`, fontWeight: 500 }}>
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Template */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Suggested Template</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{suggestions.template}</div>
          <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2 }}>Lexlegis Template Library</div>
        </div>

        {/* Rulebook */}
        <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>Suggested Rulebook</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{suggestions.rulebook}</div>
          <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 2 }}>Applied automatically</div>
        </div>
      </div>
    </div>
  );
}

// ─── ClauseSelector ──────────────────────────────────────────────────────

function ClauseSelector({ clauses, onChange }) {
  const [q, setQ] = useState("");
  const selected = clauses.filter(c => c.selected).map(c => c.label);
  const all = [...new Set([...clauses.map(c => c.label), ...ALL_CLAUSES])];
  const filtered = all.filter(l => l.toLowerCase().includes(q.toLowerCase()));

  const toggle = (label) => {
    const existing = clauses.find(c => c.label === label);
    if (existing) onChange(clauses.map(c => c.label === label ? { ...c, selected: !c.selected } : c));
    else onChange([...clauses, { id: `cx-${Date.now()}`, label, selected: true }]);
  };

  return (
    <div>
      <SearchInput value={q} onChange={setQ} placeholder="Search clauses…" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {filtered.map(label => {
          const on = selected.includes(label);
          return (
            <button key={label} onClick={() => toggle(label)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 20, fontSize: 12.5, fontWeight: 500, border: `1px solid ${on ? T.navy : T.border}`, background: on ? T.navy : T.white, color: on ? "white" : T.textSec, cursor: "pointer", transition: "all .15s", fontFamily: "inherit" }}
            >
              {on && <CheckIco />}{label}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && <div style={{ marginTop: 8, fontSize: 12, color: T.textMuted }}>{selected.length} clause{selected.length !== 1 ? "s" : ""} selected</div>}
    </div>
  );
}

// ─── TemplateSelector ────────────────────────────────────────────────────

function TemplateSelector({ selected, onChange }) {
  const [q, setQ] = useState("");
  const filtered = ALL_TEMPLATES.filter(t => t.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <SearchInput value={q} onChange={setQ} placeholder="Search templates…" />
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {filtered.map(t => {
          const on = selected === t;
          return (
            <label key={t} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, cursor: "pointer", border: `1px solid ${on ? T.navy : T.border}`, background: on ? T.activeBg : T.white, transition: "all .15s" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", flexShrink: 0, border: `2px solid ${on ? T.navy : T.borderHov}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {on && <div style={{ width: 7, height: 7, borderRadius: "50%", background: T.navy }} />}
              </div>
              <span style={{ fontSize: 13, color: T.text, fontWeight: on ? 600 : 400 }}>{t}</span>
              <input type="radio" checked={on} onChange={() => onChange(t)} style={{ display: "none" }} />
            </label>
          );
        })}
      </div>
    </div>
  );
}

// ─── RulebookSelector ────────────────────────────────────────────────────

function RulebookSelector({ selected, onChange }) {
  const [q, setQ] = useState("");
  const filtered = ALL_RULEBOOKS.filter(r => r.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <SearchInput value={q} onChange={setQ} placeholder="Search rulebooks…" />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {filtered.map(r => {
          const on = selected.includes(r);
          return (
            <button key={r} onClick={() => onChange(on ? selected.filter(x => x !== r) : [...selected, r])}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 500, border: `1px solid ${on ? T.navy : T.border}`, background: on ? T.navy : T.white, color: on ? "white" : T.textSec, cursor: "pointer", transition: "all .15s", fontFamily: "inherit" }}
            >
              {on && <CheckIco />}{r}
            </button>
          );
        })}
      </div>
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
      <div onDragOver={e => e.preventDefault()} onDrop={handleDrop} onClick={() => inputRef.current?.click()}
        style={{ border: `2px dashed ${T.border}`, borderRadius: 10, padding: "22px", textAlign: "center", background: T.bg, cursor: "pointer" }}>
        <div style={{ marginBottom: 6 }}><UploadIco /></div>
        <div style={{ fontSize: 13, color: T.textSec }}>Drop files here or <span style={{ color: T.navy, textDecoration: "underline" }}>browse</span></div>
        <div style={{ fontSize: 11.5, color: T.textMuted, marginTop: 4 }}>PDF, DOCX, TXT supported</div>
        <input ref={inputRef} type="file" multiple onChange={handlePick} style={{ display: "none" }} />
      </div>
      {files.length > 0 && (
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
          {files.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><FileIco /><span style={{ fontSize: 13, color: T.text }}>{f.name}</span></div>
              <button onClick={() => onChange(files.filter((_, idx) => idx !== i))} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 2 }}><XIco /></button>
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
      style={{ width: "100%", minHeight: 90, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13.5, lineHeight: 1.65, color: T.text, resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box", background: T.bg }}
    />
  );
}

// ─── GeneratedDraftView ───────────────────────────────────────────────────

function GeneratedDraftView({ docType, onReset }) {
  const sections = [
    { title: "PARTIES",               body: `This ${docType} ("Agreement") is entered into by and between [Party A], a company incorporated under the laws of India, having its registered office at [Address] ("Client"), and [Party B], a company incorporated under the laws of India, having its registered office at [Address] ("Vendor").` },
    { title: "SCOPE OF SERVICES",     body: "The Vendor agrees to provide the services detailed in Schedule A. The Vendor shall perform such services in a professional manner consistent with industry standards." },
    { title: "CONFIDENTIALITY",       body: "Each party agrees to keep confidential all information disclosed by the other party that is marked as confidential or that reasonably should be understood to be confidential. This obligation shall survive termination for three (3) years." },
    { title: "INDEMNITY",             body: "Each party shall indemnify and hold harmless the other party and its officers, directors, employees and agents from any claims, damages, losses, costs and expenses arising out of or relating to that party's breach of this Agreement." },
    { title: "LIMITATION OF LIABILITY", body: "In no event shall either party's aggregate liability exceed the total fees paid under this Agreement during the twelve (12) months preceding the event giving rise to the claim." },
    { title: "GOVERNING LAW",         body: "This Agreement shall be governed by the laws of India. Any dispute arising hereunder shall be subject to the exclusive jurisdiction of the courts in [City], India." },
  ];

  return (
    <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ background: T.navy, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{docType}</div>
          <div style={{ color: "rgba(255,255,255,.5)", fontSize: 12, marginTop: 2 }}>
            Draft generated · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["Edit", "Export"].map(label => (
            <button key={label} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,.25)", background: "rgba(255,255,255,.1)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "28px 32px", maxHeight: 440, overflowY: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 11.5, color: T.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Draft Document</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text }}>{docType}</div>
          <div style={{ fontSize: 13, color: T.textSec, marginTop: 4 }}>This Agreement is entered into as of [Date]</div>
        </div>
        {sections.map((s, i) => (
          <div key={i} style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: T.navy, marginBottom: 8, paddingBottom: 6, borderBottom: `1px solid ${T.border}` }}>{i + 1}. {s.title}</div>
            <div style={{ fontSize: 13.5, lineHeight: 1.8, color: T.textSec }}>{s.body}</div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${T.border}`, padding: "11px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: T.bg }}>
        <span style={{ fontSize: 12, color: T.textMuted }}>Preview only — review carefully before use</span>
        <button onClick={onReset} style={{ fontSize: 12, color: T.navy, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textDecoration: "underline" }}>Start new draft</button>
      </div>
    </div>
  );
}

// ─── DraftPage ────────────────────────────────────────────────────────────

export default function DraftPage() {
  const [analysing,    setAnalysing]    = useState(false);
  const [suggestions,  setSuggestions]  = useState(null);
  const [clauses,      setClauses]      = useState([]);
  const [template,     setTemplate]     = useState("");
  const [rulebooks,    setRulebooks]    = useState([]);
  const [refFiles,     setRefFiles]     = useState([]);
  const [instructions, setInstructions] = useState("");
  const [generating,   setGenerating]   = useState(false);
  const [generated,    setGenerated]    = useState(false);
  const configRef = useRef(null);

  const handleAnalyse = () => {
    setAnalysing(true);
    // TODO: replace with real AI endpoint call
    setTimeout(() => {
      setSuggestions(MOCK_SUGGESTIONS);
      setClauses(MOCK_SUGGESTIONS.clauses);
      setTemplate(MOCK_SUGGESTIONS.template);
      setRulebooks([MOCK_SUGGESTIONS.rulebook]);
      setAnalysing(false);
      setTimeout(() => configRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 200);
    }, 1800);
  };

  const handleGenerate = () => {
    setGenerating(true);
    // TODO: replace with real draft generation endpoint
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2000);
  };

  const handleReset = () => {
    setSuggestions(null); setClauses([]); setTemplate(""); setRulebooks([]);
    setRefFiles([]); setInstructions(""); setGenerated(false);
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
            <h1 style={{ fontSize: 24, fontWeight: 700, color: T.text, marginBottom: 4 }}>Draft</h1>
            <p style={{ fontSize: 13, color: T.textMuted }}>Generate first drafts intelligently</p>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.white, color: T.textSec, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            🕐 History
          </button>
        </div>

        <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Step 1 — Intent */}
          {!generated && (
            <div>
              <StepLabel n="1" label="Describe the document you want to draft" />
              <DraftIntentInput onSubmit={handleAnalyse} loading={analysing} />
            </div>
          )}

          {/* Analysing indicator */}
          {analysing && (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "9px 18px", background: T.white, border: `1px solid ${T.border}`, borderRadius: 30 }}>
                <span style={{ width: 13, height: 13, border: `2px solid ${T.border}`, borderTopColor: T.navy, borderRadius: "50%", display: "inline-block", animation: "lexSpin .8s linear infinite" }} />
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
                  <TemplateSelector selected={template} onChange={setTemplate} />
                </ConfigurationCard>
                <ConfigurationCard title="Clauses">
                  <ClauseSelector clauses={clauses} onChange={setClauses} />
                </ConfigurationCard>
                <ConfigurationCard title="Rulebooks">
                  <RulebookSelector selected={rulebooks} onChange={setRulebooks} />
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

              {/* summary strip */}
              <div style={{ background: T.white, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 16 }}>
                {[
                  { label: "Template",   value: template || "None" },
                  { label: "Clauses",    value: `${selectedClauseCount} selected` },
                  { label: "Rulebooks",  value: rulebooks.length > 0 ? rulebooks.join(", ") : "None" },
                  { label: "Ref. Files", value: refFiles.length > 0 ? `${refFiles.length} file(s)` : "None" },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 12.5, color: T.text, fontWeight: 500 }}>{value}</div>
                  </div>
                ))}
              </div>

              <button
                onClick={handleGenerate}
                disabled={generating}
                onMouseEnter={e => !generating && (e.currentTarget.style.background = T.navyHov)}
                onMouseLeave={e => (e.currentTarget.style.background = T.navy)}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px 24px", borderRadius: 10, border: "none", background: T.navy, color: "white", fontSize: 14, fontWeight: 700, cursor: generating ? "default" : "pointer", transition: "background .2s", fontFamily: "inherit", boxShadow: "0 2px 10px rgba(28,37,54,.2)" }}
              >
                {generating
                  ? <><span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,.35)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "lexSpin .7s linear infinite" }} /> Generating Draft…</>
                  : <><SparkIcon /> Generate Draft</>
                }
              </button>
            </div>
          )}

          {/* Generated output */}
          {generated && (
            <div className="lex-fadein">
              <GeneratedDraftView docType={suggestions?.documentType || "Legal Agreement"} onReset={handleReset} />
            </div>
          )}

        </div>
      </div>
    </>
  );
}