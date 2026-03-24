import { Router } from "express";
import multer from "multer";
import { parseDocument, suggestRelevantBlocks } from "../services/docParser.js";

const router = Router();

// In-memory store for reference context keyed by fileId
export const referenceContextStore = new Map();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type. Only PDF, DOCX, and TXT are accepted."));
    }
  },
});

// POST /api/documents/parse
router.post("/parse", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Step 1: Full parse (keeps all existing logic intact)
    const result = await parseDocument(req.file);

    // Step 2: Silently run block suggestion and build reference context
    const blocks = result.blocks || [];
    const wordCount = blocks.reduce((sum, b) => sum + (b.fullText || "").split(/\s+/).length, 0);
    const pageCount = Math.max(1, Math.ceil(wordCount / 300));

    if (blocks.length > 0) {
      // Score all blocks using suggestRelevantBlocks with empty context
      // (intent/clauses not known yet — score by importance and type)
      const scored = blocks.map(block => {
        let score = 0;
        if (block.importance === "high") score += 20;
        if (block.type === "obligation") score += 10;
        if (block.type === "clause") score += 5;
        // Longer blocks are more useful for context
        const textLen = (block.fullText || "").split(/\s+/).length;
        if (textLen > 50) score += 5;
        return { block, score };
      });

      // Take top 6 by score
      scored.sort((a, b) => b.score - a.score);
      const topBlocks = scored.slice(0, 6).map(s => s.block);

      // Build reference context string with truncated text (400 words max)
      const contextParts = topBlocks.map(b => {
        const words = (b.fullText || "").split(/\s+/);
        const truncated = words.slice(0, 400).join(" ");
        return `[${b.title}]\n${truncated}`;
      });

      const referenceContext = "Reference document context (use for stylistic and structural guidance when drafting equivalent sections):\n\n" +
        contextParts.join("\n\n");

      referenceContextStore.set(result.fileId, referenceContext);
    }

    // Step 3: Return simplified response (no blocks)
    res.json({
      fileId: result.fileId,
      fileName: result.fileName,
      wordCount,
      pageCount,
    });
  } catch (err) {
    console.error("Parse error:", err);
    if (err.message?.includes("Unsupported file type")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Document parsing failed", message: err.message });
  }
});

// POST /api/documents/suggest-blocks (kept for backwards compatibility)
router.post("/suggest-blocks", async (req, res) => {
  try {
    const { blocks, intent, documentType, selectedClauses } = req.body;
    if (!blocks || !Array.isArray(blocks)) {
      return res.status(400).json({ error: "blocks array is required" });
    }
    const result = suggestRelevantBlocks(blocks, { intent, documentType, selectedClauses });
    res.json(result);
  } catch (err) {
    console.error("Suggest blocks error:", err);
    res.status(500).json({ error: "Block suggestion failed", message: err.message });
  }
});

export default router;
