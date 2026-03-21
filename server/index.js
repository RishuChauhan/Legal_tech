import express from "express";
import cors from "cors";
import draftRoutes from "./routes/draft.js";
import documentRoutes from "./routes/documents.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));

// Routes
app.use("/api/draft", draftRoutes);
app.use("/api/documents", documentRoutes);

// Health check
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`Lexlegis server running on port ${PORT}`);
});
