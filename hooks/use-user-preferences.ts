"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  fetchUserPreferences,
  saveUserPreferences,
} from "@/lib/user-settings";
import { applyTheme } from "@/lib/theme";
import type { UserPreferences } from "@/types/user-preferences";
import { defaultUserPreferences } from "@/types/user-preferences";

const LOCAL_PREFS_KEY = "home-os:preferences-cache";

function readLocalCache(): UserPreferences | null {
  try {
    const raw = localStorage.getItem(LOCAL_PREFS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserPreferences;
  } catch {
    return null;
  }
}

function writeLocalCache(prefs: UserPreferences) {
  localStorage.setItem(LOCAL_PREFS_KEY, JSON.stringify(prefs));
}

export function useUserPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(
    defaultUserPreferences,
  );
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const cached = readLocalCache();
        if (cached) setPrefs(cached);
        setUserId(null);
        return;
      }

      setUserId(user.id);
      const remote = await fetchUserPreferences(supabase, user.id);
      setPrefs(remote);
      writeLocalCache(remote);
      if (remote.theme) applyTheme(remote.theme);
    } catch {
      const cached = readLocalCache();
      if (cached) {
        setPrefs(cached);
        if (cached.theme) applyTheme(cached.theme);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [load]);

  const update = useCallback(
    async (patch: Partial<UserPreferences>) => {
      const optimistic: UserPreferences = {
        ...prefs,
        ...patch,
        notifications: {
          ...defaultUserPreferences.notifications!,
          ...prefs.notifications,
          ...patch.notifications,
        },
      };
      setPrefs(optimistic);
      writeLocalCache(optimistic);
      if (patch.theme) applyTheme(patch.theme);

      if (!userId) return optimistic;

      try {
        const saved = await saveUserPreferences(supabase, userId, patch);
        setPrefs(saved);
        writeLocalCache(saved);
        return saved;
      } catch {
        return optimistic;
      }
    },
    [prefs, supabase, userId],
  );

  return { prefs, loading, update, reload: load };
}
