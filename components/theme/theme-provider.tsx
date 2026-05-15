"use client";

import { useEffect } from "react";
import { usePreferences } from "@/components/providers/user-preferences-provider";
import { applyTheme } from "@/lib/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { prefs, loading } = usePreferences();

  useEffect(() => {
    if (!loading && prefs.theme) {
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
