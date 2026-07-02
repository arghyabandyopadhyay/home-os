export type SearchCategory = "notes" | "tasks" | "documents" | "contacts" | "books"

export type SearchHighlight = {
  field: string
  fragments: string[]
}

export type SearchResultItem = {
  id: string
  title: string
  snippet: string
  category: SearchCategory
  highlights: SearchHighlight[]
  timestamp: string
  metadata: Record<string, unknown>
}

export type SearchPaginationMeta = {
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
}

export type SearchResponse = {
  totalCount: number
  results: SearchResultItem[]
  pagination: SearchPaginationMeta
}

export type SearchParams = {
  query: string
  categories?: SearchCategory[]
  page?: number
  pageSize?: number
}
