import { prisma } from "../database/prisma";
import { AdminSession } from "./admin-session.types";

export class AdminAuthService {
  private getDemoCredentials() {
    return {
      email: process.env.ADMIN_DEMO_EMAIL || "admin@praha-blackout.demo",
      password: process.env.ADMIN_DEMO_PASSWORD || "change-me-demo-password",
    };
  }

  async login(email: string, password: string): Promise<AdminSession | null> {
    const creds = this.getDemoCredentials();
    if (email !== creds.email || password !== creds.password) {
      return null;
    }

    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours

    const session = await prisma.adminSession.create({
      data: {
        email,
        role: "ADMIN",
        expiresAt,
      },
    });

    return {
      id: session.id,
      email: session.email,
      role: "ADMIN",
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
    };
  }

  async logout(sessionId: string): Promise<void> {
    try {
      await prisma.adminSession.delete({
        where: { id: sessionId },
      });
    } catch {
      // Ignore if session not found
    }
  }

  async validateSession(sessionId: string): Promise<AdminSession | null> {
    if (!sessionId) return null;
    try {
      const session = await prisma.adminSession.findUnique({
        where: { id: sessionId },
      });

      if (!session) return null;

      if (new Date() > session.expiresAt) {
        await this.logout(sessionId);
        return null;
      }

      return {
        id: session.id,
        email: session.email,
        role: "ADMIN",
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
      };
    } catch {
      return null;
    }
  }
}

export const adminAuthService = new AdminAuthService();
