import { createClient } from "@/lib/supabase/client";
import { Contact } from "@/types/contact";

const supabase = createClient();

export async function getContacts() {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("favorite", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data as Contact[];
}

export async function createContact(contact: Partial<Contact>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      ...contact,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  return data as Contact;
}

export async function updateContact(id: string, updates: Partial<Contact>) {
  const { data, error } = await supabase
    .from("contacts")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Contact;
}

export async function deleteContact(id: string) {
  const { error } = await supabase.from("contacts").delete().eq("id", id);

  if (error) throw error;
}
