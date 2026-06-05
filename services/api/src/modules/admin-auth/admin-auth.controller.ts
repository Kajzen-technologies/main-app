import { Router, Response } from "express";
import { adminAuthService } from "./admin-auth.service";
import { RequestWithAdminSession, requireAdmin } from "./require-admin.middleware";

export const adminAuthRouter = Router();

adminAuthRouter.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  const session = await adminAuthService.login(email, password);
  if (!session) {
    return res.status(401).json({ error: "Invalid email or password." });
  }

  res.cookie("admin_session", session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
  });

  return res.json({ success: true, session });
});

adminAuthRouter.post("/logout", async (req, res) => {
  const sessionId = req.cookies?.admin_session || req.headers["x-admin-session-id"];
  if (sessionId && typeof sessionId === "string") {
    await adminAuthService.logout(sessionId);
  }
  res.clearCookie("admin_session");
  return res.json({ success: true });
});

adminAuthRouter.get("/me", requireAdmin, (req: RequestWithAdminSession, res: Response) => {
  return res.json({ admin: req.adminSession });
});
