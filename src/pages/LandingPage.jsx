import { useState, useEffect, useRef } from "react";
import Logo from "../components/Logo";
import { ChevronDown } from "../icons";

const LOGOS = [
  { name: "Thermax",      label: "THERMAX",                style: { fontWeight: 700, fontSize: 13, letterSpacing: "0.15em" } },
  { name: "Aurtus",       label: "AURTUS »",               style: { fontWeight: 600, fontSize: 15, letterSpacing: "0.05em" } },
  { name: "KPMG",         label: "KPMG",                   style: { fontWeight: 800, fontSize: 18, letterSpacing: "0.08em" } },
  { name: "mygate",       label: "mygate",                 style: { fontWeight: 700, fontSize: 16, letterSpacing: "0.02em" } },
  { name: "dhruva",       label: "dhruva",                 style: { fontWeight: 300, fontSize: 15, letterSpacing: "0.18em" } },
  { name: "Tata Power",   label: "TATA POWER",             style: { fontWeight: 700, fontSize: 12, letterSpacing: "0.12em" } },
  { name: "Greaves",      label: "GREAVES",                style: { fontWeight: 800, fontSize: 16, letterSpacing: "0.06em" } },
  { name: "Artha Energy", label: "Artha Energy Resources", style: { fontWeight: 400, fontSize: 12, letterSpacing: "0.03em" } },
];

const MILESTONES = [
  { year: "1937", desc: "Adv. Ganesh Lal Mandal started documenting legal issues" },
  { year: "1996", desc: "S C Yadav (IRS) introduced structured searchable legal knowledge frameworks" },
  { year: "2014", desc: "Built fine-grained metadata schemas for India's largest appeals repository" },
  { year: "2025", desc: "Launched Lexlegis.AI" },
];

export default function LandingPage({ onLogin }) {
  const [scrolled, setScrolled] = useState(false);
  const ctaRef = useRef(null);

  // Watch when the hero CTA buttons scroll out of view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-60px 0px 0px 0px" }
    );
    if (ctaRef.current) observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ background: "#ffffff" }}>

      {/* Keyframe injection */}
      <style>{`
        @keyframes navCtaIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0)    scale(1);    }
        }
        @keyframes navCtaOut {
          from { opacity: 1; transform: translateY(0)    scale(1);    }
          to   { opacity: 0; transform: translateY(-6px) scale(0.95); }
        }
        .nav-cta {
          animation: navCtaIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      {/* ── Sticky Navbar ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 48px", height: 60,
        borderBottom: "1px solid #ffffff",
        background: "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(8px)",
        transition: "box-shadow 0.3s",
        boxShadow: scrolled ? "0 2px 16px rgba(0,0,0,0.06)" : "none",
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

          {/* Animated "Start Free Trial" — only visible after scroll */}
          {scrolled && (
            <button
              className="nav-cta"
              onClick={onLogin}
              style={{
                padding: "8px 18px", border: "none", borderRadius: 8,
                background: "#111", color: "white", fontSize: 14,
                cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
                fontWeight: 600,
              }}
            >
              Start Trial <span style={{ fontSize: 16, lineHeight: 1 }}>›</span>
            </button>
          )}

          <button onClick={onLogin} style={{
            padding: "8px 18px", border: "1px solid #d4d0ca", borderRadius: 8,
            background: "white", fontSize: 14, cursor: "pointer", color: "#333",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            Login <span style={{ fontSize: 16, lineHeight: 1 }}>›</span>
          </button>

          {/* "See how it works" fades out when trial CTA appears to avoid crowding */}
          <button onClick={onLogin} style={{
            padding: "8px 18px", border: "none", borderRadius: 8,
            background: scrolled ? "transparent" : "#111",
            border: scrolled ? "1px solid #d4d0ca" : "none",
            color: scrolled ? "#333" : "white",
            fontSize: 14, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
            transition: "all 0.3s ease",
          }}>
            See how it works <span style={{ fontSize: 16, lineHeight: 1 }}>›</span>
          </button>

        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{
        minHeight: "calc(100vh - 60px)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "80px 48px", textAlign: "center",
      }}>
        <div style={{
          display: "inline-flex",
          alignItems: "center", gap: 8, marginBottom: 44,
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
        }}>
          In law, <strong style={{ fontWeight: 700 }}>trust</strong> is everything
        </h1>

        <p style={{ fontSize: 21, color: "#555", maxWidth: 680, lineHeight: 1.55, marginBottom: 44 }}>
          Lexlegis.ai is a trusted legal AI platform built on decades of legal expertise
          and modern artificial intelligence.
        </p>

        {/* ref anchor — when this leaves the viewport, nav CTA appears */}
        <div ref={ctaRef} style={{ display: "flex", gap: 12, marginBottom: 80 }}>
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

        <p style={{ fontSize: 13, color: "#aaa", marginBottom: 36 }}>Used by trusted brands</p>

        {/* Logo strip */}
        <div style={{
          width: "100%", maxWidth: 900,
          display: "flex", flexWrap: "wrap",
          justifyContent: "center", alignItems: "center",
          gap: "28px 48px",
        }}>
          {LOGOS.map(({ name, label, style }) => (
            <span key={name} style={{ color: "#aaa", userSelect: "none", ...style }}>
              {label}
            </span>
          ))}
        </div>
      </section>

      {/* ── Journey / Timeline section ── */}
      <section style={{
        background: "#ffffff",
        padding: "100px 48px 120px",
        textAlign: "center",
        borderTop: "1px solid #ede9e2",
      }}>
        <h2 style={{
          fontSize: 56, lineHeight: 1.1, color: "#111",
          fontWeight: 700, letterSpacing: "-2px",
          maxWidth: 680, margin: "0 auto 20px",
        }}>
          Our journey to legal AI<br />started 90 years ago
        </h2>

        <p style={{
          fontSize: 15, color: "#888", maxWidth: 580,
          margin: "0 auto 72px", lineHeight: 1.6,
        }}>
          The foundation of Lexlegis.ai lies in decades of legal knowledge and structured legal intelligence.
        </p>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 40,
          maxWidth: 900,
          margin: "0 auto",
          textAlign: "left",
        }}>
          {MILESTONES.map(({ year, desc }) => (
            <div key={year}>
              <p style={{ fontSize: 26, fontWeight: 700, color: "#111", marginBottom: 12, letterSpacing: "-0.5px" }}>
                {year}
              </p>
              <p style={{ fontSize: 14, color: "#666", lineHeight: 1.65 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}