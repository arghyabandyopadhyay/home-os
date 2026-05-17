"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchUserPreferences,
} from "@/lib/user-settings";
import { applyTheme } from "@/lib/theme";
import type { UserPreferences } from "@/types/user-preferences";
import { defaultUserPreferences } from "@/types/user-preferences";
import { readLocalCache, writeLocalCache } from "@/lib/preferences-cache";

// Module-level stable client reference — createBrowserClient already returns a singleton internally
const supabase = createClient();

export function useUserPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(() => {
    return readLocalCache() ?? defaultUserPreferences;
  });
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const hasFetched = useRef(false);
  // Refs for stable update closure — avoids stale captures and dependency churn
  const prefsRef = useRef(prefs);
  const userIdRef = useRef(userId);
  prefsRef.current = prefs;
  userIdRef.current = userId;

  const load = useCallback(async () => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUserId(null);
        return;
      }

      setUserId(user.id);
      const remote = await fetchUserPreferences(supabase, user.id);
      const cached = prefsRef.current;

      // Determine if remote has real user data or just empty defaults
      // The profiles.preferences column defaults to '{}', which mergePreferences
      // turns into defaultUserPreferences. We detect this by checking if remote
      // matches defaults exactly — if so, the user hasn't saved anything to remote yet.
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
        const { error } = await supabase
          .from("profiles")
          .update({ preferences: cached })
          .eq("id", user.id);
        if (error) {
          console.warn("[preferences] Failed to sync local state to remote:", error.message);
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

      // Get userId — if not yet available, fetch it now
      let uid = userIdRef.current;
      if (!uid) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            uid = user.id;
            setUserId(uid);
          }
        } catch {
          // Can't get user — skip remote save
        }
      }

      if (!uid) return optimistic;

      try {
        // Save the full optimistic state to remote — not just the patch
        // This ensures remote always has the complete, up-to-date preferences
        const { error } = await supabase
          .from("profiles")
          .update({ preferences: optimistic })
          .eq("id", uid);
        if (error) {
          console.warn("[preferences] Remote write failed:", error.message);
        }
      } catch {
        console.warn("[preferences] Remote write failed, keeping optimistic state");
      }
      return optimistic;
    },
    [], // Stable — uses refs for current values
  );

  return { prefs, loading, update, reload: load };
}
