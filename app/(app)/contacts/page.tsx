import { createClient } from "@/lib/supabase/server";
import { ContactsView } from "@/components/contacts/contacts-view";
import { PageShell } from "@/components/layout/page-shell";

export default async function ContactsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: contacts } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", user?.id)
    .order("favorite", { ascending: false })
    .order("name", { ascending: true });

  return (
    <PageShell title="Contacts" description="People that matter to you">
      <ContactsView initialContacts={contacts || []} />
    </PageShell>
  );
}
