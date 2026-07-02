/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"

/**
 * Unit tests for the search Zustand store.
 * Validates: Requirements 6.1, 6.2, 6.5, 6.6
 */

// Mock localStorage since jsdom 29+ removed it
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
})

// Import after localStorage mock is in place
const { useSearchStore } = await import("@/hooks/use-search-store")

describe("hooks/use-search-store", () => {
  beforeEach(() => {
    // Reset store state between tests
    useSearchStore.getState().clearState()
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe("initial state", () => {
    it("starts with empty query", () => {
      expect(useSearchStore.getState().query).toBe("")
    })

    it("starts with empty activeFilters", () => {
      expect(useSearchStore.getState().activeFilters).toEqual([])
    })

    it("starts with empty recentSearches when localStorage is empty", () => {
      expect(useSearchStore.getState().recentSearches).toEqual([])
    })
  })

  describe("setQuery", () => {
    it("updates the query string", () => {
      useSearchStore.getState().setQuery("hello")
      expect(useSearchStore.getState().query).toBe("hello")
    })

    it("can set query to empty string", () => {
      useSearchStore.getState().setQuery("hello")
      useSearchStore.getState().setQuery("")
      expect(useSearchStore.getState().query).toBe("")
    })
  })

  describe("setActiveFilters", () => {
    it("replaces the active filters array", () => {
      useSearchStore.getState().setActiveFilters(["notes", "tasks"])
      expect(useSearchStore.getState().activeFilters).toEqual(["notes", "tasks"])
    })

    it("can set to empty array", () => {
      useSearchStore.getState().setActiveFilters(["notes"])
      useSearchStore.getState().setActiveFilters([])
      expect(useSearchStore.getState().activeFilters).toEqual([])
    })
  })

  describe("toggleFilter", () => {
    it("adds a category when not present", () => {
      useSearchStore.getState().toggleFilter("notes")
      expect(useSearchStore.getState().activeFilters).toContain("notes")
    })

    it("removes a category when already present", () => {
      useSearchStore.getState().setActiveFilters(["notes", "tasks"])
      useSearchStore.getState().toggleFilter("notes")
      expect(useSearchStore.getState().activeFilters).toEqual(["tasks"])
    })

    it("preserves other filters when toggling", () => {
      useSearchStore.getState().setActiveFilters(["notes", "tasks", "books"])
      useSearchStore.getState().toggleFilter("tasks")
      expect(useSearchStore.getState().activeFilters).toEqual(["notes", "books"])
    })
  })

  describe("addRecentSearch", () => {
    it("adds a search to the front of the list", () => {
      useSearchStore.getState().addRecentSearch("first")
      useSearchStore.getState().addRecentSearch("second")
      expect(useSearchStore.getState().recentSearches[0]).toBe("second")
      expect(useSearchStore.getState().recentSearches[1]).toBe("first")
    })

    it("does not add empty or whitespace-only queries", () => {
      useSearchStore.getState().addRecentSearch("")
      useSearchStore.getState().addRecentSearch("   ")
      expect(useSearchStore.getState().recentSearches).toEqual([])
    })

    it("deduplicates case-insensitively and moves to top", () => {
      useSearchStore.getState().addRecentSearch("Hello")
      useSearchStore.getState().addRecentSearch("world")
      useSearchStore.getState().addRecentSearch("hello")
      const searches = useSearchStore.getState().recentSearches
      expect(searches).toEqual(["hello", "world"])
    })

    it("caps at 10 entries", () => {
      for (let i = 0; i < 15; i++) {
        useSearchStore.getState().addRecentSearch(`search ${i}`)
      }
      expect(useSearchStore.getState().recentSearches).toHaveLength(10)
      expect(useSearchStore.getState().recentSearches[0]).toBe("search 14")
    })

    it("persists to localStorage", () => {
      useSearchStore.getState().addRecentSearch("persisted")
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "home-os:recent-searches",
        expect.stringContaining("persisted")
      )
    })

    it("trims whitespace before storing", () => {
      useSearchStore.getState().addRecentSearch("  padded  ")
      expect(useSearchStore.getState().recentSearches[0]).toBe("padded")
    })
  })

  describe("removeRecentSearch", () => {
    it("removes a search entry case-insensitively", () => {
      useSearchStore.getState().addRecentSearch("Hello")
      useSearchStore.getState().addRecentSearch("World")
      useSearchStore.getState().removeRecentSearch("hello")
      expect(useSearchStore.getState().recentSearches).toEqual(["World"])
    })

    it("persists removal to localStorage", () => {
      useSearchStore.getState().addRecentSearch("remove-me")
      vi.clearAllMocks()
      useSearchStore.getState().removeRecentSearch("remove-me")
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        "home-os:recent-searches",
        "[]"
      )
    })
  })

  describe("clearState", () => {
    it("resets query, filters, and recent searches", () => {
      useSearchStore.getState().setQuery("test")
      useSearchStore.getState().setActiveFilters(["notes"])
      useSearchStore.getState().addRecentSearch("search")
      useSearchStore.getState().clearState()

      const state = useSearchStore.getState()
      expect(state.query).toBe("")
      expect(state.activeFilters).toEqual([])
      expect(state.recentSearches).toEqual([])
    })
  })

  describe("localStorage graceful degradation", () => {
    it("continues operating if localStorage.setItem throws", () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error("QuotaExceededError")
      })

      // Should not throw
      useSearchStore.getState().addRecentSearch("fallback")
      expect(useSearchStore.getState().recentSearches[0]).toBe("fallback")
    })

    it("handles localStorage.getItem throwing gracefully", () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error("SecurityError")
      })

      // The store still works with in-memory data
      useSearchStore.getState().addRecentSearch("in-memory")
      expect(useSearchStore.getState().recentSearches[0]).toBe("in-memory")
    })
  })
})
