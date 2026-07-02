import { createServerApiClient } from "@/lib/api-client/server"

export interface GoogleBookResult {
  title: string
  author: string
  cover_url: string
  description: string
  published_year: string
  preview_url: string
  info_url: string
  external_id: string
}

export async function searchBooks(
  query: string
): Promise<GoogleBookResult | null> {
  if (!query) return null

  const api = await createServerApiClient()
  try {
    return await api.get<GoogleBookResult | null>("/library/search", {
      params: { q: query },
    })
  } catch {
    return null
  }
}
