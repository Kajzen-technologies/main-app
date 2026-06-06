/**
 * Custom-drawn category icons.
 *
 * Design constraints:
 *   - 24×24 viewBox, no stroke, fill via currentColor (the parent surface
 *     sets `color: #FFFFFF` for both light and dark themes).
 *   - One coherent visual family: chunky filled silhouettes, no outlines,
 *     no emoji, no text glyphs. Readable at 16px and 40px.
 *   - Each shape is intentionally distinct so users can pick a category by
 *     silhouette alone — important for stress reading during an outage.
 *
 * Each entry exposes a path-only string. Wrap with `categoryIconSvg(cat, size)`
 * for Leaflet HTML strings, or render `<CategoryIcon category={cat} />` in JSX.
 */

import type { MarkerCategory } from "shared";

/** Path / shape markup (without the outer <svg>). */
export const CATEGORY_ICON_PATHS: Record<MarkerCategory, string> = {
  // Squared medical cross — recognisable healthcare cue, no stroke.
  HOSPITAL:
    '<path d="M9.5 3h5a1 1 0 0 1 1 1v5.5H21a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-5.5V20a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-5.5H3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h5.5V4a1 1 0 0 1 1-1z"/>',

  // Capsule pill, split horizontally into a solid half and a soft inner half
  // expressed through a path subtraction so the silhouette stays mono-fill.
  PHARMACY:
    '<path d="M16 4a5 5 0 0 1 0 10h-3.5V4H16zm-4.5 16a5 5 0 0 1 0-10h.5v10h-.5zm1.5 0v-4.5h.6a5 5 0 0 1 0 4.5h-.6z"/>',

  // Stylised fuel pump — body + nozzle. All filled, no stroke.
  GAS_STATION:
    '<path d="M5 3a2 2 0 0 0-2 2v15a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-6h1.2a.8.8 0 0 1 .8.8V18a3 3 0 0 0 6 0V9.4a2 2 0 0 0-.6-1.4l-2.4-2.4-1.4 1.4 1.6 1.6V18a1 1 0 0 1-2 0v-3.2A2.8 2.8 0 0 0 16.2 12H15V5a2 2 0 0 0-2-2H5zm1 3h6v5H6V6z"/>',

  // Pointed heraldic shield with a chevron cut — police badge silhouette.
  POLICE_STATION:
    '<path d="M12 2L3.5 5v6.7c0 4.9 3.5 9.4 8.5 10.8 5-1.4 8.5-5.9 8.5-10.8V5L12 2zm0 5.2l5 5-5 2.6-5-2.6 5-5z"/>',

  // Asymmetric flame with an inner notch — fire department.
  FIRE_STATION:
    '<path d="M13.5 2c.4 3.2-1.7 4.4-2.9 6-1.8 2.4-3.1 4.6-3.1 7.4A6.6 6.6 0 0 0 14 22a6.5 6.5 0 0 0 6.5-6.5c0-3.2-2-5.6-4-7.5-1.2 1.6-2.6 2-2.8.6 0-1.6.8-3.2-.2-6.6zM12 13c.5 2 2.5 2 2.5 4a2.5 2.5 0 0 1-5 0c0-1.4 1.2-1.8 1.6-3.2.2-.7.6-.9.9-.8z"/>',

  // Grocery bag with two handle cutouts — supermarket.
  SUPERMARKET:
    '<path d="M7 6a5 5 0 0 1 10 0v1h2.6a1 1 0 0 1 1 1.1l-1.3 11.2A2 2 0 0 1 17.3 21H6.7a2 2 0 0 1-2-1.7L3.4 8.1A1 1 0 0 1 4.4 7H7V6zm2 1h6V6a3 3 0 0 0-6 0v1zm-.5 4.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm7 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>',

  // Front of a bus — windshield band + two wheel arches.
  PUBLIC_TRANSPORT_HUB:
    '<path d="M6 3a3 3 0 0 0-3 3v11.5A2.5 2.5 0 0 0 5 20v1.5a.5.5 0 0 0 .5.5h1A.5.5 0 0 0 7 21.5V20h10v1.5a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5V20a2.5 2.5 0 0 0 2-2.5V6a3 3 0 0 0-3-3H6zm0 4h12v4H6V7zm1 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm10 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>',

  // Classical building — pediment + four pillars + base — city office.
  CITY_DISTRICT_OFFICE:
    '<path d="M12 2L2 7v2h20V7L12 2zm-8 8v9H2v2h20v-2h-2v-9h-2.5v9H15v-9h-2.5v9H11v-9H8.5v9H7v-9H4z"/>',

  // Three head silhouettes sitting on a unified shoulder ridge — community.
  COMMUNITY_CENTER:
    '<path d="M12 4a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM5.5 6.5a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zm13 0a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6zM12 12c-3.2 0-5.5 2-5.5 4.5V20h11v-3.5C17.5 14 15.2 12 12 12zM5 13.5c-2 0-3.5 1.4-3.5 3.2V20H5v-3.5c0-1.1.3-2.1.9-3zm14 0c.6.9.9 1.9.9 3V20h3.6v-3.3c0-1.8-1.5-3.2-3.5-3.2z"/>',

  // Graduation mortarboard with a centred tassel cap — school.
  SCHOOL:
    '<path d="M12 3L1 8.2l11 5.3 9-4.3v6a1 1 0 1 0 2 0V8.2L12 3zM5 12.4v3.7c0 .5.3 1 .7 1.3C7.2 18.5 9.4 19.5 12 19.5s4.8-1 6.3-2.1c.4-.3.7-.8.7-1.3v-3.7l-7 3.3-7-3.3z"/>',

  // Heart with a subtle inner notch — eldercare / compassion.
  ELDERLY_CARE:
    '<path d="M12 21s-8.5-4.8-8.5-11.2A4.8 4.8 0 0 1 8.4 5c1.4 0 2.7.7 3.6 1.8C12.9 5.7 14.2 5 15.6 5a4.8 4.8 0 0 1 4.9 4.8C20.5 16.2 12 21 12 21zm0-12.4c-.5-.9-1.4-1.6-2.6-1.6a2.8 2.8 0 0 0-2.9 2.8c0 1.8 1.4 3.7 3.2 5.3 1 .9 2 1.6 2.3 1.8.3-.2 1.3-.9 2.3-1.8 1.8-1.6 3.2-3.5 3.2-5.3a2.8 2.8 0 0 0-2.9-2.8c-1.2 0-2.1.7-2.6 1.6z"/>',

  // Location pin with a centred contrasting circle — emergency support point.
  EMERGENCY_SUPPORT_POINT:
    '<path d="M12 2a8 8 0 0 0-8 8c0 5.4 7 11.5 7.4 11.8a1 1 0 0 0 1.2 0C13 21.5 20 15.4 20 10a8 8 0 0 0-8-8zm0 5a3 3 0 0 1 3 3 3 3 0 0 1-6 0 3 3 0 0 1 3-3z"/>',
};

/** Build an SVG markup string suitable for `dangerouslySetInnerHTML` or Leaflet
 *  `divIcon` HTML payloads. Uses `fill="currentColor"` so the parent surface
 *  controls the colour (white inside category circles). */
export function categoryIconSvg(category: MarkerCategory, size: number): string {
  const path = CATEGORY_ICON_PATHS[category] ?? CATEGORY_ICON_PATHS.EMERGENCY_SUPPORT_POINT;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${path}</svg>`;
}

interface CategoryIconProps {
  category: MarkerCategory;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** JSX wrapper — renders the SVG inline. Colour is `currentColor`, so set a
 *  `color: var(--cat-…)` (or white) on the parent. */
export function CategoryIcon({ category, size = 22, className, style }: CategoryIconProps) {
  return (
    <span
      className={className}
      style={{ display: "inline-flex", lineHeight: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: categoryIconSvg(category, size) }}
    />
  );
}
