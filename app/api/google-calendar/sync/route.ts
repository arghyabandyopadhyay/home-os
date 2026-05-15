import { NextResponse } from "next/server";
import { syncGoogleCalendarEvents } from "@/lib/google-calendar";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await syncGoogleCalendarEvents({
      supabase,
      userId: user.id,
      requestUrl: request.url,
    });

    return NextResponse.json({ events });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not sync Google Calendar";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
