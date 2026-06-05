import { useEffect, useState } from "react";
import { syncOfflineActions } from "./syncOfflineActions";

export function useOfflineStatus(apiBaseUrl: string) {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      // Attempt syncing queued items immediately when connection returns
      syncOfflineActions(apiBaseUrl).catch(console.error);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [apiBaseUrl]);

  return { isOnline };
}
