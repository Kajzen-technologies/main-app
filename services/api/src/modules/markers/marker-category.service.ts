import { MARKER_CATEGORIES, MARKER_CATEGORY_LABELS, MARKER_CATEGORY_PRIORITY } from "shared";

export class MarkerCategoryService {
  getCategories() {
    return {
      categories: MARKER_CATEGORIES,
      labels: MARKER_CATEGORY_LABELS,
      priority: MARKER_CATEGORY_PRIORITY,
    };
  }
}

export const markerCategoryService = new MarkerCategoryService();
