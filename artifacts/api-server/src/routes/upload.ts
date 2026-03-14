import { Router } from "express";
import multer from "multer";
import path from "path";
import { db, reportsTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

const storage = multer.diskStorage({
  destination: "/tmp",
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".mp4", ".mov", ".avi"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only mp4, mov, and avi files are accepted"));
    }
  },
});

router.post("/", requireAuth, upload.single("video"), async (req, res) => {
  const session = req.session as any;
  const userId = session.userId;
  const fighterName = req.body.fighterName || null;
  const youtubeUrl = req.body.youtubeUrl || null;

  if (!req.file && !youtubeUrl) {
    res.status(400).json({ error: "Either a video file or a YouTube URL is required" });
    return;
  }
  if (req.file && youtubeUrl) {
    res.status(400).json({ error: "Provide either a video file or a YouTube URL, not both" });
    return;
  }

  const videoSource = req.file ? req.file.filename : youtubeUrl;

  try {
    const [report] = await db
      .insert(reportsTable)
      .values({
        userId,
        fighterName,
        videoSource,
        status: "pending",
      })
      .returning();

    res.status(201).json({
      id: report.id,
      fighterName: report.fighterName,
      videoSource: report.videoSource,
      status: report.status,
      createdAt: report.createdAt,
      errorMessage: null,
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
