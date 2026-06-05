import { Router } from "express";
import { requireAdmin } from "../admin-auth/require-admin.middleware";
import { analyticsService } from "./analytics.service";

export const analyticsRouter = Router();

analyticsRouter.get("/overview", requireAdmin, async (_req, res) => {
  const data = await analyticsService.getOverviewData();
  return res.json(data);
});

analyticsRouter.get("/reports-by-issue-type", requireAdmin, async (_req, res) => {
  const data = await analyticsService.getReportsByIssueType();
  return res.json(data);
});

analyticsRouter.get("/reports-by-category", requireAdmin, async (_req, res) => {
  const data = await analyticsService.getReportsByCategory();
  return res.json(data);
});

analyticsRouter.get("/markers-needing-review", requireAdmin, async (_req, res) => {
  const data = await analyticsService.getMarkersNeedingReview();
  return res.json(data);
});

analyticsRouter.get("/problem-areas", requireAdmin, async (_req, res) => {
  const data = await analyticsService.getProblemAreas();
  return res.json(data);
});
