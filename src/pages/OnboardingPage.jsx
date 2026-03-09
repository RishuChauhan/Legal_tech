import React, { useState } from "react";
import Logo from "../components/Logo";
import { ChatIcon, DocIcon, EditIcon } from "../icons";

function OptionCard({ id, icon: Icon, title, description, onComplete }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onComplete(id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        background: "white",
        border: "1px solid #eae6e0",
        borderRadius: 12,
        padding: "18px 20px",
        marginBottom: 12,
        cursor: "pointer",
        borderColor: hovered ? "#3b4a5c" : "#eae6e0",
        boxShadow: hovered ? "0 2px 12px rgba(0,0,0,0.07)" : "none",
        transition: "border-color 0.18s, box-shadow 0.18s",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          background: "#f4f1ec",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#3b4a5c",
        }}
      >
        <Icon />
      </div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: "#111" }}>{title}</div>
        <div style={{ fontSize: 13, color: "#888", lineHeight: 1.5 }}>{description}</div>
      </div>
      <div style={{ color: "#ccc", fontSize: 20 }}>›</div>
    </div>
  );
}

export default function OnboardingPage({ onComplete }) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "#faf9f6",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "auto",
      }}
    >
      <div
        style={{
          maxWidth: 480,
          margin: "0 auto",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: 48, paddingTop: 48 }}>
          <Logo />
        </div>
        <h1 style={{
          fontSize: 26,
          fontWeight: 700,
          color: "#111",
          marginBottom: 8,
          letterSpacing: "-0.5px",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        }}>
          Welcome to Lexlegis.ai
        </h1>
        <p style={{ fontSize: 14, color: "#9ca3af", marginBottom: 32 }}>
          What would you like to do first?
        </p>

        <div style={{ width: "100%" }}>
          <OptionCard
            id="ask"
            icon={ChatIcon}
            title="Ask a legal question"
            description="Get instant answers backed by 14M+ verified judgements"
            onComplete={onComplete}
          />
          <OptionCard
            id="interact"
            icon={DocIcon}
            title="Analyse a document or judgement"
            description="Upload a file and extract insights, summaries and risks"
            onComplete={onComplete}
          />
          <OptionCard
            id="draft"
            icon={EditIcon}
            title="Draft a legal document"
            description="Generate appeals, contracts, notices and more in minutes"
            onComplete={onComplete}
          />
        </div>

        <div
          onClick={() => onComplete("dashboard")}
          style={{
            fontSize: 13,
            color: "#9ca3af",
            textDecoration: "underline",
            cursor: "pointer",
            marginTop: 24,
            paddingBottom: 48,
          }}
        >
          I'll explore on my own →
        </div>
      </div>
    </div>
  );
}
