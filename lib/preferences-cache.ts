import type { UserPreferences } from "@/types/user-preferences";

export const LOCAL_PREFS_KEY = "home-os:preferences-cache";

export function readLocalCache(): UserPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as UserPreferences;
  } catch {
    // Malformed JSON — discard
    localStorage.removeItem(LOCAL_PREFS_KEY);
    return null;
  }
}

export function writeLocalCache(prefs: UserPreferences): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(prefs));
}
