"use client";

export type Theme = "light" | "dark";

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem("vb-theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // storage unavailable - fall through to system preference
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function toggleTheme(current: Theme): Theme {
  const next: Theme = current === "dark" ? "light" : "dark";
  try {
    window.localStorage.setItem("vb-theme", next);
  } catch {
    // ignore
  }
  applyTheme(next);
  return next;
}
