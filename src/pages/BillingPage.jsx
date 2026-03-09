import { useState } from "react";

/* ─── Single shared hover accent ─────────────────────────────────────────── */
const ACCENT = {
  border:  "#1c2536",
  bg:      "#f7f8fa",
  glow:    "rgba(28, 37, 54, 0.10)",
  text:    "#1c2536",
  btnBg:   "#1c2536",
  check:   "#1c2536",
};

/* ─── Plan data ───────────────────────────────────────────────────────────── */
const proFeatures = [
  { text: "Includes ASK, INTERACT, & DRAFT modules" },
  { text: "300 Legal Queries & Drafting Prompts / month" },
  { text: "Securely store up to 50 case files or contracts" },
  { text: "Cross-reference up to 25 documents at once", tooltip: "Compare multiple contracts or case files in a single click" },
  { text: "Priority email & chat support" },
];

const entFeatures = [
  { text: "Full access to 14M+ Shepardised legal documents" },
  { text: "Unlimited secure client file uploads via INTERACT" },
  { text: "Includes 5 Team Member Licenses (expandable)" },
  { text: "Private Cloud or Air-gapped deployment available" },
  { text: "Zero data retention — client files never on shared servers" },
  { text: "Dedicated onboarding & team training" },
];

const plans = {
  professional: {
    annual:  { price: "₹86,400", period: "/year", original: "₹1,08,000", savings: "₹21,600", equiv: "₹7,200 / month" },
    monthly: { price: "₹9,000",  period: "/month" },
  },
  enterprise: {
    annual:  { price: "₹1,65,600", period: "/year", original: "₹2,07,000", savings: "₹41,400", equiv: "₹13,800 / month" },
    monthly: { price: "₹17,250",  period: "/month", onlyAnnual: true },
  },
};

/* ─── Tooltip ─────────────────────────────────────────────────────────────── */
function Tooltip({ text }) {
  const [v, setV] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: 5, cursor: "default" }}
      onMouseEnter={() => setV(true)}
      onMouseLeave={() => setV(false)}
    >
      <span style={{
        width: 14, height: 14, borderRadius: "50%", background: "#e5e7eb",
        color: "#6b7280", fontSize: 9.5, fontWeight: 700,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        userSelect: "none",
      }}>i</span>
      {v && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 7px)", left: "50%",
          transform: "translateX(-50%)",
          background: "#111", color: "#fff", fontSize: 12, lineHeight: 1.5,
          padding: "7px 11px", borderRadius: 7, whiteSpace: "nowrap",
          zIndex: 100, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", pointerEvents: "none",
        }}>
          {text}
          <span style={{
            position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)",
            border: "5px solid transparent", borderTopColor: "#111",
          }} />
        </span>
      )}
    </span>
  );
}

/* ─── Feature row ─────────────────────────────────────────────────────────── */
function FeatureRow({ feature, hovered }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 11, marginBottom: 13 }}>
      <svg width="17" height="17" viewBox="0 0 17 17" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="8.5" cy="8.5" r="8.5"
          fill={hovered ? "#eef0f3" : "#f3f4f6"}
          style={{ transition: "fill 0.22s" }}
        />
        <path d="M5.2 8.8l2 2 4.6-4.6"
          stroke={hovered ? ACCENT.check : "#9ca3af"}
          strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: "stroke 0.22s" }}
        />
      </svg>
      <span style={{
        fontSize: 13.5, lineHeight: 1.55,
        color: hovered ? "#1f2937" : "#4b5563",
        display: "flex", alignItems: "center", flexWrap: "wrap",
        transition: "color 0.2s",
      }}>
        {feature.text}
        {feature.tooltip && <Tooltip text={feature.tooltip} />}
      </span>
    </div>
  );
}

