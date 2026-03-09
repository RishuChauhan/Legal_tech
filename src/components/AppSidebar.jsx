import Logo from "./Logo";
import { DashboardIcon, ChatIcon, DocIcon, EditIcon, QueueIcon, LibraryIcon, UserIcon, ChevronDown } from "../icons";

const navItems = [
  { id: "dashboard", label: "Dashboard", Icon: DashboardIcon },
  { id: "ask",       label: "Ask",       Icon: ChatIcon },
  { id: "interact",  label: "Interact",  Icon: DocIcon },
  { id: "draft",     label: "Draft",     Icon: EditIcon },
  { id: "queue",     label: "Queue",     Icon: QueueIcon },
  { id: "library",   label: "Library",   Icon: LibraryIcon, hasChevron: true },
];

export default function AppSidebar({ active, onNav }) {
  return (
    <aside style={{
      width: 232, flexShrink: 0, background: "white",
      borderRight: "1px solid #eae6e0",
      display: "flex", flexDirection: "column",
    }}>
      <div style={{ padding: "18px 18px 14px" }}>
        <Logo />
      </div>

      <nav style={{ flex: 1, padding: "4px 8px" }}>
        {navItems.map(({ id, label, Icon, hasChevron }) => {
          const isActive = active === id;
          return (
            <div key={id} onClick={() => onNav(id)} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 12px", borderRadius: 8, cursor: "pointer",
              background: isActive ? "#f4f1ec" : "transparent",
              color: isActive ? "#111" : "#666",
              fontSize: 14, fontWeight: isActive ? 500 : 400,
              marginBottom: 1,
            }}>
              <Icon />
              <span style={{ flex: 1 }}>{label}</span>
              {hasChevron && <ChevronDown />}
            </div>
          );
        })}
      </nav>

      <div style={{
        padding: "12px 10px", borderTop: "1px solid #eae6e0",
        display: "flex", alignItems: "center", gap: 10, cursor: "pointer",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", background: "#e8e4dc",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <UserIcon />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>Rishu Chauhan</div>
          <div style={{ fontSize: 11, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            rishu.chauhan9811...
          </div>
        </div>
        <ChevronDown />
      </div>
    </aside>
  );
}
