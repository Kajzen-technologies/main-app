import { prisma } from "../database/prisma";
import { VerificationStatus, PublicStatus, CrowdLevel } from "@prisma/client";

export class MarkersRepository {
  async getApproved(filters: { category?: string; status?: string }) {
    try {
      return await prisma.marker.findMany({
        where: {
          verificationStatus: {
            in: [VerificationStatus.APPROVED, VerificationStatus.NEEDS_REVIEW],
          },
          ...(filters.category ? { category: filters.category } : {}),
          ...(filters.status ? { publicStatus: filters.status as PublicStatus } : {}),
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch (e) {
      console.error("Database error in getApproved, returning empty array:", e);
      return [];
    }
  }

  async getPending() {
    try {
      return await prisma.marker.findMany({
        where: {
          verificationStatus: VerificationStatus.PENDING,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } catch {
      return [];
    }
  }

  async findById(id: string) {
    try {
      return await prisma.marker.findUnique({
        where: { id },
        include: {
          reports: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });
    } catch {
      return null;
    }
  }

  async create(data: any) {
    return prisma.marker.create({
      data: {
        title: data.title,
        description: data.description || null,
        category: data.category,
        latitude: Number(data.latitude),
        longitude: Number(data.longitude),
        address: data.address || null,
        verificationStatus: VerificationStatus.PENDING,
        publicStatus: PublicStatus.UNKNOWN,
        crowdLevel: CrowdLevel.UNKNOWN,
        submittedByLocalUserId: data.submittedByLocalUserId || null,
      },
    });
  }

  async update(id: string, data: any) {
    return prisma.marker.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.marker.delete({
      where: { id },
    });
  }

  async createReport(markerId: string, data: any) {
    return prisma.markerReport.create({
      data: {
        markerId,
        localUserId: data.localUserId,
        reportedStatus: data.reportedStatus as PublicStatus,
        hasElectricity: data.hasElectricity ?? null,
        hasWater: data.hasWater ?? null,
        hasInternet: data.hasInternet ?? null,
        crowdLevel: data.crowdLevel as CrowdLevel,
        issueType: data.issueType,
        comment: data.comment || null,
      },
    });
  }

  async getReportsLast24Hours(markerId: string) {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return prisma.markerReport.findMany({
      where: {
        markerId,
        createdAt: {
          gte: oneDayAgo,
        },
      },
    });
  }
}

export const markersRepository = new MarkersRepository();
