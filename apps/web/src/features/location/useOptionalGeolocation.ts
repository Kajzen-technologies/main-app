import { useState } from "react";

export function useOptionalGeolocation() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const requestLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.warn("Geolocation denied or failed:", err.message);
        setError(err.message);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const clearCoords = () => {
    setCoords(null);
  };

  return {
    coords,
    error,
    loading,
    requestLocation,
    clearCoords
  };
}
