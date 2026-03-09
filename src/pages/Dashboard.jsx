import { ChatIcon, DocIcon, EditIcon, BulbIcon } from "../icons";

const cards = [
  {
    id: "ask", Icon: ChatIcon, title: "Ask",
    desc: "Get concise and meaningful answers to your legal queries in seconds without hallucination and an Explainable AI (XAI) conclusion, complete with supporting citations.",
  },
  {
    id: "interact", Icon: DocIcon, title: "Interact",
    desc: "Upload multiple legal documents and query them to get summaries and valuable insights across documents.",
  },
  {
    id: "draft", Icon: EditIcon, title: "Draft",
    desc: "Draft legal documents effortlessly, saving hours in drafting appeals, orders, contracts, submissions and legal responses.",
  },
];

export default function Dashboard({ onNav }) {
  return (
    <div style={{ flex: 1, background: "#faf9f6", padding: "36px 36px", overflowY: "auto" }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, color: "#111", marginBottom: 28 }}>Dashboard</h1>

      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#111", marginBottom: 4 }}>Welcome, Rishu Chauhan</h2>
        <p style={{ fontSize: 13, color: "#999" }}>Choose how you'd like to work today</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 36 }}>
        {cards.map(({ id, Icon, title, desc }) => (
          <div key={id} onClick={() => onNav(id)} style={{
            background: "white", border: "1px solid #eae6e0", borderRadius: 12,
            padding: "26px 24px", cursor: "pointer",
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.06)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
          >
            <div style={{ color: "#666", marginBottom: 16 }}><Icon /></div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#111", marginBottom: 8 }}>{title}</h3>
            <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>{desc}</p>
          </div>
        ))}
      </div>

      <p style={{ fontSize: 13, color: "#aaa", marginBottom: 14 }}>Resources</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: "white", border: "1px solid #eae6e0", borderRadius: 12, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <BulbIcon />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.8px" }}>TIP</span>
          </div>
          <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>
            Use tags in the Library to categorise and quickly find your items.
          </p>
        </div>
        <div style={{ background: "white", border: "1px solid #eae6e0", borderRadius: 12, padding: "20px 22px" }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#111", marginBottom: 6 }}>Help Guides</h4>
          <p style={{ fontSize: 13, color: "#888", lineHeight: 1.6, marginBottom: 10 }}>
            User guides, FAQs, and other resources to help you use Lexlegis.ai effectively.
          </p>
          <a href="#" style={{ fontSize: 13, color: "#111", display: "flex", alignItems: "center", gap: 4, fontWeight: 500, textDecoration: "none" }}>
            View help articles <span style={{ fontSize: 16 }}>›</span>
          </a>
        </div>
      </div>
    </div>
  );
}
