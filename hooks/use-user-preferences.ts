"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { applyTheme } from "@/lib/theme";
import type { UserPreferences } from "@/types/user-preferences";
import { defaultUserPreferences } from "@/types/user-preferences";
import { readLocalCache, writeLocalCache } from "@/lib/preferences-cache";
import { createClientApiClient } from "@/lib/api-client";

const api = createClientApiClient();

export function useUserPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    return readLocalCache() ?? defaultUserPreferences;
  });
  const [loading, setLoading] = useState(true);
  const hasFetched = useRef(false);
  // Refs for stable update closure — avoids stale captures and dependency churn
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  const load = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    try {
      const remote = await api.get<UserPreferences>("/preferences");
      const cached = prefsRef.current;

      // Determine if remote has real user data or just empty defaults
      const remoteIsDefaults =
        remote.onboardingComplete === defaultUserPreferences.onboardingComplete &&
        remote.theme === defaultUserPreferences.theme &&
        (remote.pinnedNoteIds?.length ?? 0) === 0;

      // Check if local cache has any user-set values (different from defaults)
      const cachedHasUserData =
        cached.onboardingComplete !== defaultUserPreferences.onboardingComplete ||
        cached.theme !== defaultUserPreferences.theme ||
        (cached.pinnedNoteIds?.length ?? 0) > 0;

      if (remoteIsDefaults && cachedHasUserData) {
        // Remote has no real data but we have local state (from cache) — keep local
        // and sync our local state up to remote
        writeLocalCache(cached);
        try {
          await api.patch("/preferences", { body: cached });
        } catch {
          console.warn("[preferences] Failed to sync local state to remote");
        }
      } else if (!remoteIsDefaults) {
        // Remote has real user data — use it but don't downgrade onboardingComplete
        const merged: UserPreferences = {
          ...remote,
          onboardingComplete: remote.onboardingComplete || cached.onboardingComplete,
        };
        setPrefs(merged);
        writeLocalCache(merged);
      }
      // If both are defaults, do nothing — state is already initialized from defaults
    } catch {
      console.warn("[preferences] Remote fetch failed, using cached/default values");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = useCallback(
    async (patch: Partial<UserPreferences>) => {
      const current = prefsRef.current;
      const optimistic: UserPreferences = {
        ...current,
        ...patch,
        notifications: {
          ...defaultUserPreferences.notifications!,
          ...current.notifications,
          ...patch.notifications,
        },
      };
      setPrefs(optimistic);
      writeLocalCache(optimistic);
      if (patch.theme) applyTheme(patch.theme);

      try {
        await api.patch("/preferences", { body: optimistic });
      } catch {
        console.warn("[preferences] Remote write failed, keeping optimistic state");
      }
      return optimistic;
    },
    [], // Stable — uses refs for current values
  );

  return { prefs, loading, update, reload: load };
}
