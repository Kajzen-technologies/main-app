import { offlineQueue } from "./offlineQueue";

export async function syncOfflineActions(apiBaseUrl: string): Promise<{ successCount: number; failCount: number }> {
  const queue = offlineQueue.getQueue();
  const pending = queue.filter(item => item.syncStatus !== "SYNCED" && item.retryCount < 5);

  let successCount = 0;
  let failCount = 0;

  for (const item of pending) {
    const attemptTime = new Date().toISOString();
    try {
      let url = "";
      let body = item.payload;

      if (item.type === "CREATE_MARKER") {
        url = `${apiBaseUrl}/markers`;
      } else if (item.type === "CREATE_MARKER_REPORT") {
        const { markerId, ...reportPayload } = item.payload;
        url = `${apiBaseUrl}/markers/${markerId}/reports`;
        body = reportPayload;
      } else if (item.type === "SEND_SOS") {
        url = `${apiBaseUrl}/emergency/sos`;
      } else if (item.type === "REGISTER_VOLUNTEER") {
        url = `${apiBaseUrl}/users/volunteer`;
      }

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        offlineQueue.dequeue(item.id);
        successCount++;
      } else {
        throw new Error(`Server status ${res.status}`);
      }
    } catch (e) {
      console.error(`Failed to sync offline item ${item.id}:`, e);
      offlineQueue.updateItem(item.id, {
        syncStatus: "FAILED",
        retryCount: item.retryCount + 1,
        lastAttemptAt: attemptTime,
      });
      failCount++;
    }
  }

  return { successCount, failCount };
}
