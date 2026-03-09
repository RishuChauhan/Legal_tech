import { useState } from "react";

import LandingPage      from "./pages/LandingPage";
import Dashboard        from "./pages/Dashboard";
import BillingPage      from "./pages/BillingPage";
import CheckoutPage     from "./pages/CheckoutPage";
import AppSidebar       from "./components/AppSidebar";
import SettingsSidebar  from "./components/SettingsSidebar";
import OnboardingPage   from "./pages/OnboardingPage";

/* inject global reset once */
if (!document.getElementById("lex-reset")) {
  const s = document.createElement("style");
  s.id = "lex-reset";
  s.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body, #root { width: 100%; height: 100%; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    button { font-family: inherit; }
    input  { font-family: inherit; }
    a { text-decoration: none; }
  `;
  document.head.appendChild(s);
}

/* ─── Trial banner config ─────────────────────────────────────────────────
 *
 *  HOW TO TEST DIFFERENT DAYS:
 *  Change the TRIAL_DAYS_REMAINING constant below to any number (1–7).
 *
 *  In production, replace this with your real calculation, e.g.:
 *    const trialStart = new Date(user.trialStartedAt);
 *    const TRIAL_DAYS_REMAINING = 7 - Math.floor((Date.now() - trialStart) / 86400000);
 *
 *  ↓ ↓ ↓  CHANGE THIS NUMBER TO TEST  ↓ ↓ ↓
 * ─────────────────────────────────────────────────────────────────────── */
const TRIAL_DAYS_REMAINING = 7; // try: 7, 5, 3, 2, 1

/* ─── Banner content & style per day bucket ──────────────────────────────── */
function getBannerConfig(days) {
  if (days >= 5) {
    return {
      bg:      "#1a3a2a",
      color:   "white",
      icon:    "✦",
      message: "You're on a free trial · Lock in 20% off if you upgrade before Day 7",
      cta:     "Upgrade Now",
      ctaBg:   "rgba(255,255,255,0.15)",
      ctaHover:"rgba(255,255,255,0.25)",
      ctaColor:"white",
    };
  }
  if (days === 4 || days === 3) {
    return {
      bg:      "#9c5428a8",
      color:   "white",
      icon:    "⏳",
      message: `${days} days left · Your research history & saved files will be cleared`,
      cta:     "Upgrade & Keep Everything",
      ctaBg:   "rgba(255,255,255,0.15)",
      ctaHover:"rgba(255,255,255,0.28)",
      ctaColor:"white",
    };
  }
  if (days === 2) {
    return {
      bg:      "#c87230",
      color:   "white",
      icon:    "⚠",
      message: "2 days left · Don't lose your saved cases and drafts",
      cta:     "Upgrade & Keep Everything",
      ctaBg:   "rgba(255,255,255,0.18)",
      ctaHover:"rgba(255,255,255,0.3)",
      ctaColor:"white",
    };
  }
  // days <= 1
  return {
    bg:      "#991b1b",
    color:   "white",
    icon:    "●",
    message: "Trial ends today · Upgrade now to keep all your work",
    cta:     "Upgrade & Keep Everything",
    ctaBg:   "white",
    ctaHover:"#f3f4f6",
    ctaColor:"#991b1b",
  };
}

/* ─── Trial Banner component ─────────────────────────────────────────────── */
function TrialBanner({ daysRemaining, onUpgradeClick }) {
  const [dismissed, setDismissed] = useState(false);
  const [ctaHovered, setCtaHovered] = useState(false);
  const cfg = getBannerConfig(daysRemaining);

  if (dismissed) return null;

  return (
    <div style={{
      background: cfg.bg,
      color: cfg.color,
      padding: "9px 16px",
      fontSize: 13,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      position: "relative",
    }}>
      {/* Icon */}
      <span style={{ fontSize: 12, opacity: 0.85 }}>{cfg.icon}</span>

      {/* Message */}
      <span style={{ opacity: 0.92 }}>{cfg.message}</span>

      {/* CTA pill button */}
      <button
        onClick={onUpgradeClick}
        onMouseEnter={() => setCtaHovered(true)}
        onMouseLeave={() => setCtaHovered(false)}
        style={{
          padding: "4px 14px",
          border: "1px solid rgba(255,255,255,0.35)",
          borderRadius: 100,
          background: ctaHovered ? cfg.ctaHover : cfg.ctaBg,
          color: cfg.ctaColor,
          fontSize: 12,
          fontWeight: 700,
          cursor: "pointer",
          letterSpacing: "0.01em",
          transition: "background 0.15s",
          whiteSpace: "nowrap",
        }}
      >
        {cfg.cta} →
      </button>

      {/* Dismiss */}
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute",
          right: 14,
          top: "50%",
          transform: "translateY(-50%)",
          background: "none",
          border: "none",
          color: cfg.color,
          opacity: 0.45,
          fontSize: 16,
          cursor: "pointer",
          lineHeight: 1,
          padding: "2px 4px",
        }}
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

/* ─── App ─────────────────────────────────────────────────────────────────── */
export default function App() {
  const [page,            setPage]           = useState("landing");
  const [appTab,          setAppTab]         = useState("dashboard");
  const [settingsTab,     setSettingsTab]    = useState("billing");
  const [settingsContent, setSettingsContent]= useState("billing");

  const goSettings = (sub = "billing") => {
    setPage("settings");
    setSettingsTab(sub);
    setSettingsContent(sub);
  };

  /* ── Landing ── */
  if (page === "landing") {
    return <LandingPage onLogin={() => setPage("onboarding")} />;
  }

  /* ── Onboarding ── */
  if (page === "onboarding") {
    return (
      <OnboardingPage
        onComplete={(moduleId) => {
          setAppTab(moduleId);
          setPage("app");
        }}
      />
    );
  }

  /* ── Settings ── */
  if (page === "settings") {
    return (
      <div style={{ display: "flex", width: "100vw", height: "100vh", overflow: "hidden" }}>
        <SettingsSidebar
          activeSub={settingsTab}
          onBack={() => setPage("app")}
          onNav={(id) => { setSettingsTab(id); setSettingsContent(id); }}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {settingsContent === "checkout"
            ? <CheckoutPage />
            : <BillingPage onChoose={() => setSettingsContent("checkout")} />
          }
        </div>
      </div>
    );
  }

  /* ── Main App ── */
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100vw", height: "100vh", overflow: "hidden" }}>

      <TrialBanner
        daysRemaining={TRIAL_DAYS_REMAINING}
        onUpgradeClick={() => goSettings("billing")}
      />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <AppSidebar active={appTab} onNav={setAppTab} />
        <div style={{ flex: 1, overflow: "auto" }}>
          {appTab === "dashboard"
            ? <Dashboard onNav={setAppTab} />
            : (
              <div style={{ padding: 40, background: "#faf9f6", minHeight: "100%" }}>
                <h1 style={{ fontSize: 24, fontWeight: 600, color: "#111", textTransform: "capitalize", marginBottom: 10 }}>
                  {appTab}
                </h1>
                <p style={{ color: "#999", fontSize: 14 }}>This module is available in the full version.</p>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}