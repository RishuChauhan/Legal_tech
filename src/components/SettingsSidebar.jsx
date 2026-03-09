import { ArrowLeft, UserIcon, BillingIcon, HistoryIcon, HelpIcon, ChevronDown } from "../icons";

const items = [
  { id: "account", label: "Account",     Icon: UserIcon },
  { id: "billing", label: "Billing",     Icon: BillingIcon },
  { id: "history", label: "History",     Icon: HistoryIcon },
  { id: "help",    label: "Help Center", Icon: HelpIcon },
];

export default function SettingsSidebar({ activeSub, onBack, onNav }) {
  return (
    <aside style={{
      width: 232, flexShrink: 0, background: "white",
      borderRight: "1px solid #eae6e0",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "16px 18px 14px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onBack} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "#666", padding: "2px", display: "flex", alignItems: "center",
        }}>
          <ArrowLeft />
        </button>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>Settings</span>
      </div>

      <nav style={{ flex: 1, padding: "4px 8px" }}>
        {items.map(({ id, label, Icon }) => (
          <div key={id} onClick={() => onNav(id)} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "9px 12px", borderRadius: 8, cursor: "pointer",
            background: activeSub === id ? "#f4f1ec" : "transparent",
            marginBottom: 1,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#666", fontSize: 14 }}>
              <Icon />
              <span>{label}</span>
            </div>
            <ChevronDown />
          </div>
        ))}
      </nav>
    </aside>
  );
}
