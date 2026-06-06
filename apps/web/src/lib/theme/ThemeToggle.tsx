"use client";

import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Minimal toggle. Cycles dark → light → system → dark.
 * Drop into any chrome surface (header, sidebar, settings sheet).
 */
export function ThemeToggle({ className, style }: ThemeToggleProps) {
  const { mode, resolved, setMode } = useTheme();

  const next = mode === "dark" ? "light" : mode === "light" ? "system" : "dark";
  const label =
    mode === "system" ? `Auto (${resolved})` : mode === "dark" ? "Dark" : "Light";
  const icon = resolved === "dark" ? "☾" : "☀";

  return (
    <button
      type="button"
      onClick={() => setMode(next)}
      className={className}
      title={`Theme: ${label}. Click for ${next}.`}
      aria-label={`Theme: ${label}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 8,
        background: "var(--overlay-weaker)",
        border: "1px solid var(--border-color)",
        color: "var(--text-secondary)",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
        fontWeight: 600,
        ...style,
      }}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </button>
  );
}
