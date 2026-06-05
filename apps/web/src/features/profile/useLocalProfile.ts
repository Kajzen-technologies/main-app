import { useState, useEffect } from "react";
import { LocalUserProfile } from "shared";
import { profileStorage } from "./profileStorage";

export function useLocalProfile(isOnline: boolean) {
  const [profile, setProfile] = useState<LocalUserProfile | null>(null);

  useEffect(() => {
    const prof = profileStorage.getProfileOrInit("web");
    setProfile(prof);
  }, []);

  const updateLanguage = (lang: "cs" | "en") => {
    if (!profile) return;
    const updated = { ...profile, preferredLanguage: lang };
    profileStorage.saveProfile(updated);
    setProfile(updated);
  };

  const clearHomeAddress = () => {
    if (!profile) return;
    const updated = {
      ...profile,
      homeAddress: null,
      homeLatitude: null,
      homeLongitude: null
    };
    profileStorage.saveProfile(updated);
    setProfile(updated);
  };

  const saveHomeAddress = async (address: string) => {
    if (!profile) return;

    let lat: number | null = null;
    let lon: number | null = null;

    if (isOnline && address.trim()) {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          address + ", Praha"
        )}&format=json&limit=1`;
        const res = await fetch(url, {
          headers: {
            "Accept-Language": "cs",
            "User-Agent": "PragueBlackoutResilienceApp/1.0"
          }
        });
        const data = await res.json();
        if (data && data[0]) {
          lat = parseFloat(data[0].lat);
          lon = parseFloat(data[0].lon);
        }
      } catch (e) {
        console.error("Geocoding failed, will store address text only:", e);
      }
    }

    const updated = {
      ...profile,
      homeAddress: address,
      homeLatitude: lat,
      homeLongitude: lon
    };

    profileStorage.saveProfile(updated);
    setProfile(updated);
  };

  return {
    profile,
    updateLanguage,
    clearHomeAddress,
    saveHomeAddress
  };
}
