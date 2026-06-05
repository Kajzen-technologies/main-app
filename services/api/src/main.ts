import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

dotenv.config();

import { adminAuthRouter } from "./modules/admin-auth/admin-auth.controller";
import { markersRouter, adminMarkersRouter } from "./modules/markers/markers.controller";
import { reportsRouter } from "./modules/reports/reports.controller";
import { guidesRouter, adminGuidesRouter } from "./modules/guides/guides.controller";
import { analyticsRouter } from "./modules/analytics/analytics.controller";

const app = express();
const port = process.env.PORT || 3001;

// CORS configuration supporting session credentials for web and admin dashboards
app.use(
  cors({
    origin: true, // Allow all origins for the MVP development environment
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser(process.env.ADMIN_SESSION_SECRET || "change-me-session-secret"));

// Public Health Check
app.get("/health", (_req, res) => {
  return res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

import { prisma } from "./modules/database/prisma";

// In-memory store for SOS signals for MVP dashboard/logging
let sosSignals: any[] = [];

// Mounting modules
app.use("/admin/auth", adminAuthRouter);
app.use("/markers", markersRouter);
app.use("/markers", reportsRouter);
app.use("/guides", guidesRouter);

app.post("/emergency/sos", (req, res) => {
  const { latitude, longitude, phone, name, localUserId } = req.body;
  const newSignal = {
    id: `sos_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    latitude,
    longitude,
    phone,
    name,
    localUserId,
    createdAt: new Date().toISOString()
  };
  sosSignals.push(newSignal);
  console.log(`[SOS Signal Received] User: ${name}, Phone: ${phone}, Coords: ${latitude}, ${longitude}`);
  return res.json({ success: true, signal: newSignal });
});

app.get("/emergency/sos", (_req, res) => {
  return res.json(sosSignals);
});

app.post("/users/volunteer", async (req, res) => {
  const { name, phone, roles, zone, localUserId } = req.body;
  try {
    const user = await prisma.user.upsert({
      where: { localUserId: localUserId || "anonymous" },
      update: { name, phone },
      create: { localUserId: localUserId || "anonymous", name, phone }
    });
    console.log(`[Volunteer registered] User: ${name}, Phone: ${phone}, Roles: ${roles?.join(", ")}, Zone: ${zone}`);
    return res.json({ success: true, user });
  } catch (err: any) {
    console.error("Failed to register volunteer:", err);
    return res.status(500).json({ error: "Internal Server Error", message: err.message });
  }
});

app.use("/admin/markers", adminMarkersRouter);
app.use("/admin/guides", adminGuidesRouter);
app.use("/admin/analytics", analyticsRouter);

// 404 Route handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled API error:", err);
  return res.status(500).json({ error: "Internal Server Error", message: err.message });
});

app.listen(port, () => {
  console.log(`Prague Blackout Resilience API listening at http://localhost:${port}`);
});
