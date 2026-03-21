import { useState, useRef } from "react";

// ─── Design tokens (matching DraftPage) ────────────────────────────────────
const T = {
  bg:        "#ffffff",
  white:     "#ffffff",
  border:    "#eae6e0",
  borderHov: "#fdfdfd",
  black:     "#111111",
  blackHov:  "#333333",
  textSec:   "#666666",
  textMuted: "#999999",
  textLight: "#aaaaaa",
};

const TYPE_COLORS = {
  clause:     { bg: "#f0f4ff", border: "#c7d4f0", text: "#3b5998", barColor: "#6b8cce" },
  definition: { bg: "#eef8ff", border: "#b8ddf0", text: "#1a6b8a", barColor: "#4ca8cc" },
  obligation: { bg: "#fff8ee", border: "#f0d8a8", text: "#8a6520", barColor: "#d4a844" },
  recital:    { bg: "#f5f5f5", border: "#ddd",    text: "#666",    barColor: "#aaa" },
};

// ─── Icons ─────────────────────────────────────────────────────────────────

const UploadIco = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const FileIco = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);
const XIco = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const ChevDn = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);
const ChevUp = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);
const SparkSmall = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.09 6.26L20.18 9.27l-4.09 3.87 1.09 6.13L12 16.26l-5.18 2.99 1.09-6.13L3.82 9.27l6.09-1.01L12 2z"/>
  </svg>
);

// ─── Block Card ────────────────────────────────────────────────────────────

