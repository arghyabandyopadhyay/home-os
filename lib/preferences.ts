/** @deprecated Use usePreferences() — kept for one-off reads before provider mounts */
import { createServerApiClient } from "@/lib/api-client/server"
import type { UserPreferences } from "@/types/user-preferences";

const ONBOARDING_KEY = "home-os:onboarding-complete";
const PINNED_NOTES_KEY = "home-os:pinned-notes";
const LOCAL_PREFS_KEY = "home-os:preferences-cache";

// ─── Server data access ───────────────────────────────────────────────────────

export async function getPreferences(): Promise<UserPreferences | null> {
  try {
    const api = await createServerApiClient()
    return await api.get<UserPreferences>("/preferences")
  } catch {
    return null
  }
}

export async function updatePreferences(
  updates: Partial<UserPreferences>
): Promise<UserPreferences | null> {
  try {
    const api = await createServerApiClient()
    return await api.patch<UserPreferences>("/preferences", { body: updates })
  } catch {
    return null
  }
}

// ─── Client-side localStorage helpers ─────────────────────────────────────────

export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const cached = localStorage.getItem(LOCAL_PREFS_KEY);
    if (cached) {
      const prefs = JSON.parse(cached) as UserPreferences;
      if (prefs.onboardingComplete) return true;
    }
  } catch {
    /* ignore */
  }
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

export function setOnboardingComplete(): void {
  localStorage.setItem(ONBOARDING_KEY, "true");
}

export function getPinnedNoteIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const cached = localStorage.getItem(LOCAL_PREFS_KEY);
    if (cached) {
      const prefs = JSON.parse(cached) as UserPreferences;
      if (prefs.pinnedNoteIds?.length) return prefs.pinnedNoteIds;
    }
    const raw = localStorage.getItem(PINNED_NOTES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

export function setPinnedNoteIds(ids: string[]): void {
  localStorage.setItem(PINNED_NOTES_KEY, JSON.stringify(ids));
}

export function togglePinnedNote(id: string): string[] {
  const current = getPinnedNoteIds();
  const next = current.includes(id)
    ? current.filter((noteId) => noteId !== id)
    : [id, ...current].slice(0, 10);
  setPinnedNoteIds(next);
  return next;
}
