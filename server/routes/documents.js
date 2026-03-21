import { Router } from "express";
import multer from "multer";
import { parseDocument } from "../services/docParser.js";
import { suggestRelevantBlocks } from "../services/docParser.js";

const router = Router();
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
    const result = await parseDocument(req.file);
    res.json(result);
  } catch (err) {
    console.error("Parse error:", err);
    if (err.message?.includes("Unsupported file type")) {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: "Document parsing failed", message: err.message });
  }
});

// POST /api/documents/suggest-blocks
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
