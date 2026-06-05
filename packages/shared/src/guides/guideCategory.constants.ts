export const GUIDE_CATEGORIES = [
  "BEFORE_BLACKOUT",
  "DURING_BLACKOUT",
  "COMMUNICATION",
  "WATER_AND_FOOD",
  "MEDICAL_HELP",
  "HEATING",
  "SAFETY",
  "AFTER_POWER_RETURNS"
] as const;

export type GuideCategory = typeof GUIDE_CATEGORIES[number];
