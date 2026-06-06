import { AnonymousUser } from "./anonymousUser.types";

export function createAnonymousUser(deviceType: "web" | "mobile" = "web", preferredLanguage: "cs" | "en" = "en"): AnonymousUser {
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  return {
    id: `local_user_${randomSuffix}`,
    createdAt: new Date().toISOString(),
    preferredLanguage,
    deviceType,
  };
}
