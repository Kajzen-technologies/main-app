import { AnonymousUser } from "./anonymousUser.types";

export function getAnonymousUser(storedString: string | null): AnonymousUser | null {
  if (!storedString) return null;
  try {
    const parsed = JSON.parse(storedString);
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.createdAt === "string" &&
      (parsed.preferredLanguage === "cs" || parsed.preferredLanguage === "en") &&
      (parsed.deviceType === "web" || parsed.deviceType === "mobile")
    ) {
      return parsed as AnonymousUser;
    }
    return null;
  } catch {
    return null;
  }
}
