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

export default function AppSidebar({ active, onNav, collapsed = false, hovered = false, onMouseEnter, onMouseLeave }) {
  const expanded = !collapsed || hovered;
  const sidebarWidth = expanded ? 232 : 56;

  return (
    <aside
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        width: sidebarWidth,
        flexShrink: 0,
        background: "white",
        borderRight: "1px solid #eae6e0",
        display: "flex",
        flexDirection: "column",
        transition: "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        overflow: "hidden",
        // When collapsed and hovered, overlay content
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
        padding: expanded ? "18px 18px 14px" : "18px 15px 14px",
        transition: "padding 250ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        <Logo collapsed={!expanded} />
      </div>

      <nav style={{ flex: 1, padding: "4px 8px" }}>
        {navItems.map(({ id, label, Icon, hasChevron }) => {
          const isActive = active === id;
          return (
            <div
              key={id}
              onClick={() => onNav(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: expanded ? 10 : 0,
                padding: expanded ? "9px 12px" : "9px 0",
                justifyContent: expanded ? "flex-start" : "center",
                borderRadius: 8,
                cursor: "pointer",
                background: isActive ? "#f4f1ec" : "transparent",
                color: isActive ? "#111" : "#666",
                fontSize: 14,
                fontWeight: isActive ? 500 : 400,
                marginBottom: 1,
                transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
                position: "relative",
              }}
              title={!expanded ? label : undefined}
            >
              <span style={{
                flexShrink: 0,
                display: "flex",
                transition: "transform 150ms ease",
              }}>
                <Icon />
              </span>
              <span style={{
                flex: 1,
                opacity: expanded ? 1 : 0,
                width: expanded ? "auto" : 0,
                overflow: "hidden",
                whiteSpace: "nowrap",
                transition: "opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}>
                {label}
              </span>
              {hasChevron && expanded && <ChevronDown />}
            </div>
          );
        })}
      </nav>

      <div style={{
        padding: expanded ? "12px 10px" : "12px 0",
        borderTop: "1px solid #eae6e0",
        display: "flex",
        alignItems: "center",
        gap: expanded ? 10 : 0,
        justifyContent: expanded ? "flex-start" : "center",
        cursor: "pointer",
        transition: "all 250ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: "50%", background: "#e8e4dc",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <UserIcon />
        </div>
        <div style={{
          flex: 1, minWidth: 0,
          opacity: expanded ? 1 : 0,
          width: expanded ? "auto" : 0,
          overflow: "hidden",
          transition: "opacity 250ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: "#111" }}>Rishu Chauhan</div>
          <div style={{ fontSize: 11, color: "#999", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            rishu.chauhan9811...
          </div>
        </div>
        {expanded && <ChevronDown />}
      </div>
    </aside>
  );
}
