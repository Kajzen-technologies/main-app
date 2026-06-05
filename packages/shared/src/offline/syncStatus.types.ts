export interface SyncStatus {
  isOnline: boolean;
  lastSyncTime: string | null;
  pendingActionsCount: number;
}
