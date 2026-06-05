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

// Mounting modules
app.use("/admin/auth", adminAuthRouter);
app.use("/markers", markersRouter);
app.use("/markers", reportsRouter);
app.use("/guides", guidesRouter);

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
