import { createClient } from "@/lib/supabase/client";
import { Contact } from "@/types/contact";

const supabase = createClient();

/**
 * Sort contacts alphabetically by name, with favorites pinned at the top.
 * Pure function — does not mutate the input array.
 */
export function sortContactsAlphabetically(contacts: Contact[]): Contact[] {
  return [...contacts].sort((a, b) => {
    // Favorites first
    if (a.favorite && !b.favorite) return -1;
    if (!a.favorite && b.favorite) return 1;
    // Then alphabetical by name (case-insensitive)
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
}

/**
 * Filter contacts by a search query (case-insensitive match on name, email, or phone).
 * Pure function — does not mutate the input array.
 */
export function filterContactsByQuery(
  contacts: Contact[],
  query: string
): Contact[] {
  const q = query.toLowerCase().trim();
  if (q.length < 2) return contacts;
  return contacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(q) ||
      (contact.email ?? "").toLowerCase().includes(q) ||
      (contact.phone ?? "").toLowerCase().includes(q)
  );
}

export async function getContacts() {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("favorite", { ascending: false })
    .order("name", { ascending: true });

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
