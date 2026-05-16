import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  exchangeGoogleCalendarCode,
  fetchGoogleUserEmail,
  saveGoogleCalendarConnection,
  syncGoogleCalendarEvents,
} from "@/lib/google-calendar";
import { createClient } from "@/lib/supabase/server";

const STATE_COOKIE = "home_os_google_calendar_state";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/dashboard?calendar=oauth_error", request.url),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const token = await exchangeGoogleCalendarCode({
      code,
      requestUrl: request.url,
    });

    // Verify the calendar scope was actually granted
    const grantedScopes = token.scope || "";
    if (!grantedScopes.includes("calendar")) {
      console.error(
        "Google Calendar callback failed: Request had insufficient authentication scopes.",
        `Granted: ${grantedScopes}`,
      );
      return NextResponse.redirect(
        new URL("/dashboard?calendar=insufficient_scopes", request.url),
      );
    }

    const email = await fetchGoogleUserEmail(token.access_token!);
    if (email === null) {
      console.warn("Could not fetch Google user email");
    }

    await saveGoogleCalendarConnection({ supabase, userId: user.id, token, connectedEmail: email });
    await syncGoogleCalendarEvents({
      supabase,
      userId: user.id,
      requestUrl: request.url,
    });

    return NextResponse.redirect(
      new URL("/dashboard?calendar=connected", request.url),
    );
  } catch (error) {
    console.error(
      "Google Calendar callback failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return NextResponse.redirect(
      new URL("/dashboard?calendar=sync_error", request.url),
    );
  }
}
