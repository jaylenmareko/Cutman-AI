import { Router } from "express";
import { db, reportsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const session = req.session as any;
  const userId = session.userId;
  try {
    const reports = await db
      .select({
        id: reportsTable.id,
        fighterName: reportsTable.fighterName,
        videoSource: reportsTable.videoSource,
        status: reportsTable.status,
        createdAt: reportsTable.createdAt,
        errorMessage: reportsTable.errorMessage,
      })
      .from(reportsTable)
      .where(eq(reportsTable.userId, userId))
      .orderBy(desc(reportsTable.createdAt));
    res.json(reports);
  } catch (err) {
    console.error("Get reports error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  const session = req.session as any;
  const userId = session.userId;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid report ID" });
    return;
  }
  try {
    const [report] = await db
      .select()
      .from(reportsTable)
      .where(and(eq(reportsTable.id, id), eq(reportsTable.userId, userId)))
      .limit(1);
    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    res.json({
      id: report.id,
      fighterName: report.fighterName,
      videoSource: report.videoSource,
      status: report.status,
      createdAt: report.createdAt,
      reportContent: report.reportContent,
      errorMessage: report.errorMessage,
    });
  } catch (err) {
    console.error("Get report error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:id", requireAuth, async (req, res) => {
  const session = req.session as any;
  const userId = session.userId;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid report ID" });
    return;
  }
  try {
    const result = await db
      .delete(reportsTable)
      .where(and(eq(reportsTable.id, id), eq(reportsTable.userId, userId)))
      .returning();
    if (result.length === 0) {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    res.json({ message: "Report deleted" });
  } catch (err) {
    console.error("Delete report error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/:id/name", requireAuth, async (req, res) => {
  const session = req.session as any;
  const userId = session.userId;
  const id = parseInt(req.params.id, 10);
  const { fighterName } = req.body;
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid report ID" });
    return;
  }
  if (!fighterName) {
    res.status(400).json({ error: "fighterName is required" });
    return;
  }
  try {
    const result = await db
      .update(reportsTable)
      .set({ fighterName })
      .where(and(eq(reportsTable.id, id), eq(reportsTable.userId, userId)))
      .returning();
    if (result.length === 0) {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    res.json({ message: "Name updated" });
  } catch (err) {
    console.error("Update name error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id/status", requireAuth, async (req, res) => {
  const session = req.session as any;
  const userId = session.userId;
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid report ID" });
    return;
  }
  try {
    const [report] = await db
      .select({
        id: reportsTable.id,
        status: reportsTable.status,
        errorMessage: reportsTable.errorMessage,
      })
      .from(reportsTable)
      .where(and(eq(reportsTable.id, id), eq(reportsTable.userId, userId)))
      .limit(1);
    if (!report) {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    res.json(report);
  } catch (err) {
    console.error("Get status error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
