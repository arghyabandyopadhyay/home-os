import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 13: Command menu result category limits
 * Validates: Requirements 14.3
 *
 * For any search query executed in the Command Menu against any dataset,
 * each result category (Tasks, Notes, Books, Contacts, Events, Documents)
 * SHALL contain at most 5 items.
 *
 * Tags: Feature: app-ui-redesign, Property 13: Command menu result category limits
 */

/** The categories used in the Command Menu search results */
const CATEGORIES = [
  "Tasks",
  "Notes",
  "Books",
  "Contacts",
  "Events",
  "Documents",
] as const

type Category = (typeof CATEGORIES)[number]

/** Maximum number of results allowed per category */
const MAX_RESULTS_PER_CATEGORY = 5

/**
 * Models the `.limit(5)` behavior applied to each Supabase query in the
 * command menu. Given a dataset of arbitrary size, the limit function
 * returns at most MAX_RESULTS_PER_CATEGORY items.
 */
function applyResultLimit<T>(items: T[], limit: number = MAX_RESULTS_PER_CATEGORY): T[] {
  return items.slice(0, limit)
}

/**
 * Simulates the command menu search result grouping.
 * Each category independently limits its results to 5.
 */
function simulateCommandMenuSearch(datasets: Record<Category, unknown[]>): Record<Category, unknown[]> {
  const results: Record<string, unknown[]> = {}
  for (const category of CATEGORIES) {
    results[category] = applyResultLimit(datasets[category])
  }
  return results as Record<Category, unknown[]>
}

/** Arbitrary for generating a dataset item (simplified as an object with an id) */
const itemArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
})

/** Arbitrary for generating a dataset of varying size (0 to 50 items) */
const datasetArb = fc.array(itemArb, { minLength: 0, maxLength: 50 })

/** Arbitrary for generating datasets for all categories */
const allDatasetsArb = fc.record({
  Tasks: datasetArb,
  Notes: datasetArb,
  Books: datasetArb,
  Contacts: datasetArb,
  Events: datasetArb,
  Documents: datasetArb,
})

describe("Feature: app-ui-redesign, Property 13: Command menu result category limits", () => {
  describe("applyResultLimit correctly caps results at 5", () => {
    it("for any array of items, the result length is at most 5", () => {
      fc.assert(
        fc.property(
          fc.array(itemArb, { minLength: 0, maxLength: 100 }),
          (items) => {
            const limited = applyResultLimit(items)
            expect(limited.length).toBeLessThanOrEqual(MAX_RESULTS_PER_CATEGORY)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("preserves all items when dataset has 5 or fewer items", () => {
      fc.assert(
        fc.property(
          fc.array(itemArb, { minLength: 0, maxLength: 5 }),
          (items) => {
            const limited = applyResultLimit(items)
            expect(limited.length).toBe(items.length)
            expect(limited).toEqual(items)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("truncates to exactly 5 items when dataset exceeds 5", () => {
      fc.assert(
        fc.property(
          fc.array(itemArb, { minLength: 6, maxLength: 100 }),
          (items) => {
            const limited = applyResultLimit(items)
            expect(limited.length).toBe(MAX_RESULTS_PER_CATEGORY)
            // Verify it takes the first 5 items (preserves order)
            expect(limited).toEqual(items.slice(0, 5))
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("Command menu search simulation respects category limits for any dataset", () => {
    it("each category contains at most 5 results regardless of input dataset size", () => {
      fc.assert(
        fc.property(allDatasetsArb, (datasets) => {
          const results = simulateCommandMenuSearch(datasets)

          for (const category of CATEGORIES) {
            expect(results[category].length).toBeLessThanOrEqual(
              MAX_RESULTS_PER_CATEGORY
            )
          }
        }),
        { numRuns: 100 }
      )
    })

    it("total results across all categories never exceed 30 (6 categories × 5 max each)", () => {
      fc.assert(
        fc.property(allDatasetsArb, (datasets) => {
          const results = simulateCommandMenuSearch(datasets)
          const totalResults = CATEGORIES.reduce(
            (sum, cat) => sum + results[cat].length,
            0
          )
          expect(totalResults).toBeLessThanOrEqual(
            CATEGORIES.length * MAX_RESULTS_PER_CATEGORY
          )
        }),
        { numRuns: 100 }
      )
    })

    it("empty datasets produce empty results for each category", () => {
      fc.assert(
        fc.property(
          fc.record({
            Tasks: fc.constant([]),
            Notes: fc.constant([]),
            Books: fc.constant([]),
            Contacts: fc.constant([]),
            Events: fc.constant([]),
            Documents: fc.constant([]),
          }),
          (datasets) => {
            const results = simulateCommandMenuSearch(datasets)
            for (const category of CATEGORIES) {
              expect(results[category].length).toBe(0)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it("categories are independent — one large dataset does not affect other categories", () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.constantFrom(...CATEGORIES),
            fc.array(itemArb, { minLength: 20, maxLength: 50 }),
            fc.array(itemArb, { minLength: 0, maxLength: 3 })
          ),
          ([largeCategory, largeDataset, smallDataset]) => {
            const datasets = {} as Record<Category, unknown[]>
            for (const cat of CATEGORIES) {
              datasets[cat] = cat === largeCategory ? largeDataset : smallDataset
            }

            const results = simulateCommandMenuSearch(datasets)

            // The large category is still capped at 5
            expect(results[largeCategory].length).toBeLessThanOrEqual(
              MAX_RESULTS_PER_CATEGORY
            )

            // Other categories retain their full (small) dataset
            for (const cat of CATEGORIES) {
              if (cat !== largeCategory) {
                expect(results[cat].length).toBe(smallDataset.length)
              }
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("Limit function preserves item ordering (first N items returned)", () => {
    it("returned items are always the first items from the original dataset", () => {
      fc.assert(
        fc.property(
          fc.array(itemArb, { minLength: 1, maxLength: 50 }),
          (items) => {
            const limited = applyResultLimit(items)
            for (let i = 0; i < limited.length; i++) {
              expect(limited[i]).toEqual(items[i])
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("Limit value matches the command menu implementation constant", () => {
    it("the limit constant is exactly 5 as specified in requirements", () => {
      expect(MAX_RESULTS_PER_CATEGORY).toBe(5)
    })

    it("all 6 expected categories are covered", () => {
      expect(CATEGORIES).toHaveLength(6)
      expect(CATEGORIES).toContain("Tasks")
      expect(CATEGORIES).toContain("Notes")
      expect(CATEGORIES).toContain("Books")
      expect(CATEGORIES).toContain("Contacts")
      expect(CATEGORIES).toContain("Events")
      expect(CATEGORIES).toContain("Documents")
    })
  })
})
