import { useState } from "react";
import { CheckCircle, QuestionIcon } from "../icons";

/* ─── Plan data ───────────────────────────────────────────────────────────── */
const proFeatures = [
  { text: "Includes ASK, INTERACT, & DRAFT modules" },
  { text: "300 Legal Queries & Drafting Prompts / month" },
  { text: "Securely store up to 50 case files or contracts" },
  {
    text: "Cross-reference up to 25 documents at once",
    tooltip: "Compare multiple contracts or case files in a single click",
  },
  { text: "Priority email & chat support" },
];

const entFeatures = [
  { text: "Unlimited AI interactions" },
  { text: "Unlimited document uploads" },
  { text: "Includes 5 Team Member Licenses (Add more as needed)" },
  { text: "Includes MS Word Add-in & API access" },
  { text: "Enterprise-Grade Security & Data Privacy" },
  { text: "Custom Onboarding & Team Training" },
];

const plans = {
  professional: {
    annual:  { price: "₹86,400", period: "/year", original: "₹1,08,000", savings: "₹21,600", monthly_equiv: "₹7,200/mo" },
    monthly: { price: "₹9,000",  period: "/month" },
  },
  enterprise: {
    annual:  { price: "₹1,65,600", period: "/year", original: "₹2,07,000", savings: "₹41,400", monthly_equiv: "₹13,800/mo" },
    monthly: { price: "₹17,250",  period: "/month", onlyAnnual: true },
  },
};

/* accent colours per plan */
const ACCENTS = {
  professional: { h: "#1a3a2a", light: "#f0f5f2", border: "#9dbfaf", glow: "rgba(26,58,42,0.12)" },
  enterprise:   { h: "#8a6a1a", light: "#fdf8ee", border: "#d4a843", glow: "rgba(138,106,26,0.13)" },
};

/* ─── Tooltip ─────────────────────────────────────────────────────────────── */
function Tooltip({ text }) {
  const [v, setV] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", alignItems: "center", marginLeft: 6, cursor: "default" }}
      onMouseEnter={() => setV(true)}
      onMouseLeave={() => setV(false)}
    >
      <span style={{
        width: 15, height: 15, borderRadius: "50%",
        background: "#e8e3dc", color: "#888",
        fontSize: 10, fontWeight: 700,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        userSelect: "none",
      }}>i</span>
      {v && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)",
          background: "#1a1a1a", color: "#fff",
          fontSize: 12, lineHeight: 1.45,
          padding: "8px 12px", borderRadius: 8,
          whiteSpace: "nowrap", zIndex: 100,
          boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
          pointerEvents: "none",
        }}>
          {text}
          <span style={{
            position: "absolute", top: "100%", left: "50%",
            transform: "translateX(-50%)",
            border: "5px solid transparent", borderTopColor: "#1a1a1a",
          }} />
        </span>
      )}
    </span>
  );
}

/* ─── Feature row ─────────────────────────────────────────────────────────── */
function FeatureRow({ feature, accent, hovered }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
        <circle cx="9" cy="9" r="9" fill={hovered ? accent.light : "#f3f4f6"} style={{ transition: "fill 0.25s" }} />
        <path d="M5.5 9.2l2.2 2.2 4.8-4.8" stroke={hovered ? accent.h : "#9ca3af"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.25s" }} />
      </svg>
      <span style={{ fontSize: 13.5, color: hovered ? "#1f2937" : "#374151", lineHeight: 1.5, display: "flex", alignItems: "center", flexWrap: "wrap", transition: "color 0.2s" }}>
        {feature.text}
        {feature.tooltip && <Tooltip text={feature.tooltip} />}
      </span>
    </div>
  );
}

