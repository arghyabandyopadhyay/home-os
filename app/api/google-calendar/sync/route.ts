import { NextResponse } from "next/server";
import {
  syncGoogleCalendarEvents,
  ReconnectRequiredError,
  GoogleApiError,
} from "@/lib/google-calendar";
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
    const result = await syncGoogleCalendarEvents({
      supabase,
      userId: user.id,
      requestUrl: request.url,
    });

    return NextResponse.json({ synced: result.synced });
  } catch (error) {
    if (error instanceof ReconnectRequiredError) {
      return NextResponse.json({ error: "reconnect_required" }, { status: 401 });
    }
    if (error instanceof GoogleApiError) {
      return NextResponse.json(
        { error: "google_api_error", message: error.message },
        { status: 502 }
      );
    }
    if (error instanceof Error && error.message === "not_connected") {
      return NextResponse.json({ error: "not_connected" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "sync_failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
