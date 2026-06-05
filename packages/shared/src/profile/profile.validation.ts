import { z } from "zod";

export const LocalUserProfileSchema = z.object({
  mockUserId: z.string().min(1),
  homeAddress: z.string().nullable(),
  homeLatitude: z.number().min(-90).max(90).nullable(),
  homeLongitude: z.number().min(-180).max(180).nullable(),
  preferredLanguage: z.enum(["cs", "en"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type LocalUserProfileInput = z.infer<typeof LocalUserProfileSchema>;
