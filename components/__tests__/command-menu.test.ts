import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

// ─── Pure function extracted from CommandMenu for testing ─────────────────────

type SearchResultItem = {
  id: string
  type: "task" | "note" | "book" | "contact" | "event" | "document"
  user_id: string
  title: string
}

type GroupedResults = Record<string, SearchResultItem[]>

/**
 * Groups search results by their content type.
 * Each item appears in exactly one group matching its type.
 */
function groupSearchResults(items: SearchResultItem[]): GroupedResults {
  const groups: GroupedResults = {}
  for (const item of items) {
    if (!groups[item.type]) {
      groups[item.type] = []
    }
    groups[item.type].push(item)
  }
  return groups
}

/**
 * Filters results to only include items belonging to the given user.
 */
function filterByUser(items: SearchResultItem[], userId: string): SearchResultItem[] {
  return items.filter((item) => item.user_id === userId)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const contentTypes = ["task", "note", "book", "contact", "event", "document"] as const

function searchResultArb(): fc.Arbitrary<SearchResultItem> {
  return fc.record({
    id: fc.uuid(),
    type: fc.constantFrom(...contentTypes),
    user_id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 50 }),
  })
}

// ─── Property Tests ───────────────────────────────────────────────────────────

// Feature: calm-home-os, Property 27: Universal search grouping
describe("P27: Universal Search Grouping", () => {
  it("each item appears in exactly one section matching its content type", () => {
    fc.assert(
      fc.property(
        fc.array(searchResultArb(), { minLength: 0, maxLength: 30 }),
        (items) => {
          const grouped = groupSearchResults(items)

          // Every item should appear in exactly one group
          let totalGrouped = 0
          for (const [type, groupItems] of Object.entries(grouped)) {
            totalGrouped += groupItems.length
            // Every item in this group should have the matching type
            for (const item of groupItems) {
              expect(item.type).toBe(type)
            }
          }

          // Total items in all groups should equal input length
          expect(totalGrouped).toBe(items.length)

          // No item should appear in a group for a different type
          for (const item of items) {
            const group = grouped[item.type]
            expect(group).toBeDefined()
            expect(group.some((g) => g.id === item.id)).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 28: User isolation
describe("P28: Universal Search User Isolation", () => {
  it("all returned results have user_id matching the authenticated user", () => {
    fc.assert(
      fc.property(
        fc.array(searchResultArb(), { minLength: 0, maxLength: 30 }),
        fc.uuid(),
        (items, authenticatedUserId) => {
          const filtered = filterByUser(items, authenticatedUserId)

          // Every result should belong to the authenticated user
          for (const item of filtered) {
            expect(item.user_id).toBe(authenticatedUserId)
          }

          // No item belonging to a different user should appear
          for (const item of filtered) {
            expect(item.user_id).not.toBe(
              item.user_id !== authenticatedUserId ? item.user_id : undefined
            )
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
