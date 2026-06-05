import { Guide } from "../guides/guide.types";

export interface CachedGuidesData {
  guides: Guide[];
  lastSyncTimestamp: string;
}