/* ─── Plan Card ───────────────────────────────────────────────────────────── */
function PlanCard({ title, subtitle, data, features, planKey, onChoose, cycle, mostPopular }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: 1,
        position: "relative",
        background: hovered ? ACCENT.bg : "white",
        border: `1.5px solid ${hovered ? ACCENT.border : "#e2e5e9"}`,
        borderRadius: 16,
        padding: "32px 28px 26px",
        display: "flex",
        flexDirection: "column",
        cursor: "default",
        boxShadow: hovered
          ? `0 16px 48px ${ACCENT.glow}`
          : "0 1px 4px rgba(0,0,0,0.05)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        transition: "background 0.25s, border-color 0.25s, box-shadow 0.25s, transform 0.25s",
      }}
    >
      {/* Thin top accent line */}
      <div style={{
        position: "absolute", top: 0, left: "8%", right: "8%", height: 2,
        background: `linear-gradient(90deg, transparent, ${ACCENT.border}, transparent)`,
        borderRadius: "0 0 3px 3px",
        opacity: hovered ? 0.7 : 0,
        transition: "opacity 0.28s",
      }} />

      {/* Most Popular badge — floats above the card */}
      {mostPopular && (
        <div style={{
          position: "absolute", top: 0, left: "50%",
          transform: hovered ? "translate(-50%, -60%)" : "translate(-50%, -50%)",
          zIndex: 10,
          transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}>
          <span style={{
            display: "inline-block",
            fontSize: 10, fontWeight: 700,
            color: hovered ? "white" : ACCENT.text,
            background: hovered ? ACCENT.btnBg : "#eef0f3",
            border: `1px solid ${hovered ? ACCENT.border : "#d1d5db"}`,
            borderRadius: 999,
            padding: "4px 12px",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            boxShadow: hovered ? `0 4px 14px ${ACCENT.glow}` : "0 1px 6px rgba(0,0,0,0.07)",
            transition: "background 0.22s, color 0.22s, border-color 0.22s, box-shadow 0.22s",
          }}>
            Most Popular
          </span>
        </div>
      )}

      {/* Plan label + subtitle */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 6 }}>
          <p style={{
            fontSize: 11, fontWeight: 800, letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: hovered ? ACCENT.text : "#9ca3af",
            margin: 0,
            transition: "color 0.22s",
          }}>{title}</p>
        </div>
        <p style={{ fontSize: 12.5, color: "#9ca3af", lineHeight: 1.5 }}>{subtitle}</p>
      </div>

      {/* Price block */}
      <div style={{ marginBottom: 4 }}>
        {cycle === "annual" && data.original && (
          <p style={{ fontSize: 12, color: "#d1d5db", textDecoration: "line-through", marginBottom: 2 }}>
            {data.original} /year
          </p>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          <span style={{
            fontSize: 42, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1,
            color: hovered ? ACCENT.text : "#111",
            transition: "color 0.22s",
          }}>{data.price}</span>
          <span style={{ fontSize: 13, color: "#9ca3af", fontWeight: 400 }}>{data.period}</span>
        </div>
        {cycle === "annual" && data.equiv && (
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 5 }}>
            Billed annually — {data.equiv} effective
          </p>
        )}
      </div>

      {/* Savings tag */}
      {cycle === "annual" && data.savings ? (
        <div style={{
          display: "inline-flex", alignSelf: "flex-start",
          alignItems: "center",
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 6, padding: "3px 10px", marginBottom: 24,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>
            You save {data.savings} per year
          </span>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }} />
      )}

      {/* Divider */}
      <div style={{
        height: 1,
        background: hovered ? "#dde0e5" : "#f3f4f6",
        marginBottom: 22,
        transition: "background 0.22s",
      }} />

      {/* Features */}
      <div style={{ flex: 1 }}>
        {features.map((f, i) => (
          <FeatureRow key={i} feature={f} hovered={hovered} />
        ))}
      </div>

      {/* CTA */}
      <div style={{ marginTop: 28 }}>
        {data.onlyAnnual ? (
          <div style={{
            textAlign: "center", padding: "11px",
            border: "1px dashed #d1d5db", borderRadius: 8,
            color: "#9ca3af", fontSize: 12,
          }}>
            Only available as an Annual Plan
          </div>
        ) : (
          <button
            onClick={() => onChoose(planKey)}
            style={{
              width: "100%", padding: "12px 0",
              border: hovered ? "none" : "1.5px solid #1c2536",
              borderRadius: 8,
              background: hovered ? ACCENT.btnBg : "transparent",
              color: hovered ? "white" : "#1c2536",
              fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              letterSpacing: "0.01em",
              boxShadow: hovered ? `0 4px 18px ${ACCENT.glow}` : "none",
              transition: "background 0.22s, color 0.22s, border-color 0.22s, box-shadow 0.22s",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.9"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            Get Started with {title} →
          </button>
        )}
        <p style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "#b0b5bc" }}>
          No credit card required for trial
        </p>
      </div>
    </div>
  );
}

