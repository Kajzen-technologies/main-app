import { Marker } from "../markers/marker.types";
import { MarkerSearchParams } from "./search.types";
import { normalizeSearchText } from "./normalizeSearchText";
import { MARKER_CATEGORY_LABELS } from "../markers/markerCategory.labels";

export function searchMarkers(
  markers: Marker[],
  params: MarkerSearchParams,
  lang: "cs" | "en" = "cs"
): Marker[] {
  return markers.filter((marker) => {
    if (params.category && marker.category !== params.category) {
      return false;
    }

    if (params.isOpenOnly && marker.publicStatus !== "OPEN") {
      return false;
    }

    if (params.hasElectricity === true && marker.hasElectricity !== true) return false;
    if (params.hasWater === true && marker.hasWater !== true) return false;
    if (params.hasInternet === true && marker.hasInternet !== true) return false;

    if (params.query) {
      const normalizedQuery = normalizeSearchText(params.query);
      if (normalizedQuery) {
        const titleNormalized = normalizeSearchText(marker.title);
        const addressNormalized = normalizeSearchText(marker.address || "");
        const descriptionNormalized = normalizeSearchText(marker.description || "");

        const catLabel = MARKER_CATEGORY_LABELS[lang][marker.category] || "";
        const catLabelNormalized = normalizeSearchText(catLabel);

        const altLang = lang === "cs" ? "en" : "cs";
        const catLabelAlt = MARKER_CATEGORY_LABELS[altLang][marker.category] || "";
        const catLabelAltNormalized = normalizeSearchText(catLabelAlt);

        const matchesQuery =
          titleNormalized.includes(normalizedQuery) ||
          addressNormalized.includes(normalizedQuery) ||
          descriptionNormalized.includes(normalizedQuery) ||
          catLabelNormalized.includes(normalizedQuery) ||
          catLabelAltNormalized.includes(normalizedQuery);

        if (!matchesQuery) return false;
      }
    }

    return true;
  });
}
