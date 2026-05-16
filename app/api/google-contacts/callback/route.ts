import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  exchangeGoogleContactsCode,
  importGoogleContacts,
} from "@/lib/google-contacts";

const STATE_COOKIE = "home_os_google_contacts_state";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const state = requestUrl.searchParams.get("state");

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;
  cookieStore.delete(STATE_COOKIE);

  // Validate CSRF state
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/settings?contacts=oauth_error", request.url),
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
    // Exchange code for tokens
    const token = await exchangeGoogleContactsCode({
      code,
      requestUrl: request.url,
    });

    const expiresAt = token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : null;

    // Upsert to google_contacts_connections
    const { error: upsertError } = await supabase
      .from("google_contacts_connections")
      .upsert(
        {
          user_id: user.id,
          access_token: token.access_token,
          refresh_token: token.refresh_token || null,
          expires_at: expiresAt,
          scope: token.scope || "https://www.googleapis.com/auth/contacts.readonly",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (upsertError) throw upsertError;

    // Import Google Contacts
    await importGoogleContacts(supabase, user.id, token.access_token);

    return NextResponse.redirect(
      new URL("/settings?contacts=connected", request.url),
    );
  } catch (error) {
    console.error("Google Contacts callback failed:", (error as Error).message);
    return NextResponse.redirect(
      new URL("/settings?contacts=error", request.url),
    );
  }
}