/* ─── Trust footer ────────────────────────────────────────────────────────── */
const trustItems = [
  "Bank-grade encryption",
  "Bar Council compliant",
  "Data stored in India",
  "Cancel anytime",
];

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function BillingPage({ onChoose }) {
  const [cycle, setCycle] = useState("annual");

  return (
    <div style={{ flex: 1, background: "#faf9f6", padding: "52px 56px 60px", overflowY: "auto" }}>

      {/* ── Heading row ── */}
      <div style={{ maxWidth: 860, margin: "0 auto 36px" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 4 }}>
          Choose your plan
        </h1>
        <p style={{ fontSize: 13.5, color: "#9ca3af" }}>
          Annual billing saves 20%. Cancel or switch at any time.
        </p>
      </div>

      {/* ── Toggle — centered ── */}
      <div style={{ maxWidth: 860, margin: "0 auto 32px", display: "flex", justifyContent: "center" }}>
        <div style={{ display: "inline-flex", background: "#eeece8", borderRadius: 999, padding: "3px" }}>
          {["Monthly", "Annual"].map(c => {
            const active = cycle === c.toLowerCase();
            return (
              <button
                key={c}
                onClick={() => setCycle(c.toLowerCase())}
                style={{
                  padding: "7px 20px", border: "none", borderRadius: 999, cursor: "pointer",
                  background: active ? "white" : "transparent",
                  boxShadow: active ? "0 1px 5px rgba(0,0,0,0.08)" : "none",
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: active ? "#111" : "#9ca3af",
                  display: "flex", alignItems: "center", gap: 8,
                  transition: "all 0.15s",
                }}
              >
                {c}
                {c === "Annual" && (
                  <span style={{
                    background: "#dcfce7", color: "#15803d",
                    fontSize: 10, fontWeight: 700, padding: "2px 9px",
                    borderRadius: 999,
                    border: "1px solid #bbf7d0",
                  }}>−20%</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Plan cards ── */}
      <div style={{ display: "flex", gap: 20, alignItems: "stretch", maxWidth: 860, margin: "0 auto" }}>
        <PlanCard
          title="Professional"
          subtitle="For solo practitioners and boutique firms."
          data={plans.professional[cycle]}
          features={proFeatures}
          planKey="professional"
          onChoose={onChoose}
          cycle={cycle}
          mostPopular={true}
        />
        <PlanCard
          title="Enterprise"
          subtitle="For law firms, Corporate GCs and Government bodies."
          data={plans.enterprise[cycle]}
          features={entFeatures}
          planKey="enterprise"
          onChoose={onChoose}
          cycle={cycle}
        />
      </div>

      {/* ── Trust strip ── */}
      <div style={{
        maxWidth: 860, margin: "32px auto 0",
        paddingTop: 24, borderTop: "1px solid #ede9e2",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12,
      }}>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          {trustItems.map(t => (
            <span key={t} style={{ fontSize: 12, color: "#9ca3af", display: "flex", alignItems: "center", gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="5.5" fill="#e5e7eb"/>
                <path d="M3.2 5.7l1.5 1.5 3-3" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t}
            </span>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#9ca3af" }}>
          Need a custom plan?{" "}
          <a href="mailto:sales@lexlegis.ai" style={{ color: "#1c2536", fontWeight: 600, textDecoration: "underline" }}>
            Talk to our team →
          </a>
        </p>
      </div>

    </div>
  );
}