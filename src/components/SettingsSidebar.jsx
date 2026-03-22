import { useState } from "react";
import { ArrowLeft, UserIcon, BillingIcon, HistoryIcon, HelpIcon, ChevronDown } from "../icons";

const items = [
  { id: "account", label: "Account",     Icon: UserIcon },
  { id: "billing", label: "Billing",     Icon: BillingIcon },
  { id: "history", label: "History",     Icon: HistoryIcon },
  { id: "help",    label: "Help Center", Icon: HelpIcon },
];

export default function SettingsSidebar({ activeSub, onBack, onNav, collapsed = true }) {
  const [hovered, setHovered] = useState(false);
  const expanded = !collapsed || hovered;
  const sidebarWidth = expanded ? 232 : 56;

  return (
    <aside
      onMouseEnter={() => collapsed && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: sidebarWidth,
        flexShrink: 0,
        background: "white",
        borderRight: "1px solid #eae6e0",
        display: "flex",
        flexDirection: "column",
        transition: "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        ...(collapsed ? {
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 10,
          boxShadow: hovered ? "4px 0 16px rgba(0,0,0,0.08)" : "none",
        } : {}),
      }}
    >
      <div style={{
        padding: expanded ? "16px 18px 14px" : "16px 8px 14px",
        display: "flex",
        alignItems: "center",
        gap: expanded ? 10 : 0,
        justifyContent: expanded ? "flex-start" : "center",
        transition: "padding 250ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#666", padding: "2px", display: "flex", alignItems: "center",
          flexShrink: 0,
        }}>
          <ArrowLeft />
        </button>
        <span style={{
          fontSize: 18, fontWeight: 700, color: "#111",
          opacity: expanded ? 1 : 0,
          width: expanded ? "auto" : 0,
          overflow: "hidden",
          whiteSpace: "nowrap",
          transition: "opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}>Settings</span>
      </div>

      <nav style={{
        flex: 1,
        padding: expanded ? "4px 8px" : "4px 4px",
        transition: "padding 250ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        {items.map(({ id, label, Icon }) => (
          <div key={id} onClick={() => onNav(id)} style={{
            display: "flex",
            alignItems: "center",
            gap: expanded ? 10 : 0,
            padding: expanded ? "9px 12px" : "9px 0",
            justifyContent: expanded ? "flex-start" : "center",
            borderRadius: 8,
            cursor: "pointer",
            background: activeSub === id ? "#f4f1ec" : "transparent",
            marginBottom: 1,
            transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          title={!expanded ? label : undefined}
          >
            <span style={{ flexShrink: 0, display: "flex", color: "#666" }}>
              <Icon />
            </span>
            <span style={{
              flex: expanded ? 1 : 0,
              opacity: expanded ? 1 : 0,
              width: expanded ? "auto" : 0,
              overflow: "hidden",
              whiteSpace: "nowrap",
              fontSize: 14,
              color: "#666",
              transition: "opacity 250ms cubic-bezier(0.4, 0, 0.2, 1), flex 250ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}>
              {label}
            </span>
            {expanded && <ChevronDown />}
          </div>
        ))}
      </nav>
    </aside>
  );
}
