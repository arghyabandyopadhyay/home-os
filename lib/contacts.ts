import { createServerApiClient } from "@/lib/api-client/server"
import type { Contact } from "@/types/contact"

// Re-export pure helpers so existing imports still work
export {
  sortContactsAlphabetically,
  filterContactsByQuery,
} from "@/lib/contacts-utils"

// ─── Server data access ───────────────────────────────────────────────────────

export async function getContacts(): Promise<Contact[]> {
  try {
    const api = await createServerApiClient()
    return await api.get<Contact[]>("/contacts")
  } catch {
    return []
  }
}

export async function createContact(
  contact: Partial<Contact>
): Promise<Contact | null> {
  try {
    const api = await createServerApiClient()
    return await api.post<Contact>("/contacts", { body: contact })
  } catch {
    return null
  }
}

export async function updateContact(
  id: string,
  updates: Partial<Contact>
): Promise<Contact | null> {
  try {
    const api = await createServerApiClient()
    return await api.patch<Contact>(`/contacts/${id}`, { body: updates })
  } catch {
    return null
  }
}

export async function deleteContact(id: string): Promise<boolean> {
  try {
    const api = await createServerApiClient()
    await api.delete(`/contacts/${id}`)
    return true
  } catch {
    return false
  }
}
