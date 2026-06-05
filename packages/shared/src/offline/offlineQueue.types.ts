export interface OfflineQueueItem {
  id: string;
  type: "CREATE_MARKER" | "CREATE_MARKER_REPORT";
  payload: any;
  localUserId: string;
  createdAt: string;
  syncStatus: "PENDING" | "SYNCED" | "FAILED";
  retryCount: number;
  lastAttemptAt: string | null;
}
