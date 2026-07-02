import { useQuery } from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"
import type { SearchResponse, SearchParams } from "@/types/search"

const api = createClientApiClient()

export const searchKeys = {
  all: ["search"] as const,
  query: (params: SearchParams) => ["search", params] as const,
}

export function useSearch(params: SearchParams) {
  const { query, categories, page = 1, pageSize = 20 } = params

  return useQuery({
    queryKey: searchKeys.query(params),
    queryFn: ({ signal }) =>
      api.get<SearchResponse>("/search", {
        params: {
          q: query.slice(0, 500),
          categories: categories?.join(","),
          page,
          pageSize,
        },
        signal,
      }),
    enabled: query.trim().length > 0,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  })
}
