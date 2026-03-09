import { useState } from "react";

import LandingPage      from "./pages/LandingPage";
import Dashboard        from "./pages/Dashboard";
import BillingPage      from "./pages/BillingPage";
import CheckoutPage     from "./pages/CheckoutPage";
import AppSidebar       from "./components/AppSidebar";
import SettingsSidebar  from "./components/SettingsSidebar";

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

export default function App() {
  const [page,           setPage]           = useState("landing");  // landing | app | settings
  const [appTab,         setAppTab]         = useState("dashboard");
  const [settingsTab,    setSettingsTab]    = useState("billing");
  const [settingsContent,setSettingsContent]= useState("billing");  // billing | checkout

  const goSettings = (sub = "billing") => {
    setPage("settings");
    setSettingsTab(sub);
    setSettingsContent(sub);
  };

  /* ── Landing ── */
  if (page === "landing") {
    return <LandingPage onLogin={() => setPage("app")} />;
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
      {/* Trial banner */}
      <div style={{
        background: "white", color: "black", textAlign: "center",
        padding: "9px 16px", fontSize: 13, flexShrink: 0,
      }}>
        Free Trial: 3 days remaining{" "}
        <a onClick={() => goSettings("billing")} href="#"
          style={{ color: "black", fontWeight: 700, textDecoration: "underline" }}>
          Upgrade Now
        </a>
      </div>

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
