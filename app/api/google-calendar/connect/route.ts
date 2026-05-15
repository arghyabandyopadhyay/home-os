import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  getGoogleCalendarScope,
  getGoogleOAuthConfig,
} from "@/lib/google-calendar";
import { createClient } from "@/lib/supabase/server";

const STATE_COOKIE = "home_os_google_calendar_state";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { clientId, redirectUri } = getGoogleOAuthConfig(request.url);
  if (!clientId) {
    return NextResponse.redirect(
      new URL("/dashboard?calendar=missing_google_config", request.url),
    );
  }

  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
  });

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", getGoogleCalendarScope());
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url);
}
