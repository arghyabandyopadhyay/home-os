"use client"

import { create } from "zustand"
import type { SearchCategory } from "@/types/search"

const STORAGE_KEY = "home-os:recent-searches"
const MAX_RECENT_SEARCHES = 10

function getStorage(): Storage | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null
  } catch {
    return null
  }
}

function loadRecentSearches(): string[] {
  try {
    const storage = getStorage()
    if (!storage) return []
    const stored = storage.getItem(STORAGE_KEY)
    if (!stored) return []
    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === "string").slice(0, MAX_RECENT_SEARCHES)
  } catch {
    return []
  }
}

function persistRecentSearches(searches: string[]): void {
  try {
    const storage = getStorage()
    if (!storage) return
    storage.setItem(STORAGE_KEY, JSON.stringify(searches))
  } catch {
    // Graceful degradation — continue with in-memory only
  }
}

type SearchState = {
  query: string
  activeFilters: SearchCategory[]
  recentSearches: string[]
  setQuery: (query: string) => void
  setActiveFilters: (filters: SearchCategory[]) => void
  toggleFilter: (category: SearchCategory) => void
  addRecentSearch: (query: string) => void
  removeRecentSearch: (query: string) => void
  clearState: () => void
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  activeFilters: [],
  recentSearches: loadRecentSearches(),

  setQuery: (query) => set({ query }),

  setActiveFilters: (filters) => set({ activeFilters: filters }),

  toggleFilter: (category) =>
    set((state) => {
      const exists = state.activeFilters.includes(category)
      const activeFilters = exists
        ? state.activeFilters.filter((f) => f !== category)
        : [...state.activeFilters, category]
      return { activeFilters }
    }),

  addRecentSearch: (query) =>
    set((state) => {
      const trimmed = query.trim()
      if (!trimmed) return state

      // Case-insensitive deduplication: remove existing match
      const filtered = state.recentSearches.filter(
        (s) => s.toLowerCase() !== trimmed.toLowerCase()
      )

      // Add to front, cap at max
      const recentSearches = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES)
      persistRecentSearches(recentSearches)
      return { recentSearches }
    }),

  removeRecentSearch: (query) =>
    set((state) => {
      const recentSearches = state.recentSearches.filter(
        (s) => s.toLowerCase() !== query.toLowerCase()
      )
      persistRecentSearches(recentSearches)
      return { recentSearches }
    }),

  clearState: () => set({ query: "", activeFilters: [], recentSearches: [] }),
}))
