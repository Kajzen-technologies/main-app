"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextValue {
  /** User-facing setting (may be "system"). */
  mode: ThemeMode;
  /** Concrete theme currently applied (never "system"). */
  resolved: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const STORAGE_KEY = "praha-odolna:theme";
const META_NAME = "theme-color";
const META_DARK = "#111214";   // matches --bg-canvas (dark)
const META_LIGHT = "#FFFFFF";  // matches --bg-canvas (light)

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch {
    // localStorage may be blocked (private mode, SSR, etc.) — fall through.
  }
  return "light";
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolve(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") return systemPrefersDark() ? "dark" : "light";
  return mode;
}

function applyTheme(resolved: ResolvedTheme, mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  // Only write data-theme when the user has made an explicit choice; that way
  // the OS preference can still flow through via the @media query in CSS.
  if (mode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", resolved);
  }
  // Keep the legacy class hook in sync for any selector still using it.
  document.body.classList.toggle("light-theme", resolved === "light");

  // Sync the address-bar / status-bar tint.
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${META_NAME}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.name = META_NAME;
    document.head.appendChild(meta);
  }
  meta.content = resolved === "light" ? META_LIGHT : META_DARK;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => readStoredMode());
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolve(mode));

  useEffect(() => {
    applyTheme(resolved, mode);
  }, [resolved, mode]);

  useEffect(() => {
    if (mode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setResolved(mq.matches ? "dark" : "light");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    setResolved(resolve(next));
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore quota / private-mode failures
    }
  }, []);

  const toggle = useCallback(() => {
    setMode(resolved === "dark" ? "light" : "dark");
  }, [resolved, setMode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, resolved, setMode, toggle }),
    [mode, resolved, setMode, toggle],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}

/**
 * Inline script string that runs before React hydration. Drop the return value
 * into a `<Script id="theme-init" strategy="beforeInteractive" />` or a plain
 * `<script dangerouslySetInnerHTML />` in the layout to avoid a light/dark
 * flash on first paint.
 */
export const themeInitScript = `(() => {
  try {
    var stored = localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    var mode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'light';
    var resolved = mode === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : mode;
    if (mode !== 'system') document.documentElement.setAttribute('data-theme', resolved);
    if (resolved === 'light') {
      var interval = setInterval(function() {
        if (document.body) {
          document.body.classList.add('light-theme');
          clearInterval(interval);
        }
      }, 5);
    }
  } catch (e) {}
})();`;
