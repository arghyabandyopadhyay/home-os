"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchUserPreferences,
  saveUserPreferences,
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
      // Merge: don't let remote defaults downgrade onboardingComplete from cache
      const cached = prefsRef.current;
      const merged: UserPreferences = {
        ...remote,
        onboardingComplete: remote.onboardingComplete || cached.onboardingComplete,
      };
      setPrefs(merged);
      writeLocalCache(merged);
      // If cache had onboardingComplete but remote didn't, sync it up
      if (cached.onboardingComplete && !remote.onboardingComplete) {
        saveUserPreferences(supabase, user.id, { onboardingComplete: true }).catch(() => {
          // Best-effort sync — don't block
        });
      }
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
        const saved = await saveUserPreferences(supabase, uid, patch);
        setPrefs(saved);
        writeLocalCache(saved);
        return saved;
      } catch {
        console.warn("[preferences] Remote write failed, keeping optimistic state");
        return optimistic;
      }
    },
    [], // Stable — uses refs for current values
  );

  return { prefs, loading, update, reload: load };
}
