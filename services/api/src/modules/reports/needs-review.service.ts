import { markersRepository } from "../markers/markers.repository";
import { VerificationStatus } from "@prisma/client";

export class NeedsReviewService {
  async evaluateMarkerStatus(markerId: string): Promise<boolean> {
    const recentReports = await markersRepository.getReportsLast24Hours(markerId);

    if (recentReports.length < 3) {
      return false;
    }

    const counts: Record<string, number> = {};
    for (const r of recentReports) {
      counts[r.issueType] = (counts[r.issueType] || 0) + 1;
    }

    const hasRepeatedIssues = Object.values(counts).some((count) => count >= 2);

    if (hasRepeatedIssues) {
      await markersRepository.update(markerId, {
        verificationStatus: VerificationStatus.NEEDS_REVIEW,
      });
      return true;
    }

    return false;
  }
}

export const needsReviewService = new NeedsReviewService();
