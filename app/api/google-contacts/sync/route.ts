import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  importGoogleContacts,
  refreshGoogleContactsToken,
} from "@/lib/google-contacts";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get stored connection
    const { data: connection, error: connError } = await supabase
      .from("google_contacts_connections")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (connError) throw connError;

    if (!connection) {
      return NextResponse.json(
        { error: "Google Contacts is not connected" },
        { status: 400 },
      );
    }

    let accessToken = connection.access_token;

    // Refresh token if expired
    const expiresAt = connection.expires_at
      ? new Date(connection.expires_at).getTime()
      : 0;
    const isExpired = expiresAt && expiresAt < Date.now() + 60_000;

    if (isExpired) {
      if (!connection.refresh_token) {
        return NextResponse.json(
          { error: "Reconnect Google Contacts to refresh access" },
          { status: 400 },
        );
      }

      const refreshed = await refreshGoogleContactsToken(
        connection.refresh_token,
        request.url,
      );

      accessToken = refreshed.access_token;

      const newExpiresAt = refreshed.expires_in
        ? new Date(Date.now() + refreshed.expires_in * 1000).toISOString()
        : connection.expires_at;

      // Update stored token
      await supabase
        .from("google_contacts_connections")
        .update({
          access_token: accessToken,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    }

    // Import contacts
    const result = await importGoogleContacts(supabase, user.id, accessToken);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not sync Google Contacts";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
