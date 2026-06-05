import { Request, Response, NextFunction } from "express";
import { adminAuthService } from "./admin-auth.service";
import { AdminSession } from "./admin-session.types";

export interface RequestWithAdminSession extends Request {
  adminSession?: AdminSession;
}

export async function requireAdmin(
  req: RequestWithAdminSession,
  res: Response,
  next: NextFunction
) {
  const sessionId = req.cookies?.admin_session || req.headers["x-admin-session-id"];

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(401).json({ error: "Unauthorized. Admin session required." });
  }

  const session = await adminAuthService.validateSession(sessionId);
  if (!session) {
    res.clearCookie("admin_session");
    return res.status(401).json({ error: "Session expired or invalid." });
  }

  req.adminSession = session;
  next();
}
