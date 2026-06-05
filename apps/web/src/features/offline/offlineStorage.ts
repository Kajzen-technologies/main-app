import { Marker, Guide, LocalUserProfile } from "shared";

const PREFIX = "prague_resilience_";

export const offlineStorage = {
  getCachedMarkers(): Marker[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(`${PREFIX}markers`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCachedMarkers(markers: Marker[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`${PREFIX}markers`, JSON.stringify(markers));
      localStorage.setItem(`${PREFIX}markers_sync_time`, new Date().toISOString());
    } catch (e) {
      console.error("Failed to save markers to cache:", e);
    }
  },

  getLastSyncTime(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(`${PREFIX}markers_sync_time`);
  },

  getCachedGuides(): Guide[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(`${PREFIX}guides`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveCachedGuides(guides: Guide[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`${PREFIX}guides`, JSON.stringify(guides));
    } catch (e) {
      console.error("Failed to cache guides:", e);
    }
  },

  getProfile(): LocalUserProfile | null {
    if (typeof window === "undefined") return null;
    try {
      const data = localStorage.getItem(`${PREFIX}profile`);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  saveProfile(profile: LocalUserProfile): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`${PREFIX}profile`, JSON.stringify(profile));
    } catch (e) {
      console.error("Failed to save profile:", e);
    }
  },

  getChecklistProgress(guideId: string): string[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(`${PREFIX}checklist_${guideId}`);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveChecklistProgress(guideId: string, checkedItemIds: string[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(`${PREFIX}checklist_${guideId}`, JSON.stringify(checkedItemIds));
    } catch (e) {
      console.error("Failed to save checklist progress:", e);
    }
  }
};
