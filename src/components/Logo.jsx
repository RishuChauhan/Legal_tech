const LogoMark = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
    <rect x="2" y="2" width="9" height="9" rx="1.5"/>
    <rect x="13" y="2" width="9" height="9" rx="1.5"/>
    <rect x="2" y="13" width="9" height="9" rx="1.5"/>
    <rect x="13" y="13" width="9" height="9" rx="1.5"/>
  </svg>
);

export default function Logo({ size = "normal", collapsed = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, overflow: "hidden" }}>
      <div style={{
        width: size === "large" ? 32 : 26,
        height: size === "large" ? 32 : 26,
        background: "#111", borderRadius: 5,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <LogoMark />
      </div>
      <span style={{
        fontSize: size === "large" ? 20 : 16,
        fontWeight: 700, color: "#111", letterSpacing: "-0.5px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        opacity: collapsed ? 0 : 1,
        width: collapsed ? 0 : "auto",
        overflow: "hidden",
        whiteSpace: "nowrap",
        transition: "opacity 250ms cubic-bezier(0.4, 0, 0.2, 1), width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        Lex<span style={{ fontWeight: 400 }}>legis</span>.ai
      </span>
    </div>
  );
}
