import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Query Google Calendar connection status
  const { data: calendarConn } = await supabase
    .from("calendar_connections")
    .select("connected_email")
    .eq("user_id", user.id)
    .eq("provider", "google")
    .maybeSingle();

  // Query Google Contacts connection status
  const { data: contactsConn } = await supabase
    .from("google_contacts_connections")
    .select("connected_email")
    .eq("user_id", user.id)
    .maybeSingle();

  const calendarConnection = {
    connected: !!calendarConn,
    email: calendarConn?.connected_email ?? null,
  };

  const contactsConnection = {
    connected: !!contactsConn,
    email: contactsConn?.connected_email ?? null,
  };

  return (
    <SettingsClient
      calendarConnection={calendarConnection}
      contactsConnection={contactsConnection}
    />
  );
}
