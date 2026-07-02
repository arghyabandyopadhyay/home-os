"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"

import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { useSearch } from "@/hooks/queries/use-search"
import { useSearchStore } from "@/hooks/use-search-store"
import { useSearchKeyboardNav } from "@/hooks/use-search-keyboard-nav"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useLowPerformance } from "@/hooks/use-low-performance"
import { staggerContainer, staggerItem, reducedMotionVariants } from "@/lib/motion"
import type { SearchCategory, SearchResultItem } from "@/types/search"

import { SearchInput } from "@/components/search/search-input"
import { FilterBar } from "@/components/search/filter-bar"
import { RecentSearches } from "@/components/search/recent-searches"
import { SearchEmpty } from "@/components/search/search-empty"
import { SearchSkeleton } from "@/components/search/search-skeleton"
import { SearchError } from "@/components/search/search-error"
import { SearchResultCard } from "@/components/search/search-result-card"

function groupByCategory(results: SearchResultItem[]): Record<string, SearchResultItem[]> {
  const grouped: Record<string, SearchResultItem[]> = {}
  for (const result of results) {
    if (!grouped[result.category]) {
      grouped[result.category] = []
    }
    grouped[result.category].push(result)
  }
  return grouped
}

function getRouteForResult(result: SearchResultItem): string {
  switch (result.category) {
    case "notes":
      return `/notes/${result.id}`
    case "tasks":
      return "/tasks"
    case "documents":
      return `/documents/${result.id}`
    case "contacts":
      return "/contacts"
    case "books":
      return "/library"
    default:
      return "/"
  }
}

export function SearchView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const reducedMotion = useReducedMotion()
  const lowPerformance = useLowPerformance()

  // Local input state initialized from URL
  const initialQuery = searchParams.get("q") ?? ""
  const [inputValue, setInputValue] = useState(initialQuery)

  const debouncedQuery = useDebouncedValue(inputValue, 300)

  // Zustand store
  const {
    activeFilters,
    recentSearches,
    addRecentSearch,
    removeRecentSearch,
    toggleFilter,
    setQuery,
  } = useSearchStore()

  // Search query
  const { data, isLoading, isError, refetch } = useSearch({
    query: debouncedQuery,
    categories: activeFilters.length > 0 ? activeFilters : undefined,
    page: 1,
    pageSize: 10,
  })

  const results = useMemo(() => data?.results ?? [], [data?.results])
  const totalCount = data?.totalCount ?? 0

  // Flatten results for keyboard navigation indexing
  const flatResults = useMemo(() => {
    const grouped = groupByCategory(results)
    const flat: SearchResultItem[] = []
    for (const category of Object.keys(grouped)) {
      flat.push(...grouped[category])
    }
    return flat
  }, [results])

  // Navigate to result
  const handleSelectResult = useCallback(
    (index: number) => {
      const result = flatResults[index]
      if (result) {
        router.push(getRouteForResult(result))
      }
    },
    [flatResults, router]
  )

  // Escape handler — clear focus back to input
  const handleEscape = useCallback(() => {
    // Focus returns to input (handled by keyboard nav setting focusIndex to -1)
  }, [])

  // Keyboard navigation
  const { focusIndex, handleKeyDown } = useSearchKeyboardNav(
    flatResults.length,
    handleSelectResult,
    handleEscape
  )

  // Update URL when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      window.history.replaceState(
        null,
        "",
        "/search?q=" + encodeURIComponent(debouncedQuery)
      )
    } else {
      window.history.replaceState(null, "", "/search")
    }
  }, [debouncedQuery])

  // Sync debounced query to store
  useEffect(() => {
    setQuery(debouncedQuery)
  }, [debouncedQuery, setQuery])

  // Add to recent searches on successful search with results
  useEffect(() => {
    if (debouncedQuery.trim() && results.length > 0) {
      addRecentSearch(debouncedQuery)
    }
  }, [debouncedQuery, results.length, addRecentSearch])

  // Select a recent search
  const handleSelectRecent = useCallback(
    (query: string) => {
      setInputValue(query)
    },
    []
  )

  // Clear a recent search
  const handleClearRecent = useCallback(
    (query: string) => {
      removeRecentSearch(query)
    },
    [removeRecentSearch]
  )

  // Filter toggle
  const handleToggleFilter = useCallback(
    (category: SearchCategory) => {
      toggleFilter(category)
    },
    [toggleFilter]
  )

  // ARIA live region text
  const ariaLiveText = useMemo(() => {
    if (isLoading && debouncedQuery.trim()) return "Loading"
    if (isError) return "Error"
    if (debouncedQuery.trim() && results.length === 0 && !isLoading) return "No results"
    if (results.length > 0) return `${totalCount} result${totalCount !== 1 ? "s" : ""} found`
    return ""
  }, [isLoading, isError, debouncedQuery, results.length, totalCount])

  // Determine what to render in the content area
  const hasQuery = debouncedQuery.trim().length > 0
  const grouped = groupByCategory(results)

  // Build a flat index map to determine which card is selected
  let currentFlatIndex = 0

  return (
    <div
      className="mx-auto max-w-6xl px-6 py-10 space-y-8"
      onKeyDown={handleKeyDown}
    >
      {/* ARIA live region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {ariaLiveText}
      </div>

      {/* Search Input */}
      <SearchInput
        autoFocus
        value={inputValue}
        onChange={setInputValue}
      />

      {/* Filter Bar */}
      <FilterBar activeFilters={activeFilters} onToggle={handleToggleFilter} />

      {/* Content area */}
      {!hasQuery && recentSearches.length > 0 && (
        <RecentSearches
          searches={recentSearches}
          onSelect={handleSelectRecent}
          onClear={handleClearRecent}
        />
      )}

      {!hasQuery && recentSearches.length === 0 && <SearchEmpty />}

      {hasQuery && isLoading && <SearchSkeleton />}

      {hasQuery && isError && !isLoading && (
        <SearchError onRetry={() => refetch()} />
      )}

      {hasQuery && !isLoading && !isError && results.length === 0 && (
        <SearchEmpty query={debouncedQuery} />
      )}

      {hasQuery && !isLoading && !isError && results.length > 0 && (
        <motion.div
          variants={reducedMotion ? reducedMotionVariants : staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {Object.entries(grouped).map(([category, categoryResults]) => {
            const groupStartIndex = currentFlatIndex
            currentFlatIndex += categoryResults.length

            return (
              <div key={category} className="space-y-2">
                <h2 className="text-xs font-semibold text-app-muted uppercase tracking-wide px-4">
                  {category}
                </h2>
                <div role="listbox" aria-label={`${category} results`}>
                  {categoryResults.map((result, i) => {
                    const flatIdx = groupStartIndex + i

                    return (
                      <motion.div
                        key={result.id}
                        variants={reducedMotion ? reducedMotionVariants : staggerItem}
                        className={lowPerformance ? "bg-app-surface rounded-2xl" : ""}
                      >
                        <SearchResultCard
                          result={result}
                          isSelected={focusIndex === flatIdx}
                          onSelect={() => handleSelectResult(flatIdx)}
                        />
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
