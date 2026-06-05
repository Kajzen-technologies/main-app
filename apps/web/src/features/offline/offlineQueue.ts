import { OfflineQueueItem } from "shared";

const QUEUE_KEY = "prague_resilience_offline_queue";

export const offlineQueue = {
  getQueue(): OfflineQueueItem[] {
    if (typeof window === "undefined") return [];
    try {
      const data = localStorage.getItem(QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  saveQueue(queue: OfflineQueueItem[]): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.error("Failed to save offline queue:", e);
    }
  },

  enqueue(type: "CREATE_MARKER" | "CREATE_MARKER_REPORT" | "SEND_SOS" | "REGISTER_VOLUNTEER", payload: any, localUserId: string): OfflineQueueItem {
    const newItem: OfflineQueueItem = {
      id: `offline_action_${Math.random().toString(36).substring(2, 10)}`,
      type,
      payload,
      localUserId,
      createdAt: new Date().toISOString(),
      syncStatus: "PENDING",
      retryCount: 0,
      lastAttemptAt: null
    };

    const queue = this.getQueue();
    queue.push(newItem);
    this.saveQueue(queue);
    return newItem;
  },

  dequeue(id: string): void {
    const queue = this.getQueue();
    const filtered = queue.filter(item => item.id !== id);
    this.saveQueue(filtered);
  },

  updateItem(id: string, updates: Partial<OfflineQueueItem>): void {
    const queue = this.getQueue();
    const updated = queue.map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    });
    this.saveQueue(updated);
  }
};
