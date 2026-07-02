import { createServerApiClient } from "@/lib/api-client/server"
import type { Book } from "@/types/book"
import type { Contact } from "@/types/contact"
import type { Note } from "@/types/note"
import type { Task } from "@/types/task"

export type TodayData = {
  userName: string
  email: string
  focusTasks: Task[]
  readingBooks: Book[]
  pinnedNotes: Note[]
  recentNotes: Note[]
  favoriteContacts: Contact[]
  counts: {
    openTasks: number
    notes: number
    reading: number
    contacts: number
  }
}

export async function getTodayData(): Promise<TodayData | null> {
  const api = await createServerApiClient()
  try {
    return await api.get<TodayData>("/dashboard")
  } catch {
    return null
  }
}