function BlockCard({ block, selected, onToggle, suggested }) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const typeStyle = TYPE_COLORS[block.type] || TYPE_COLORS.clause;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1px solid ${selected ? typeStyle.border : T.border}`,
        borderRadius: 8,
        borderLeft: `3px solid ${typeStyle.barColor}`,
        background: hovered ? "#fafaf8" : T.white,
        transition: "background 0.15s, border-color 0.15s",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex", alignItems: "flex-start", gap: 10,
          padding: "10px 12px", cursor: "pointer",
        }}
        onClick={() => onToggle(block.id)}
      >
        {/* Checkbox */}
        <div style={{
          width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 1,
          border: `1.5px solid ${selected ? T.black : T.border}`,
          background: selected ? T.black : T.white,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "all 0.15s",
        }}>
          {selected && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.black }}>{block.title}</span>
            {/* Type badge */}
            <span style={{
              fontSize: 9.5, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
              background: typeStyle.bg, border: `1px solid ${typeStyle.border}`,
              color: typeStyle.text, textTransform: "uppercase", letterSpacing: 0.3,
            }}>
              {block.type}
            </span>
            {/* Importance badge */}
            {block.importance === "high" && (
              <span style={{
                fontSize: 9.5, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c",
                textTransform: "uppercase", letterSpacing: 0.3,
              }}>
                Important
              </span>
            )}
            {/* AI suggested badge */}
            {suggested && (
              <span style={{
                fontSize: 9.5, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
                background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534",
                display: "flex", alignItems: "center", gap: 2,
              }}>
                <SparkSmall /> AI
              </span>
            )}
          </div>
          <div style={{
            fontSize: 12, color: T.textSec, lineHeight: 1.45,
            overflow: "hidden",
            display: "-webkit-box", WebkitLineClamp: expanded ? 999 : 2,
            WebkitBoxOrient: "vertical",
          }}>
            {expanded ? block.fullText : block.preview}
          </div>
        </div>

        {/* Expand toggle */}
        {block.fullText && block.fullText.length > 200 && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: T.textMuted, padding: 2, flexShrink: 0, marginTop: 2,
            }}
          >
            {expanded ? <ChevUp /> : <ChevDn />}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Parsed File Section ───────────────────────────────────────────────────

function ParsedFileSection({
  fileName, blocks, selectedBlocks, suggestedBlockIds,
  onToggleBlock, onSelectAll, onDeselectAll, parsing,
}) {
  const [expanded, setExpanded] = useState(true);
  const selectedCount = blocks.filter(b => selectedBlocks.includes(b.id)).length;

  return (
    <div style={{
      border: `1px solid ${T.border}`, borderRadius: 10,
      background: T.white, overflow: "hidden",
    }}>
      {/* File header */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", cursor: "pointer",
          borderBottom: expanded ? `1px solid ${T.border}` : "none",
        }}
      >
        <FileIco />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: T.black }}>{fileName}</span>
        {parsing ? (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11.5, color: T.textMuted,
          }}>
            <span style={{
              width: 12, height: 12,
              border: `2px solid ${T.border}`, borderTopColor: T.black,
              borderRadius: "50%", display: "inline-block",
              animation: "lexSpin .8s linear infinite",
            }} />
            Parsing…
          </span>
        ) : (
          <span style={{ fontSize: 11.5, color: T.textMuted }}>
            {selectedCount}/{blocks.length} selected
          </span>
        )}
        <span style={{ color: T.textMuted }}>{expanded ? <ChevUp /> : <ChevDn />}</span>
      </div>

      {/* Blocks */}
      {expanded && !parsing && blocks.length > 0 && (
        <div style={{ padding: "10px 12px" }}>
          {/* Bulk controls */}
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button
              onClick={onSelectAll}
              style={{
                fontSize: 11, color: T.textSec, background: "none",
                border: `1px solid ${T.border}`, borderRadius: 6,
                padding: "3px 10px", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Select all
            </button>
            <button
              onClick={onDeselectAll}
              style={{
                fontSize: 11, color: T.textSec, background: "none",
                border: `1px solid ${T.border}`, borderRadius: 6,
                padding: "3px 10px", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              Deselect all
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {blocks.map(block => (
              <BlockCard
                key={block.id}
                block={block}
                selected={selectedBlocks.includes(block.id)}
                suggested={suggestedBlockIds.includes(block.id)}
                onToggle={onToggleBlock}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function ReferenceFileIntelligence({
  files,              // Array of { file: File, fileId, fileName, blocks, parsing }
  selectedBlocks,     // Array of block IDs
  suggestedBlockIds,  // Array of auto-suggested block IDs
  onUpload,           // (fileList: FileList) => void
  onRemoveFile,       // (index) => void
  onToggleBlock,      // (blockId) => void
  onSelectAllBlocks,  // (fileIndex) => void
  onDeselectAllBlocks,// (fileIndex) => void
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  };

  const handlePick = (e) => {
    if (e.target.files.length > 0) {
      onUpload(e.target.files);
    }
    e.target.value = "";
  };

  return (
    <div>
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragOver ? T.black : T.border}`,
          borderRadius: 10, padding: "18px 16px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          cursor: "pointer", background: dragOver ? "#faf9f6" : "transparent",
          transition: "all 0.15s",
        }}
      >
        <UploadIco />
        <span style={{ fontSize: 12.5, color: T.textSec }}>
          Drop files here or <span style={{ textDecoration: "underline" }}>browse</span>
        </span>
        <span style={{ fontSize: 11, color: T.textLight }}>PDF, DOCX, TXT — max 10 MB</span>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          onChange={handlePick}
          style={{ display: "none" }}
        />
      </div>

      {/* Parsed files */}
      {files.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
          {files.map((f, i) => (
            <div key={f.fileId || i} style={{ position: "relative" }}>
              <ParsedFileSection
                fileName={f.fileName}
                blocks={f.blocks || []}
                selectedBlocks={selectedBlocks}
                suggestedBlockIds={suggestedBlockIds}
                onToggleBlock={onToggleBlock}
                onSelectAll={() => onSelectAllBlocks(i)}
                onDeselectAll={() => onDeselectAllBlocks(i)}
                parsing={f.parsing}
              />
              {/* Remove file button */}
              <button
                onClick={() => onRemoveFile(i)}
                style={{
                  position: "absolute", top: 8, right: 40,
                  background: "none", border: "none", cursor: "pointer",
                  color: T.textMuted, padding: 2,
                }}
                title="Remove file"
              >
                <XIco size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
