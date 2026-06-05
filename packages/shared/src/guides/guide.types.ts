import { GuideCategory } from "./guideCategory.constants";

export interface Guide {
  id: string;
  slug: string;
  category: GuideCategory;
  priority: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  translations?: GuideTranslation[];
  checklistItems?: GuideChecklistItem[];
}

export interface GuideTranslation {
  id: string;
  guideId: string;
  language: "cs" | "en";
  title: string;
  shortDescription: string;
  content: string;
}

export interface GuideChecklistItem {
  id: string;
  guideId: string;
  order: number;
  textCs: string;
  textEn: string;
}
