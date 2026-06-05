export interface LocalUserProfile {
  mockUserId: string;
  homeAddress: string | null;
  homeLatitude: number | null;
  homeLongitude: number | null;
  preferredLanguage: "cs" | "en";
  createdAt: string;
  updatedAt: string;
}
