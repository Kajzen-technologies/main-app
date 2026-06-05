import { Marker } from "./marker.types";
import { MARKER_CATEGORY_PRIORITY } from "./markerCategory.priority";
import { getHaversineDistance } from "./distance";

export function sortMarkersForDisplay(
  markers: Marker[],
  coords?: { latitude: number; longitude: number } | null
): Marker[] {
  return [...markers].sort((a, b) => {
    if (coords) {
      const distA = getHaversineDistance(coords.latitude, coords.longitude, a.latitude, a.longitude);
      const distB = getHaversineDistance(coords.latitude, coords.longitude, b.latitude, b.longitude);
      if (Math.abs(distA - distB) > 0.0001) {
        return distA - distB;
      }
    }

    const priorityA = MARKER_CATEGORY_PRIORITY[a.category] ?? 99;
    const priorityB = MARKER_CATEGORY_PRIORITY[b.category] ?? 99;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    return a.title.localeCompare(b.title, "cs");
  });
}
