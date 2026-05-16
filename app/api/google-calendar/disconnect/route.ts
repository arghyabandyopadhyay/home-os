import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get the connection to attempt token revocation
    const { data: connection } = await supabase
      .from("calendar_connections")
      .select("access_token")
      .eq("user_id", user.id)
      .eq("provider", "google")
      .maybeSingle();

    // Delete all Google-sourced calendar events for this user
    const { error: deleteEventsError } = await supabase
      .from("calendar_events")
      .delete()
      .eq("user_id", user.id)
      .eq("source", "google");

    if (deleteEventsError) throw deleteEventsError;

    // Attempt token revocation (best-effort, don't fail if this errors)
    if (connection?.access_token) {
      try {
        await fetch(`${GOOGLE_REVOKE_URL}?token=${connection.access_token}`, {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
        });
      } catch {
        // Token revocation is best-effort per requirement 10.7
      }
    }

    // Delete the calendar connection row
    const { error: deleteConnectionError } = await supabase
      .from("calendar_connections")
      .delete()
      .eq("user_id", user.id)
      .eq("provider", "google");

    if (deleteConnectionError) throw deleteConnectionError;

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not disconnect Google Calendar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
