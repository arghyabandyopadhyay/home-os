import { Contact } from "@/types/contact"

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
