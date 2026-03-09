import Logo from "../components/Logo";
import { ChevronDown } from "../icons";

export default function LandingPage({ onLogin }) {
  return (
    <div style={{ minHeight: "100vh", background: "#faf9f6", display: "flex", flexDirection: "column" }}>
      {/* Navbar */}
      <header style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: 60,
        borderBottom: "1px solid #e9e5df", background: "#faf9f6",
      }}>
        <Logo />
        <nav style={{ display: "flex", alignItems: "center", gap: 36 }}>
          {[
            { label: "Features", hasChevron: true },
            { label: "About" },
            { label: "Contact" },
            { label: "Trust Center" },
          ].map(({ label, hasChevron }) => (
            <a key={label} href="#" style={{ color: "#333", fontSize: 14, display: "flex", alignItems: "center", gap: 3, textDecoration: "none" }}>
              {label}{hasChevron && <ChevronDown />}
            </a>
          ))}
        </nav>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={onLogin} style={{
            padding: "8px 18px", border: "1px solid #d4d0ca", borderRadius: 8,
            background: "white", fontSize: 14, cursor: "pointer", color: "#333",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            Login <span style={{ fontSize: 16, lineHeight: 1 }}>›</span>
          </button>
          <button onClick={onLogin} style={{
            padding: "8px 18px", border: "none", borderRadius: 8,
            background: "#111", color: "white", fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            See how it works <span style={{ fontSize: 16, lineHeight: 1 }}>›</span>
          </button>
        </div>
      </header>

      {/* Hero */}
      <main style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "80px 48px", textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 44,
          border: "1px solid #e0dbd3", borderRadius: 100, padding: "5px 14px 5px 5px",
          background: "white",
        }}>
          <span style={{
            background: "#16a34a", color: "white", fontSize: 11, fontWeight: 700,
            padding: "3px 10px", borderRadius: 100, letterSpacing: "0.3px",
          }}>Meet Us</span>
          <span style={{ fontSize: 13, color: "#555" }}>NVIDIA GTC, San Jose Mar 16-19</span>
        </div>

        <h1 style={{
          fontSize: 76, lineHeight: 1.08, color: "#111", marginBottom: 24,
          fontWeight: 400, letterSpacing: "-3px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}>
          In law, <strong style={{ fontWeight: 700 }}>trust</strong> is everything
        </h1>

        <p style={{ fontSize: 21, color: "#555", maxWidth: 680, lineHeight: 1.55, marginBottom: 44 }}>
          Lexlegis.ai is a trusted legal AI platform built on decades of legal expertise
          and modern artificial intelligence.
        </p>

        <div style={{ display: "flex", gap: 12, marginBottom: 80 }}>
          <button onClick={onLogin} style={{
            padding: "13px 28px", background: "#111", color: "white", border: "none",
            borderRadius: 8, fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
          }}>
            Start Trial <span style={{ fontSize: 18 }}>›</span>
          </button>
          <button style={{
            padding: "13px 28px", background: "white", color: "#111",
            border: "1px solid #ccc", borderRadius: 8, fontSize: 16, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            Book a Demo <span style={{ fontSize: 18 }}>›</span>
          </button>
        </div>

        <p style={{ fontSize: 13, color: "#aaa" }}>Used by trusted brands</p>
      </main>
    </div>
  );
}
