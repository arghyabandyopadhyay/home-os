import type { SupabaseClient } from "@supabase/supabase-js";
import {
  defaultUserPreferences,
  type UserPreferences,
} from "@/types/user-preferences";

function mergePreferences(
  raw: unknown,
): UserPreferences {
  const base = { ...defaultUserPreferences };
  if (!raw || typeof raw !== "object") return base;

  const obj = raw as Record<string, unknown>;

  return {
    ...base,
    ...(typeof obj.onboardingComplete === "boolean"
      ? { onboardingComplete: obj.onboardingComplete }
      : {}),
    ...(Array.isArray(obj.pinnedNoteIds)
      ? {
          pinnedNoteIds: obj.pinnedNoteIds.filter(
            (id): id is string => typeof id === "string",
          ),
        }
      : {}),
    ...(obj.theme === "light" || obj.theme === "dark" || obj.theme === "auto"
      ? { theme: obj.theme }
      : {}),
    notifications: {
      ...base.notifications!,
      ...(obj.notifications && typeof obj.notifications === "object"
        ? (obj.notifications as UserPreferences["notifications"])
        : {}),
    },
  };
}

export async function fetchUserPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", userId)
    .single();

  if (error) {
    if (error.code === "42703" || error.message?.includes("preferences")) {
      return defaultUserPreferences;
    }
    console.warn("fetchUserPreferences:", error.message);
    return defaultUserPreferences;
  }

  return mergePreferences(data?.preferences);
}

export async function saveUserPreferences(
  supabase: SupabaseClient,
  userId: string,
  patch: Partial<UserPreferences>,
): Promise<UserPreferences> {
  const current = await fetchUserPreferences(supabase, userId);
  const next: UserPreferences = {
    ...current,
    ...patch,
    notifications: {
      ...defaultUserPreferences.notifications!,
      ...current.notifications,
      ...patch.notifications,
    },
    pinnedNoteIds: patch.pinnedNoteIds ?? current.pinnedNoteIds,
  };

  const { error } = await supabase
    .from("profiles")
    .update({ preferences: next })
    .eq("id", userId);

  if (error) {
    if (error.code === "42703" || error.message?.includes("preferences")) {
      return next;
    }
    throw error;
  }

  return next;
}
