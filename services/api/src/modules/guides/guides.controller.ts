import { Router } from "express";
import { guidesService } from "./guides.service";
import { requireAdmin } from "../admin-auth/require-admin.middleware";

export const guidesRouter = Router();

// Public routes
guidesRouter.get("/", async (_req, res) => {
  const list = await guidesService.getPublishedGuides();
  return res.json(list);
});

guidesRouter.get("/:slug", async (req, res) => {
  const guide = await guidesService.getGuideBySlug(req.params.slug);
  if (!guide) {
    return res.status(404).json({ error: "Guide not found." });
  }
  return res.json(guide);
});

// Admin routes (routed internally through main router mapping prefix /admin/guides)
export const adminGuidesRouter = Router();

adminGuidesRouter.get("/", requireAdmin, async (_req, res) => {
  const list = await guidesService.getAdminGuides();
  return res.json(list);
});

adminGuidesRouter.get("/:id", requireAdmin, async (req, res) => {
  const guide = await guidesService.getGuideById(req.params.id);
  if (!guide) {
    return res.status(404).json({ error: "Guide not found." });
  }
  return res.json(guide);
});

adminGuidesRouter.post("/", requireAdmin, async (req, res) => {
  try {
    const guide = await guidesService.createGuide(req.body);
    return res.status(201).json(guide);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

adminGuidesRouter.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const guide = await guidesService.updateGuide(req.params.id, req.body);
    return res.json(guide);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

adminGuidesRouter.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await guidesService.deleteGuide(req.params.id);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});
