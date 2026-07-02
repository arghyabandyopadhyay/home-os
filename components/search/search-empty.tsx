"use client"

import { Search } from "lucide-react"

type SearchEmptyProps = {
  query?: string
}

export function SearchEmpty({ query }: SearchEmptyProps) {
  if (!query) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-16">
        <div className="flex flex-col items-center text-center">
          <Search className="mb-4 h-12 w-12 text-app-muted" />
          <h2 className="text-xl font-semibold tracking-tight">
            Search Home OS
          </h2>
          <p className="mt-2 max-w-sm text-sm text-app-muted">
            Find notes, tasks, documents, contacts, and books
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[300px] items-center justify-center p-16">
      <div className="flex flex-col items-center text-center">
        <Search className="mb-4 h-12 w-12 text-app-muted" />
        <h2 className="text-xl font-semibold tracking-tight">
          No results found
        </h2>
        <p className="mt-2 max-w-sm text-sm text-app-muted">
          Try different keywords or check your filters
        </p>
      </div>
    </div>
  )
}
