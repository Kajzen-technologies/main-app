import { prisma } from "../database/prisma";
import { VerificationStatus } from "@prisma/client";

export class AnalyticsRepository {
  async getOverview() {
    try {
      const totalApproved = await prisma.marker.count({
        where: {
          verificationStatus: {
            in: [VerificationStatus.APPROVED, VerificationStatus.NEEDS_REVIEW],
          },
        },
      });

      const totalPending = await prisma.marker.count({
        where: {
          verificationStatus: VerificationStatus.PENDING,
        },
      });

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const totalReports24h = await prisma.markerReport.count({
        where: {
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });

      const totalNeedsReview = await prisma.marker.count({
        where: {
          verificationStatus: VerificationStatus.NEEDS_REVIEW,
        },
      });

      const reports = await prisma.markerReport.findMany({
        include: {
          marker: true,
        },
      });

      const categoryCounts: Record<string, number> = {};
      const issueTypeCounts: Record<string, number> = {};

      for (const r of reports) {
        if (r.marker) {
          categoryCounts[r.marker.category] = (categoryCounts[r.marker.category] || 0) + 1;
        }
        issueTypeCounts[r.issueType] = (issueTypeCounts[r.issueType] || 0) + 1;
      }

      let mostReportedCategory: string | null = null;
      let maxCatCount = 0;
      for (const [cat, count] of Object.entries(categoryCounts)) {
        if (count > maxCatCount) {
          maxCatCount = count;
          mostReportedCategory = cat;
        }
      }

      let mostCommonIssueType: string | null = null;
      let maxIssueCount = 0;
      for (const [issue, count] of Object.entries(issueTypeCounts)) {
        if (count > maxIssueCount) {
          maxIssueCount = count;
          mostCommonIssueType = issue;
        }
      }

      return {
        totalApprovedMarkers: totalApproved,
        totalPendingMarkers: totalPending,
        totalReports24h,
        totalNeedsReview,
        mostReportedCategory,
        mostCommonIssueType,
      };
    } catch {
      return {
        totalApprovedMarkers: 0,
        totalPendingMarkers: 0,
        totalReports24h: 0,
        totalNeedsReview: 0,
        mostReportedCategory: null,
        mostCommonIssueType: null,
      };
    }
  }

  async getReportsByIssueType() {
    try {
      const groups = await prisma.markerReport.groupBy({
        by: ["issueType"],
        _count: {
          id: true,
        },
      });

      return groups.map((g) => ({
        issueType: g.issueType,
        count: g._count.id,
      }));
    } catch {
      return [];
    }
  }

  async getReportsByCategory() {
    try {
      const reports = await prisma.markerReport.findMany({
        include: {
          marker: true,
        },
      });

      const counts: Record<string, number> = {};
      for (const r of reports) {
        if (r.marker) {
          counts[r.marker.category] = (counts[r.marker.category] || 0) + 1;
        }
      }

      return Object.entries(counts).map(([category, count]) => ({
        category,
        count,
      }));
    } catch {
      return [];
    }
  }

  async getMarkersNeedingReview() {
    try {
      const markers = await prisma.marker.findMany({
        where: {
          verificationStatus: VerificationStatus.NEEDS_REVIEW,
        },
        include: {
          reports: {
            orderBy: {
              createdAt: "desc",
            },
          },
        },
      });

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      return markers.map((m) => {
        const recentReports = m.reports.filter((r) => r.createdAt >= oneDayAgo);
        const issueCounts: Record<string, number> = {};
        for (const r of recentReports) {
          issueCounts[r.issueType] = (issueCounts[r.issueType] || 0) + 1;
        }
        let mostCommonIssueType: string | null = null;
        let maxCount = 0;
        for (const [issue, count] of Object.entries(issueCounts)) {
          if (count > maxCount) {
            maxCount = count;
            mostCommonIssueType = issue;
          }
        }

        return {
          id: m.id,
          title: m.title,
          category: m.category,
          address: m.address,
          reports24h: recentReports.length,
          mostCommonIssueType,
          lastReportTime: m.reports[0]?.createdAt.toISOString() || null,
          publicStatus: m.publicStatus,
        };
      });
    } catch {
      return [];
    }
  }

  async getProblemAreas() {
    try {
      const markers = await prisma.marker.findMany({
        include: {
          _count: {
            select: { reports: true },
          },
        },
      });

      return markers
        .filter((m) => m._count.reports > 0)
        .map((m) => ({
          id: m.id,
          title: m.title,
          latitude: m.latitude,
          longitude: m.longitude,
          reportCount: m._count.reports,
        }));
    } catch {
      return [];
    }
  }
}

export const analyticsRepository = new AnalyticsRepository();
