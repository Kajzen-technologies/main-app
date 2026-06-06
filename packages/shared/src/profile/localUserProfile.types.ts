export interface LocalUserProfile {
  mockUserId: string;
  homeAddress: string | null;
  homeLatitude: number | null;
  homeLongitude: number | null;
  preferredLanguage: "cs" | "en";
  favoriteMarkerIds: string[];
  createdAt: string;
  updatedAt: string;
}
