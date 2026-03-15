import { Router } from "express";
import path from "path";
import fs from "fs";
import { db, reportsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { getOrCreateIndex, uploadVideoFile, uploadYouTubeUrl, analyzeVideo } from "../services/twelvelabs.js";
import { generateScoutingReport } from "../services/claude.js";

const router = Router();

async function runAnalysisPipeline(reportId: number, userId: number) {
  const [report] = await db
    .select()
    .from(reportsTable)
    .where(and(eq(reportsTable.id, reportId), eq(reportsTable.userId, userId)))
    .limit(1);

  if (!report) return;

  const videoSource = report.videoSource || "";
  const isYouTube = videoSource.startsWith("http");

  try {
    await db.update(reportsTable).set({ status: "processing" }).where(eq(reportsTable.id, reportId));

    const { id: indexId, name: indexName } = await getOrCreateIndex(userId);

    let videoId: string;
    if (isYouTube) {
      videoId = await uploadYouTubeUrl(indexId, videoSource);
    } else {
      const filePath = path.join("/tmp", videoSource);
      videoId = await uploadVideoFile(indexId, filePath);
      try {
        fs.unlinkSync(filePath);
      } catch (_) {}
    }

    const rawAnalysis = await analyzeVideo(indexId, indexName, videoId);
    const reportContent = await generateScoutingReport(rawAnalysis);

    await db
      .update(reportsTable)
      .set({
        status: "complete",
        rawTwelvelabsAnalysis: rawAnalysis,
        reportContent,
      })
      .where(eq(reportsTable.id, reportId));
  } catch (err: any) {
    console.error(`Analysis pipeline error for report ${reportId}:`, err);
    await db
      .update(reportsTable)
      .set({ status: "error", errorMessage: err?.message || "Unknown error" })
      .where(eq(reportsTable.id, reportId));
  }
}

router.post("/:reportId", requireAuth, async (req, res) => {
  const session = req.session as any;
  const userId = session.userId;
  const reportId = parseInt(req.params.reportId, 10);

  if (isNaN(reportId)) {
    res.status(400).json({ error: "Invalid report ID" });
    return;
  }

  const [report] = await db
    .select()
    .from(reportsTable)
    .where(and(eq(reportsTable.id, reportId), eq(reportsTable.userId, userId)))
    .limit(1);

  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }

  res.json({ message: "Analysis started" });

  setImmediate(() => {
    runAnalysisPipeline(reportId, userId);
  });
});

export default router;
