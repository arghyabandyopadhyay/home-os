import { createClient } from "@/lib/supabase/server";
import { ContactsView } from "@/components/contacts/contacts-view";

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
    .order("created_at", { ascending: false });

  return (
    <div className="relative min-h-screen bg-[#09090b] text-white">
      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-white/10 bg-[#111118]/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <ContactsView initialContacts={contacts || []} />
        </div>
      </div>
    </div>
  );
}
