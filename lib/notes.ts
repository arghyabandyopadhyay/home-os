import { createServerApiClient } from "@/lib/api-client/server"
import type { Note } from "@/types/note"

// Re-export pure functions from notes-utils (safe for client components)
export {
  truncatePreview,
  filterNotesByQuery,
  filterNotesByTag,
  sortNotesByPin,
  capPinnedNotes,
} from "@/lib/notes-utils"

// --- Server functions ---

export async function getNotes(): Promise<Note[]> {
  const api = await createServerApiClient()
  try {
    return await api.get<Note[]>("/notes")
  } catch {
    return []
  }
}

export async function createNote(): Promise<Note | null> {
  const api = await createServerApiClient()
  try {
    return await api.post<Note>("/notes", {
      body: { title: "Untitled", content: "" },
    })
  } catch {
    return null
  }
}

export async function getNote(id: string): Promise<Note | null> {
  const api = await createServerApiClient()
  try {
    return await api.get<Note>(`/notes/${id}`)
  } catch {
    return null
  }
}

export async function updateNote(
  id: string,
  updates: Partial<Pick<Note, "title" | "content" | "tags" | "linked_book_id" | "linked_contact_id">>
): Promise<Note | null> {
  const api = await createServerApiClient()
  try {
    return await api.patch<Note>(`/notes/${id}`, { body: updates })
  } catch {
    return null
  }
}

export async function deleteNote(id: string): Promise<boolean> {
  const api = await createServerApiClient()
  try {
    await api.delete(`/notes/${id}`)
    return true
  } catch {
    return false
  }
}
