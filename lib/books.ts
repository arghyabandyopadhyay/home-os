import { createServerApiClient } from "@/lib/api-client/server"
import type { Book } from "@/types/book"

export async function getBooks(): Promise<Book[]> {
  const api = await createServerApiClient()
  try {
    return await api.get<Book[]>("/library")
  } catch {
    return []
  }
}

export async function getBook(id: string): Promise<Book | null> {
  const api = await createServerApiClient()
  try {
    return await api.get<Book>(`/library/${id}`)
  } catch {
    return null
  }
}

export async function addBook(input: Partial<Book>): Promise<Book | null> {
  const api = await createServerApiClient()
  try {
    return await api.post<Book>("/library", { body: input })
  } catch {
    return null
  }
}

export async function updateBook(
  id: string,
  updates: Partial<Book>
): Promise<Book | null> {
  const api = await createServerApiClient()
  try {
    return await api.patch<Book>(`/library/${id}`, { body: updates })
  } catch {
    return null
  }
}

export async function removeBook(id: string): Promise<boolean> {
  const api = await createServerApiClient()
  try {
    await api.delete(`/library/${id}`)
    return true
  } catch {
    return false
  }
}
