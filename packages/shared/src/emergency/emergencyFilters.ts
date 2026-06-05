import { EmergencyActionItem } from "./emergencyAction.types";

export const EMERGENCY_ACTIONS: EmergencyActionItem[] = [
  {
    id: "nearest_help",
    titleCs: "Nejbližší pomoc",
    titleEn: "Nearest help",
    categories: ["EMERGENCY_SUPPORT_POINT", "HOSPITAL", "PHARMACY"],
    isGuideLink: false
  },
  {
    id: "emergency_guides",
    titleCs: "Nouzové návody",
    titleEn: "Emergency guides",
    isGuideLink: true
  },
  {
    id: "hospitals_pharmacies",
    titleCs: "Nemocnice a lékárny",
    titleEn: "Hospitals and pharmacies",
    categories: ["HOSPITAL", "PHARMACY"],
    isGuideLink: false
  }
];
