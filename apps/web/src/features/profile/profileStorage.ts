import { LocalUserProfile, createAnonymousUser } from "shared";
import { offlineStorage } from "../offline/offlineStorage";

export const profileStorage = {
  getProfileOrInit(deviceType: "web" | "mobile" = "web"): LocalUserProfile {
    let profile = offlineStorage.getProfile();
    if (!profile) {
      const anonUser = createAnonymousUser(deviceType, "en");
      profile = {
        mockUserId: anonUser.id,
        homeAddress: null,
        homeLatitude: null,
        homeLongitude: null,
        preferredLanguage: "en",
        favoriteMarkerIds: [],
        createdAt: anonUser.createdAt,
        updatedAt: anonUser.createdAt
      };
      offlineStorage.saveProfile(profile);
    } else if (!Array.isArray((profile as any).favoriteMarkerIds)) {
      // Migrate older profiles that pre-date favoriteMarkerIds
      profile = { ...profile, favoriteMarkerIds: [] };
      offlineStorage.saveProfile(profile);
    }
    return profile;
  },

  saveProfile(profile: LocalUserProfile): void {
    profile.updatedAt = new Date().toISOString();
    offlineStorage.saveProfile(profile);
  }
};
