/**
 * Single source of truth for design tokens consumed from JS/TSX.
 *
 * CSS variables in `globals.css` are the runtime source for chrome
 * (buttons, surfaces, text, etc.) — prefer `var(--token)` in `style={{ }}`
 * props whenever possible so theme switching works.
 *
 * Use the constants in this file only when you need a literal hex/rgb,
 * specifically:
 *   - SVG HTML attributes (stroke="..", fill="..") — these don't resolve
 *     `var()`. Inline style objects on SVG do, prefer those when possible.
 *   - Leaflet/canvas APIs that take raw color strings.
 *
 * Mirror this file's values with the dark-theme defaults in globals.css.
 * Light-theme overrides only affect chrome tokens; the category palette is
 * intentionally identity-stable across themes.
 */

/** Prague brand palette (City flag colours). */
export const PRAGUE = {
  red: "#E10600",
  redHover: "#C90000",
  redActive: "#9D0000",
  redSoft: "#FCE2DF",
  yellow: "#FFD400",
  yellowHover: "#E7BE00",
  yellowSoft: "#FFF4B8",
} as const;

/** Marker category palette — keep stable across light/dark for identity. */
export const CATEGORY_COLORS = {
  HOSPITAL: "#FF453A",
  PHARMACY: "#FF9F0A",
  GAS_STATION: "#BF5AF2",
  POLICE_STATION: "#0A84FF",
  FIRE_STATION: "#FF453A",
  SUPERMARKET: "#30D158",
  PUBLIC_TRANSPORT_HUB: "#5E5CE6",
  CITY_DISTRICT_OFFICE: "#8E8E93",
  COMMUNITY_CENTER: "#FFD60A",
  SCHOOL: "#64D2FF",
  ELDERLY_CARE: "#FF6482",
  EMERGENCY_SUPPORT_POINT: "#0A84FF",
} as const;

/** Semantic intent colours (iOS-system family) — used for status states. */
export const SEMANTIC = {
  success: "#30D158",
  warning: "#FF9F0A",
  danger: "#FF453A",
  info: "#0A84FF",
  neutral: "#8E8E93",
} as const;

/** RGB triplets for use inside `rgba()` strings when you need a custom alpha. */
export const RGB = {
  pragueRed: "225, 6, 0",
  pragueYellow: "255, 212, 0",
  success: "48, 209, 88",
  warning: "255, 159, 10",
  danger: "255, 69, 58",
  info: "10, 132, 255",
  neutral: "142, 142, 147",
  white: "255, 255, 255",
  black: "0, 0, 0",
} as const;

/** CSS variable identifiers — typed strings to avoid typos in `var(--foo)`. */
export const TOKEN = {
  // Brand
  primary: "var(--color-primary)",
  primaryHover: "var(--color-primary-hover)",
  primaryGlow: "var(--color-primary-glow)",
  primarySoft: "var(--color-primary-soft)",
  accent: "var(--color-accent)",
  accentHover: "var(--color-accent-hover)",
  accentSoft: "var(--color-accent-soft)",

  // Semantic
  success: "var(--color-success)",
  successSoft: "var(--color-success-soft)",
  warning: "var(--color-warning)",
  warningSoft: "var(--color-warning-soft)",
  danger: "var(--color-danger)",
  dangerSoft: "var(--color-danger-soft)",
  info: "var(--color-info)",
  infoSoft: "var(--color-info-soft)",

  // Surfaces
  bgCanvas: "var(--bg-canvas)",
  bgPrimary: "var(--bg-primary)",
  bgSecondary: "var(--bg-secondary)",
  bgSurface: "var(--bg-surface)",
  bgGlass: "var(--bg-glass)",
  bgSidebar: "var(--bg-sidebar)",
  bgModal: "var(--bg-modal)",
  bgModalBackdrop: "var(--bg-modal-backdrop)",

  // Borders
  border: "var(--border-color)",
  borderSubtle: "var(--border-subtle)",
  borderStrong: "var(--border-strong)",
  glassBorder: "var(--glass-border)",

  // Text
  textPrimary: "var(--text-primary)",
  textSecondary: "var(--text-secondary)",
  textTertiary: "var(--text-tertiary)",
  textInverse: "var(--text-inverse)",
  textOnBrand: "var(--text-on-brand)",
  textOnAccent: "var(--text-on-accent)",

  // Shadows
  shadowSm: "var(--shadow-sm)",
  shadowMd: "var(--shadow-md)",
  shadowLg: "var(--shadow-lg)",
  shadowGlow: "var(--shadow-glow)",
} as const;

/** Convenience helper to build `rgba(triplet, alpha)` strings. */
export function rgba(rgbTriplet: string, alpha: number): string {
  return `rgba(${rgbTriplet}, ${alpha})`;
}
