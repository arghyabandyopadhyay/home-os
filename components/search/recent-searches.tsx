"use client"

import { X } from "lucide-react"

type RecentSearchesProps = {
  searches: string[]
  onSelect: (query: string) => void
  onClear: (query: string) => void
}

export function RecentSearches({
  searches,
  onSelect,
  onClear,
}: RecentSearchesProps) {
  if (searches.length === 0) {
    return null
  }

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-semibold text-app-muted uppercase tracking-wide px-4 pb-1">
        Recent Searches
      </h3>
      <ul>
        {searches.map((query) => (
          <li key={query} className="item-app flex items-center justify-between px-4 py-2">
            <button
              type="button"
              onClick={() => onSelect(query)}
              className="text-app text-sm text-left flex-1 truncate"
            >
              {query}
            </button>
            <button
              type="button"
              onClick={() => onClear(query)}
              className="text-app-muted ml-2 p-1 rounded hover:bg-app-elevated"
              aria-label={`Remove "${query}" from recent searches`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
