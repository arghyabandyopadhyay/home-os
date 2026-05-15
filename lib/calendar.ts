import { createClient } from "@/lib/supabase/server";
import {
  getTodayBounds,
  hasGoogleCalendarConnection,
} from "@/lib/google-calendar";
import type { CalendarEvent } from "@/types/calendar";

export async function getTodayEvents(): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const { timeMin, timeMax } = getTodayBounds();

  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", user.id)
    .gte("starts_at", timeMin)
    .lt("starts_at", timeMax)
    .order("starts_at", { ascending: true });

  if (error) {
    if (error.code === "42P01") return [];
    console.warn("getTodayEvents:", error.message);
    return [];
  }

  return (data || []) as CalendarEvent[];
}

export async function getGoogleCalendarStatus(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  try {
    return await hasGoogleCalendarConnection(supabase, user.id);
  } catch (error) {
    console.warn(
      "getGoogleCalendarStatus:",
      error instanceof Error ? error.message : error,
    );
    return false;
  }
}
