"use client";

import { useEffect } from "react";
import { usePreferences } from "@/components/providers/user-preferences-provider";
import { applyTheme, resolveTheme } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { prefs, loading } = usePreferences();

  useEffect(() => {
    // Do nothing while loading — trust theme-init.js
    if (loading) return;
    if (!prefs.theme) return;

    // Only apply if different from current DOM state
    const currentlyDark = document.documentElement.classList.contains("dark");
    const resolvedIsDark = resolveTheme(prefs.theme) === "dark";

    if (resolvedIsDark !== currentlyDark) {
      applyTheme(prefs.theme);
    }
  }, [loading, prefs.theme]);

  useEffect(() => {
    if (prefs.theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("auto");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [prefs.theme]);

  return children;
}
