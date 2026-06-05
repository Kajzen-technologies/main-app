import { LocalUserProfile, createAnonymousUser } from "shared";
import { offlineStorage } from "../offline/offlineStorage";

export const profileStorage = {
  getProfileOrInit(deviceType: "web" | "mobile" = "web"): LocalUserProfile {
    let profile = offlineStorage.getProfile();
    if (!profile) {
      const anonUser = createAnonymousUser(deviceType, "cs");
      profile = {
        mockUserId: anonUser.id,
        homeAddress: null,
        homeLatitude: null,
        homeLongitude: null,
        preferredLanguage: "cs",
        createdAt: anonUser.createdAt,
        updatedAt: anonUser.createdAt
      };
      offlineStorage.saveProfile(profile);
    }
    return profile;
  },

  saveProfile(profile: LocalUserProfile): void {
    profile.updatedAt = new Date().toISOString();
    offlineStorage.saveProfile(profile);
  }
};
