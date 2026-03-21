import { Router } from "express";
import { analyseIntent } from "../services/nlp.js";
import { generateDraftContent } from "../services/draftGenerator.js";

const router = Router();

// POST /api/draft/analyse
router.post("/analyse", async (req, res) => {
  try {
    const { intent } = req.body;
    if (!intent || typeof intent !== "string" || intent.trim().length === 0) {
      return res.status(400).json({ error: "Intent text is required" });
    }
    if (intent.length > 5000) {
      return res.status(400).json({ error: "Intent text must be under 5000 characters" });
    }
    const result = await analyseIntent(intent.trim());
    res.json(result);
  } catch (err) {
    console.error("Analyse error:", err);
    res.status(500).json({ error: "Analysis failed", message: err.message });
  }
});

// POST /api/draft/generate
router.post("/generate", async (req, res) => {
  try {
    const { documentType, template, clauses, rulebooks, referenceBlocks, instructions, entities } = req.body;
    if (!documentType) {
      return res.status(400).json({ error: "documentType is required" });
    }
    const result = await generateDraftContent({
      documentType, template, clauses, rulebooks,
      referenceBlocks, instructions, entities,
    });
    res.json(result);
  } catch (err) {
    console.error("Generate error:", err);
    res.status(500).json({ error: "Generation failed", message: err.message });
  }
});

export default router;
