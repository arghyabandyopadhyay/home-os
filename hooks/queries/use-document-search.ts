import { useQuery } from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"
import type { DocumentSearchResult } from "@/types/document"

const api = createClientApiClient()

export const documentSearchKeys = {
  query: (q: string) => ["document-search", q] as const,
}

export function useDocumentSearch(query: string) {
  return useQuery({
    queryKey: documentSearchKeys.query(query),
    queryFn: ({ signal }) =>
      api.get<DocumentSearchResult[]>("/documents/search", {
        params: { q: query },
        signal,
      }),
    enabled: query.trim().length >= 2,
    staleTime: 15_000,
    placeholderData: (previousData) => previousData,
  })
}
