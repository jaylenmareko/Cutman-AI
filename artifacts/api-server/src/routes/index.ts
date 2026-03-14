import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import uploadRouter from "./upload.js";
import analyzeRouter from "./analyze.js";
import reportsRouter from "./reports.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/upload", uploadRouter);
router.use("/analyze", analyzeRouter);
router.use("/reports", reportsRouter);

export default router;
