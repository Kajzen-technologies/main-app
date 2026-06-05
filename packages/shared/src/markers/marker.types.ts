import { MarkerCategory } from "./markerCategory.constants";

export interface Marker {
  id: string;
  title: string;
  description: string | null;
  category: MarkerCategory;
  latitude: number;
  longitude: number;
  address: string | null;
  publicStatus: "OPEN" | "CLOSED" | "UNKNOWN";
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | "NEEDS_REVIEW";
  hasElectricity: boolean | null;
  hasWater: boolean | null;
  hasInternet: boolean | null;
  crowdLevel: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  submittedByLocalUserId: string | null;
  approvedByAdminId: string | null;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type MarkerReportIssueType =
  | "CLOSED"
  | "NO_ELECTRICITY"
  | "NO_WATER"
  | "NO_INTERNET"
  | "TOO_CROWDED"
  | "WRONG_LOCATION"
  | "OUTDATED_INFO"
  | "OTHER";

export interface MarkerReport {
  id: string;
  markerId: string;
  localUserId: string;
  reportedStatus: "OPEN" | "CLOSED" | "UNKNOWN";
  hasElectricity: boolean | null;
  hasWater: boolean | null;
  hasInternet: boolean | null;
  crowdLevel: "LOW" | "MEDIUM" | "HIGH" | "UNKNOWN";
  issueType: MarkerReportIssueType;
  comment: string | null;
  createdAt: string;
}
