import { useState } from "react";
import { CheckCircle, QuestionIcon } from "../icons";

const proFeatures = [
  "All core AI modules included",
  "300 AI interactions per month",
  "50 documents in Library",
  "25 Files per interaction",
  "Priority email & chat support",
];

const entFeatures = [
  "Unlimited AI interactions",
  "Unlimited document uploads",
  "Minimum 5 licenses",
  "All integrations & extensions included",
  "Dedicated account manager",
];

const plans = {
  professional: {
    annual:  { price: "₹86,400", period: "/year", original: "₹108000", savings: "₹21,600", payable: "₹86,400" },
    monthly: { price: "₹9,000",  period: "/month" },
  },
  enterprise: {
    annual:  { price: "₹165,600", period: "/year", original: "₹207000", savings: "₹41,400", payable: "₹165,600" },
    monthly: { price: "₹17,250",  period: "/month", onlyAnnual: true },
  },
};

function PlanCard({ title, data, features, planKey, onChoose, cycle }) {
  return (
    <div style={{ background: "white", border: "1px solid #e8e3dc", borderRadius: 14, padding: "26px 28px", display: "flex", flexDirection: "column" }}>
      <h3 style={{ fontSize: 17, fontWeight: 600, color: "#111", marginBottom: 6 }}>{title}</h3>

      {cycle === "annual" && data.original && (
        <p style={{ fontSize: 13, color: "#bbb", textDecoration: "line-through", marginBottom: 2 }}>{data.original} /year</p>
      )}

      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
        <span style={{ fontSize: 44, fontWeight: 700, color: "#111", letterSpacing: "-2px" }}>{data.price}</span>
        <span style={{ fontSize: 14, color: "#999" }}>{data.period}</span>
      </div>

      {cycle === "annual" && data.savings && (
        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8,
          padding: "10px 14px", marginBottom: 20,
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#15803d", marginBottom: 3 }}>20% OFF — Annual discount applied</p>
            <p style={{ fontSize: 11, color: "#86efac" }}>You save {data.savings} per year vs MRP</p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{data.payable}</p>
            <p style={{ fontSize: 11, color: "#999" }}>Now payable /year</p>
          </div>
        </div>
      )}

      <div style={{ flex: 1, marginBottom: 22 }}>
        {features.map(f => (
          <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 13 }}>
            <span style={{ color: "#555", flexShrink: 0, display: "flex" }}><CheckCircle /></span>
            <span style={{ fontSize: 14, color: "#444" }}>{f}</span>
          </div>
        ))}
      </div>

      {data.onlyAnnual ? (
        <button style={{
          width: "100%", padding: 14, border: "1px solid #e0dbd3",
          borderRadius: 8, background: "white", color: "#bbb", fontSize: 14, cursor: "default",
        }}>
          Only available as an Annual Plan
        </button>
      ) : (
        <button onClick={() => onChoose(planKey)} style={{
          width: "100%", padding: 14, border: "none", borderRadius: 8,
          background: "#3b4a5c", color: "white", fontSize: 14, cursor: "pointer", fontWeight: 500,
        }}
          onMouseEnter={e => e.currentTarget.style.background = "#2d3a4a"}
          onMouseLeave={e => e.currentTarget.style.background = "#3b4a5c"}
        >
          Choose {title}
        </button>
      )}
    </div>
  );
}

export default function BillingPage({ onChoose }) {
  const [cycle, setCycle] = useState("annual");

  return (
    <div style={{ flex: 1, background: "#faf9f6", padding: "36px 40px", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#111", marginBottom: 4 }}>Billing</h1>
          <p style={{ fontSize: 13, color: "#999" }}>Manage your subscription, invoices, and payment methods.</p>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <QuestionIcon />
        </button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: "#111", marginBottom: 8 }}>Subscribe for more Usage</h2>
        <p style={{ fontSize: 13, color: "#999", marginBottom: 18 }}>Annual plan includes a 20% discount.</p>

        <div style={{ display: "inline-flex", background: "#f0ece5", borderRadius: 100, padding: "3px" }}>
          {["Monthly", "Annual"].map(c => {
            const isActive = cycle === c.toLowerCase();
            return (
              <button key={c} onClick={() => setCycle(c.toLowerCase())} style={{
                padding: "7px 18px", border: "none", borderRadius: 100, cursor: "pointer",
                background: isActive ? "white" : "transparent",
                boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                fontSize: 13, color: "#111", fontWeight: isActive ? 500 : 400,
                display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s",
              }}>
                {c}
                {c === "Annual" && (
                  <span style={{
                    background: "#dcfce7", color: "#15803d", fontSize: 11,
                    padding: "1px 8px", borderRadius: 100, fontWeight: 600, border: "1px solid #bbf7d0",
                  }}>20% off</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <PlanCard title="Professional" data={plans.professional[cycle]} features={proFeatures} planKey="professional" onChoose={onChoose} cycle={cycle} />
        <PlanCard title="Enterprise"   data={plans.enterprise[cycle]}   features={entFeatures}  planKey="enterprise"   onChoose={onChoose} cycle={cycle} />
      </div>
    </div>
  );
}
