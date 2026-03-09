import { useState } from "react";

import LandingPage      from "./pages/LandingPage";
import Dashboard        from "./pages/Dashboard";
import BillingPage      from "./pages/BillingPage";
import CheckoutPage     from "./pages/CheckoutPage";
import AppSidebar       from "./components/AppSidebar";
import SettingsSidebar  from "./components/SettingsSidebar";
import OnboardingPage   from "./pages/OnboardingPage";

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

const TRIAL_DAYS_REMAINING = 4;

/* ─── SVG icons ───────────────────────────────────────────────────────────── */
const IconInfo = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="7" cy="7" r="6" stroke={color} strokeWidth="1.25"/>
    <path d="M7 6.5v3.5" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="7" cy="4.5" r="0.75" fill={color}/>
  </svg>
);

const IconClock = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="7" cy="7" r="6" stroke={color} strokeWidth="1.25"/>
    <path d="M7 4v3.2l2 1.4" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconAlert = ({ color }) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
    <path d="M7 1.5L13 12.5H1L7 1.5Z" stroke={color} strokeWidth="1.25" strokeLinejoin="round"/>
    <path d="M7 5.5v3" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    <circle cx="7" cy="10" r="0.75" fill={color}/>
  </svg>
);

/* ─── Banner config ───────────────────────────────────────────────────────── */
function getBannerConfig(days) {
  if (days >= 5) {
    return {
      bg:        "#f0f3ee",
      border:    "#c8d4c2",
      accentBar: "#6a8f61",
      color:     "#2d4228",
      dimColor:  "#5a7254",
      Icon:      IconInfo,
      message:   "You are on a free trial — upgrade before Day 7 to lock in 20% off your annual plan.",
      cta:       "Upgrade Now",
      ctaBg:     "#3a5c33",
      ctaHover:  "#2d4228",
      ctaColor:  "white",
    };
  }
  if (days === 4 || days === 3) {
    return {
      bg:        "#faf6ec",
      border:    "#e2ceA0",
      accentBar: "#b08a30",
      color:     "#4a3510",
      dimColor:  "#7a5e28",
      Icon:      IconClock,
      message:   `${days} days remaining — your saved research, case files, and drafts will be removed at trial end.`,
      cta:       "Upgrade & Retain Access",
      ctaBg:     "#8a6520",
      ctaHover:  "#6e5018",
      ctaColor:  "white",
    };
  }
  if (days === 2) {
    return {
      bg:        "#faf1ec",
      border:    "#e8c4a8",
      accentBar: "#b56030",
      color:     "#4a2010",
      dimColor:  "#7a4428",
      Icon:      IconAlert,
      message:   "2 days remaining — secure your case files and drafts before they are cleared.",
      cta:       "Upgrade & Retain Access",
      ctaBg:     "#9a3e18",
      ctaHover:  "#7c3010",
      ctaColor:  "white",
    };
  }
  return {
    bg:        "#f9eeee",
    border:    "#e8b8b8",
    accentBar: "#a83030",
    color:     "#4a1010",
    dimColor:  "#7a3030",
    Icon:      IconAlert,
    message:   "Your trial expires today — upgrade now to retain all your work and research history.",
    cta:       "Upgrade Immediately",
    ctaBg:     "#8b1a1a",
    ctaHover:  "#6e1414",
    ctaColor:  "white",
  };
}

/* ─── Trial Banner ───────────────────────────────────────────────────────── */
function TrialBanner({ daysRemaining, onUpgradeClick }) {
  const [dismissed, setDismissed] = useState(false);
  const [ctaHovered, setCtaHovered] = useState(false);
  const cfg = getBannerConfig(daysRemaining);
  const { Icon } = cfg;

  if (dismissed) return null;

  return (
    <div style={{
      background: cfg.bg,
      borderBottom: `1px solid ${cfg.border}`,
      color: cfg.color,
      padding: "8px 48px 8px 16px",
      fontSize: 12.5,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      position: "relative",
      // Thin left accent bar
      boxShadow: `inset 3px 0 0 ${cfg.accentBar}`,
    }}>

      <Icon color={cfg.accentBar} />

      <span style={{ color: cfg.color, fontWeight: 500, letterSpacing: "0.01em", lineHeight: 1.4 }}>
        {cfg.message}
      </span>

      <button
        onClick={onUpgradeClick}
        onMouseEnter={() => setCtaHovered(true)}
        onMouseLeave={() => setCtaHovered(false)}
        style={{
          padding: "4px 14px",
          border: "none",
          borderRadius: 100,
          background: ctaHovered ? cfg.ctaHover : cfg.ctaBg,
          color: cfg.ctaColor,
          fontSize: 11.5,
          fontWeight: 600,
          cursor: "pointer",
          letterSpacing: "0.03em",
          transition: "background 0.15s",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {cfg.cta} →
      </button>

      <button
        onClick={() => setDismissed(true)}
        onMouseEnter={e => e.currentTarget.style.opacity = "0.65"}
        onMouseLeave={e => e.currentTarget.style.opacity = "0.28"}
        style={{
          position: "absolute", right: 14, top: "50%",
          transform: "translateY(-50%)",
          background: "none", border: "none",
          color: cfg.color, opacity: 0.28,
          fontSize: 13, cursor: "pointer",
          lineHeight: 1, padding: "2px 4px",
          transition: "opacity 0.15s",
          fontWeight: 300,
        }}
        title="Dismiss"
      >✕</button>
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

  if (page === "landing") {
    return <LandingPage onLogin={() => setPage("onboarding")} />;
  }

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

  return (
    <div style={{ position: "relative", display: "flex", flexDirection: "column", width: "100vw", height: "100vh", overflow: "hidden" }}>

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

      {page === "onboarding" && (
        <div style={{
          position: "absolute",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999,
        }}>
          <OnboardingPage
            onComplete={(moduleId) => {
              setAppTab(moduleId);
              setPage("app");
            }}
          />
        </div>
      )}
    </div>
  );
}