/* ─── Plan Card ───────────────────────────────────────────────────────────── */
function PlanCard({ title, subtitle, data, features, planKey, onChoose, cycle, badge }) {
  const [hovered, setHovered] = useState(false);
  const accent = ACCENTS[planKey];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        flex: 1,
        background: hovered ? accent.light : "white",
        border: `1.5px solid ${hovered ? accent.border : "#e8e3dc"}`,
        borderRadius: 20,
        padding: "32px 30px 28px",
        display: "flex",
        flexDirection: "column",
        cursor: "default",
        boxShadow: hovered
          ? `0 20px 56px ${accent.glow}, 0 2px 8px rgba(0,0,0,0.04)`
          : "0 2px 12px rgba(0,0,0,0.04)",
        transform: hovered ? "translateY(-5px) scale(1.012)" : "translateY(0) scale(1)",
        transition: "background 0.28s, border-color 0.28s, box-shadow 0.28s, transform 0.28s",
        overflow: "visible",
      }}
    >
      {/* Top glow line */}
      <div style={{
        position: "absolute", top: 0, left: "10%", right: "10%", height: 2,
        borderRadius: "0 0 4px 4px",
        background: `linear-gradient(90deg, transparent, ${accent.h}, transparent)`,
        opacity: hovered ? 1 : 0,
        transition: "opacity 0.3s",
      }} />

      {/* Badge */}
      {badge && (
        <div style={{
          position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
          background: hovered ? accent.h : "#3b4a5c",
          color: "white",
          fontSize: 11, fontWeight: 700, letterSpacing: "0.07em",
          padding: "4px 16px", borderRadius: 100,
          textTransform: "uppercase", whiteSpace: "nowrap",
          transition: "background 0.25s, box-shadow 0.25s",
          boxShadow: hovered ? `0 4px 14px ${accent.glow}` : "none",
        }}>
          {badge}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{
          fontSize: 13, fontWeight: 800, letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: hovered ? accent.h : "#6b7280",
          marginBottom: 5,
          transition: "color 0.25s",
        }}>{title}</h3>
        <p style={{ fontSize: 12.5, color: "#9ca3af", lineHeight: 1.5 }}>{subtitle}</p>
      </div>

      {/* Price */}
      <div style={{ marginBottom: 6 }}>
        {cycle === "annual" && data.original && (
          <span style={{ fontSize: 12, color: "#d1d5db", textDecoration: "line-through", marginBottom: 3, display: "block" }}>
            {data.original} /year
          </span>
        )}
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{
            fontSize: 44, fontWeight: 800, letterSpacing: "-2.5px", lineHeight: 1,
            color: hovered ? accent.h : "#111",
            transition: "color 0.25s",
          }}>{data.price}</span>
          <span style={{ fontSize: 13, color: "#9ca3af" }}>{data.period}</span>
        </div>
        {cycle === "annual" && data.monthly_equiv && (
          <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
            Billed annually · {data.monthly_equiv} effective
          </p>
        )}
      </div>

      {/* Savings pill */}
      {cycle === "annual" && data.savings ? (
        <div style={{
          display: "inline-flex", alignItems: "center",
          background: "#f0fdf4", border: "1px solid #bbf7d0",
          borderRadius: 100, padding: "4px 12px",
          marginBottom: 24, alignSelf: "flex-start",
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#15803d" }}>
            Save {data.savings} / year
          </span>
        </div>
      ) : (
        <div style={{ marginBottom: 24 }} />
      )}

      {/* Divider */}
      <div style={{
        height: 1,
        background: hovered ? accent.border : "#f3f4f6",
        marginBottom: 22,
        transition: "background 0.25s",
      }} />

      {/* Features */}
      <div style={{ flex: 1 }}>
        {features.map((f, i) => (
          <FeatureRow key={i} feature={f} accent={accent} hovered={hovered} />
        ))}
      </div>

      {/* CTA */}
      <div style={{ marginTop: 26 }}>
        {data.onlyAnnual ? (
          <div style={{
            textAlign: "center", padding: "12px",
            border: "1px dashed #d1d5db", borderRadius: 10,
            color: "#9ca3af", fontSize: 12,
          }}>
            Only available as an Annual Plan
          </div>
        ) : (
          <button
            onClick={() => onChoose(planKey)}
            style={{
              width: "100%", padding: "13px",
              border: "none", borderRadius: 10,
              background: hovered ? accent.h : "#1c2536",
              color: "white",
              fontSize: 14, fontWeight: 600, cursor: "pointer",
              letterSpacing: "0.01em",
              boxShadow: hovered
                ? `0 6px 20px ${accent.glow}`
                : "0 2px 8px rgba(0,0,0,0.12)",
              transform: hovered ? "scale(1.02)" : "scale(1)",
              transition: "background 0.25s, box-shadow 0.25s, transform 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.92"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}
          >
            Get Started with {title} →
          </button>
        )}
        <p style={{ textAlign: "center", marginTop: 10, fontSize: 11.5, color: "#9ca3af" }}>
          No credit card required for trial
        </p>
      </div>
    </div>
  );
}

/* ─── Trust bar ───────────────────────────────────────────────────────────── */
function TrustBar() {
  const items = [
    { icon: "🔒", label: "Bank-grade encryption" },
    { icon: "📋", label: "Bar Council compliant" },
    { icon: "🇮🇳", label: "Data stored in India" },
    { icon: "↩️", label: "Cancel anytime" },
  ];
  return (
    <div style={{
      display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap",
      marginTop: 36, paddingTop: 28,
      borderTop: "1px solid #f0ece5",
    }}>
      {items.map(({ icon, label }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 14 }}>{icon}</span>
          <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────────────────────── */
export default function BillingPage({ onChoose }) {
  const [cycle, setCycle] = useState("annual");

  return (
    <div style={{ flex: 1, background: "#faf9f6", padding: "44px 48px 52px", overflowY: "auto" }}>

      {/* Page header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 48 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111", marginBottom: 4 }}>Billing</h1>
          <p style={{ fontSize: 13, color: "#9ca3af" }}>Manage your subscription, invoices, and payment methods.</p>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4, opacity: 0.5 }}>
          <QuestionIcon />
        </button>
      </div>

      {/* Headline */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          display: "inline-block",
          background: "#f0ece5", color: "#6b7280",
          fontSize: 11.5, fontWeight: 700, letterSpacing: "0.1em",
          textTransform: "uppercase", padding: "5px 16px",
          borderRadius: 100, marginBottom: 16,
        }}>
          Pricing
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: "#111", letterSpacing: "-1px", marginBottom: 10 }}>
          Simple, transparent pricing
        </h2>
        <p style={{ fontSize: 14.5, color: "#6b7280", maxWidth: 460, margin: "0 auto 24px" }}>
          Built for legal professionals. Pay only for what your practice needs.
        </p>

        {/* Billing toggle */}
        <div style={{ display: "inline-flex", background: "#f0ece5", borderRadius: 100, padding: "4px" }}>
          {["Monthly", "Annual"].map(c => {
            const isActive = cycle === c.toLowerCase();
            return (
              <button
                key={c}
                onClick={() => setCycle(c.toLowerCase())}
                style={{
                  padding: "8px 22px", border: "none", borderRadius: 100, cursor: "pointer",
                  background: isActive ? "white" : "transparent",
                  boxShadow: isActive ? "0 1px 6px rgba(0,0,0,0.10)" : "none",
                  fontSize: 13, color: isActive ? "#111" : "#9ca3af",
                  fontWeight: isActive ? 600 : 400,
                  display: "flex", alignItems: "center", gap: 8,
                  transition: "all 0.18s",
                }}
              >
                {c}
                {c === "Annual" && (
                  <span style={{
                    background: "#dcfce7", color: "#15803d",
                    fontSize: 10.5, padding: "2px 8px",
                    borderRadius: 100, fontWeight: 700,
                    border: "1px solid #bbf7d0",
                  }}>Save 20%</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: "flex", gap: 22, alignItems: "stretch", maxWidth: 860, margin: "0 auto" }}>
        <PlanCard
          title="Professional"
          subtitle="Perfect for solo practitioners and boutique firms."
          data={plans.professional[cycle]}
          features={proFeatures}
          planKey="professional"
          onChoose={onChoose}
          cycle={cycle}
          badge="Most Popular"
        />
        <PlanCard
          title="Enterprise"
          subtitle="Scale your firm's research and drafting with unlimited capacity."
          data={plans.enterprise[cycle]}
          features={entFeatures}
          planKey="enterprise"
          onChoose={onChoose}
          cycle={cycle}
          badge="Full Power"
        />
      </div>

      {/* Trust bar */}
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <TrustBar />
        <p style={{ textAlign: "center", marginTop: 22, fontSize: 12.5, color: "#9ca3af" }}>
          Need a custom plan for a large firm?{" "}
          <a href="mailto:sales@example.com" style={{ color: "#3b4a5c", fontWeight: 600, textDecoration: "underline" }}>
            Talk to our team →
          </a>
        </p>
      </div>
    </div>
  );
}