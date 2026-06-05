import { analyticsRepository } from "./analytics.repository";

export class AnalyticsService {
  async getOverviewData() {
    return analyticsRepository.getOverview();
  }

  async getReportsByIssueType() {
    return analyticsRepository.getReportsByIssueType();
  }

  async getReportsByCategory() {
    return analyticsRepository.getReportsByCategory();
  }

  async getMarkersNeedingReview() {
    return analyticsRepository.getMarkersNeedingReview();
  }

  async getProblemAreas() {
    return analyticsRepository.getProblemAreas();
  }
}

export const analyticsService = new AnalyticsService();
