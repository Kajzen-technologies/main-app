import { Router, Response } from "express";
import { markersService } from "./markers.service";
import { markerCategoryService } from "./marker-category.service";
import { CreateMarkerSchema } from "shared";
import { requireAdmin, RequestWithAdminSession } from "../admin-auth/require-admin.middleware";
import { prisma } from "../database/prisma";
import { VerificationStatus } from "@prisma/client";

export const markersRouter = Router();

// Public routes
markersRouter.get("/", async (req, res) => {
  const { category, status } = req.query;
  const list = await markersService.getApprovedMarkers(
    category as string,
    status as string
  );
  return res.json(list);
});

markersRouter.get("/categories", (_req, res) => {
  return res.json(markerCategoryService.getCategories());
});

markersRouter.get("/:id", async (req, res) => {
  const marker = await markersService.getMarkerById(req.params.id);
  if (!marker) {
    return res.status(404).json({ error: "Marker not found." });
  }
  return res.json(marker);
});

markersRouter.post("/", async (req, res) => {
  const validation = CreateMarkerSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: "Invalid payload.", details: validation.error.format() });
  }

  try {
    const newMarker = await markersService.suggestMarker(validation.data);
    return res.status(201).json({
      message: "Děkujeme. Místo bylo odesláno ke kontrole.",
      messageEn: "Thank you. The place has been submitted for review.",
      marker: newMarker,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Admin-protected routes (routed internally through main router mapping prefix /admin/markers)
// To prevent route collision or make routes match the prompt list, let's map /admin/markers endpoints here:
export const adminMarkersRouter = Router();

adminMarkersRouter.get("/pending", requireAdmin, async (_req, res) => {
  const list = await markersService.getPendingMarkers();
  return res.json(list);
});

adminMarkersRouter.get("/:id", requireAdmin, async (req, res) => {
  const marker = await markersService.getMarkerById(req.params.id);
  if (!marker) {
    return res.status(404).json({ error: "Marker not found." });
  }
  return res.json(marker);
});

adminMarkersRouter.get("/:id/reports", requireAdmin, async (req, res) => {
  const marker = await markersService.getMarkerById(req.params.id);
  if (!marker) {
    return res.status(404).json({ error: "Marker not found." });
  }
  // @ts-ignore
  return res.json(marker.reports || []);
});

adminMarkersRouter.patch("/:id/approve", requireAdmin, async (req: RequestWithAdminSession, res) => {
  try {
    const adminId = req.adminSession?.id;
    const marker = await markersService.approveMarker(req.params.id, adminId);
    return res.json({ success: true, marker });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

adminMarkersRouter.patch("/:id/reject", requireAdmin, async (req, res) => {
  try {
    const marker = await markersService.rejectMarker(req.params.id);
    return res.json({ success: true, marker });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

adminMarkersRouter.patch("/:id/needs-review", requireAdmin, async (req, res) => {
  try {
    const marker = await markersService.updateMarker(req.params.id, {
      verificationStatus: VerificationStatus.NEEDS_REVIEW,
    });
    return res.json({ success: true, marker });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

adminMarkersRouter.patch("/:id/confirm-status", requireAdmin, async (req, res) => {
  try {
    const { publicStatus } = req.body;
    if (!publicStatus) {
      return res.status(400).json({ error: "publicStatus is required." });
    }
    const marker = await markersService.updateMarker(req.params.id, {
      publicStatus,
      verificationStatus: VerificationStatus.APPROVED,
    });
    return res.json({ success: true, marker });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

adminMarkersRouter.patch("/:id/dismiss-reports", requireAdmin, async (req, res) => {
  try {
    await prisma.markerReport.deleteMany({
      where: { markerId: req.params.id },
    });
    const marker = await markersService.updateMarker(req.params.id, {
      verificationStatus: VerificationStatus.APPROVED,
    });
    return res.json({ success: true, marker });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

adminMarkersRouter.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const marker = await markersService.updateMarker(req.params.id, req.body);
    return res.json({ success: true, marker });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

adminMarkersRouter.delete("/:id", requireAdmin, async (req, res) => {
  try {
    await markersService.deleteMarker(req.params.id);
    return res.json({ success: true });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});
