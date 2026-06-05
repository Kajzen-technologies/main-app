export interface AnalyticsOverview {
  totalApprovedMarkers: number;
  totalPendingMarkers: number;
  totalReports24h: number;
  totalNeedsReview: number;
  mostReportedCategory: string | null;
  mostCommonIssueType: string | null;
}

export interface ReportsByIssueType {
  issueType: string;
  count: number;
}

export interface ReportsByCategory {
  category: string;
  count: number;
}

export interface ProblemArea {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  reportCount: number;
}
