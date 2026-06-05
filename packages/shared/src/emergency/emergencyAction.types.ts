import { MarkerCategory } from "../markers/markerCategory.constants";

export interface EmergencyActionItem {
  id: string;
  titleCs: string;
  titleEn: string;
  categories?: MarkerCategory[];
  isGuideLink: boolean;
  guideSlug?: string;
}
