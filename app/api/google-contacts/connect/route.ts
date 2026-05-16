import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const STATE_COOKIE = "home_os_google_contacts_state";
const GOOGLE_CONTACTS_SCOPE =
  "https://www.googleapis.com/auth/contacts.readonly";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const clientId =
    process.env.GOOGLE_CONTACTS_CLIENT_ID ||
    process.env.GOOGLE_CALENDAR_CLIENT_ID;

  if (!clientId) {
    return NextResponse.redirect(
      new URL("/settings?contacts=missing_google_config", request.url),
    );
  }

  const redirectUri = new URL(
    "/api/google-contacts/callback",
    request.url,
  ).toString();

  // Generate CSRF state and set cookie
  const state = crypto.randomUUID();
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: 10 * 60, // 10-minute TTL
    path: "/",
    sameSite: "lax",
    secure: new URL(request.url).protocol === "https:",
  });

  // Build Google OAuth URL
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", GOOGLE_CONTACTS_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("include_granted_scopes", "true");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  return NextResponse.redirect(url);
}
