import { useState } from "react";
import { QuestionIcon, SearchIcon } from "../icons";

const fmt = (n) => "₹" + n.toLocaleString("en-IN");

function Field({ label, placeholder, defaultValue }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, color: "#555", marginBottom: 6 }}>{label}</label>
      <input defaultValue={defaultValue} placeholder={placeholder} style={{
        width: "100%", padding: "9px 12px", border: "1px solid #e0dbd3",
        borderRadius: 8, fontSize: 13, color: "#333", background: "white",
        outline: "none", boxSizing: "border-box",
      }} />
    </div>
  );
}

function SearchField({ label, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", fontSize: 13, color: "#555", marginBottom: 6 }}>{label}</label>
      <div style={{ position: "relative" }}>
        <input placeholder={placeholder} style={{
          width: "100%", padding: "9px 36px 9px 12px", border: "1px solid #e0dbd3",
          borderRadius: 8, fontSize: 13, color: "#333", background: "white",
          outline: "none", boxSizing: "border-box",
        }} />
        <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
          <SearchIcon />
        </span>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [seats, setSeats] = useState(1);

  const basePrice = billingCycle === "monthly" ? 9000 : 86400;
  const subtotal  = basePrice * seats;
  const gst       = Math.round(subtotal * 0.18);
  const total     = subtotal + gst;

  const summaryRows = [
    ["Organisation Name", "Rishu Chauhan's Organis..."],
    ["Address",           "-, ..."],
    ["GST Number",        ""],
    ["Plan",              "Professional", true],
    ["Billing",           billingCycle === "monthly" ? "Monthly" : "Yearly", true],
    ["Price per seat",    fmt(basePrice)],
    ["Seats",             String(seats)],
    ["Subtotal",          fmt(subtotal)],
    ["GST (18%)",         fmt(gst)],
  ];

  return (
    <div style={{ flex: 1, background: "#faf9f6", padding: "36px 40px", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#111", marginBottom: 4 }}>Billing</h1>
          <p style={{ fontSize: 13, color: "#999" }}>Manage your subscription, invoices, and payment methods.</p>
        </div>
        <button style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
          <QuestionIcon />
        </button>
      </div>

      <h2 style={{ fontSize: 17, fontWeight: 600, color: "#111", marginBottom: 22 }}>Configure your plan and confirm billing</h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 370px", gap: 36 }}>
        {/* ── Left form ── */}
        <div>
          <p style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>Billing cycle</p>
          <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
            {[
              { id: "monthly", label: "Monthly", sub: "₹9,000 / seat" },
              { id: "yearly",  label: "Yearly",  sub: "₹86,400 / seat", badge: "Save 20%" },
            ].map(opt => (
              <div key={opt.id} onClick={() => setBillingCycle(opt.id)} style={{
                flex: 1, border: `1.5px solid ${billingCycle === opt.id ? "#3b4a5c" : "#e0dbd3"}`,
                borderRadius: 10, padding: "13px 16px", cursor: "pointer", background: "white",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "#111" }}>{opt.label}</span>
                  {opt.badge && (
                    <span style={{ background: "#dcfce7", color: "#15803d", fontSize: 11, padding: "1px 8px", borderRadius: 100, fontWeight: 600 }}>
                      {opt.badge}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 12, color: "#999" }}>{opt.sub}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>How many licenses to purchase?</p>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 24, width: 130 }}>
            <button onClick={() => setSeats(Math.max(1, seats - 1))} style={{
              width: 34, height: 34, border: "1px solid #e0dbd3", borderRight: "none",
              borderRadius: "8px 0 0 8px", background: "white", cursor: "pointer",
              fontSize: 18, color: "#555", display: "flex", alignItems: "center", justifyContent: "center",
            }}>−</button>
            <div style={{
              width: 60, height: 34, border: "1px solid #e0dbd3",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, color: "#111", background: "white",
            }}>{seats}</div>
            <button onClick={() => setSeats(seats + 1)} style={{
              width: 34, height: 34, border: "1px solid #e0dbd3", borderLeft: "none",
              borderRadius: "0 8px 8px 0", background: "white", cursor: "pointer",
              fontSize: 18, color: "#555", display: "flex", alignItems: "center", justifyContent: "center",
            }}>+</button>
          </div>

          <p style={{ fontSize: 13, color: "#555", marginBottom: 10 }}>Promo code</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 26 }}>
            <input placeholder="Enter code" style={{
              flex: 1, padding: "9px 12px", border: "1px solid #e0dbd3", borderRadius: 8,
              fontSize: 13, color: "#333", background: "white", outline: "none",
            }} />
            <button style={{
              padding: "9px 20px", border: "1px solid #e0dbd3", borderRadius: 8,
              background: "white", fontSize: 13, cursor: "pointer", color: "#444",
            }}>Apply</button>
          </div>

          <p style={{ fontSize: 13, color: "#555", marginBottom: 14 }}>Billing details for invoice</p>
          <Field label="Organisation Name" placeholder="Organisation Name" defaultValue="Rishu Chauhan's Organisation" />
          <Field label="Address Line" placeholder="Street, Area, Building" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="City"    placeholder="City" />
            <Field label="Pincode" placeholder="Pincode" />
          </div>
          <SearchField label="Country" placeholder="Search country..." />
          <SearchField label="State"   placeholder="Search state..." />
          <Field label="GST Number" placeholder="Enter GST Number" />
        </div>

        {/* ── Right summary ── */}
        <div>
          <div style={{
            background: "#f7f5f1", border: "1px solid #e0dbd3", borderRadius: 12,
            padding: "22px", position: "sticky", top: 20,
          }}>
            {summaryRows.map(([k, v, bold]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", marginBottom: 9, fontSize: 13 }}>
                <span style={{ color: "#888" }}>{k}</span>
                <span style={{ color: "#111", fontWeight: bold ? 600 : 400 }}>{v}</span>
              </div>
            ))}

            <div style={{ borderTop: "1px solid #e0dbd3", margin: "16px 0" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>Total payable</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: "#111", letterSpacing: "-1px" }}>{fmt(total)}</span>
            </div>
            <p style={{ fontSize: 12, color: "#999", marginBottom: 16 }}>
              Billed monthly. Renews automatically. Cancel anytime.
            </p>
            <button style={{
              width: "100%", padding: "13px", border: "1px solid #d4cfc8",
              borderRadius: 8, background: "#ede9e2", color: "#aaa",
              fontSize: 14, cursor: "not-allowed", marginBottom: 12,
            }}>
              Subscribe & Pay {total.toLocaleString("en-IN")}
            </button>
            <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", marginBottom: 8 }}>
              By continuing, you agree to our Terms & Privacy Policy.
            </p>
            <p style={{ fontSize: 12, color: "#aaa", textAlign: "center" }}>
              If you prefer to pay offline{" "}
              <a href="#" style={{ color: "#555", textDecoration: "underline" }}>click here</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
