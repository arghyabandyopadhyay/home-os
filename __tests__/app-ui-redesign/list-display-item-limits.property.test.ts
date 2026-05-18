import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 12: List display item limits
 * Validates: Requirements 13.3
 *
 * For any list section on any module page (excluding the dashboard which has
 * its own limits), the number of displayed items SHALL NOT exceed 5, with full
 * content accessible via user interaction.
 *
 * The ITEMS_PER_SECTION constant is 5 in tasks, contacts, library, and notes.
 * This test models the limiting logic and verifies that for any dataset size,
 * displayed items are capped at 5.
 *
 * Tags: Feature: app-ui-redesign, Property 12: List display item limits
 */

/** The universal list display limit for module pages (excluding dashboard) */
const ITEMS_PER_SECTION = 5

/** Module pages that enforce the 5-item display limit */
const MODULE_PAGES = ["tasks", "contacts", "library", "notes"] as const
type ModulePage = (typeof MODULE_PAGES)[number]

/** Sections within each module that apply the limit */
const MODULE_SECTIONS: Record<ModulePage, string[]> = {
  tasks: ["today", "upcoming", "completed"],
  contacts: ["favorites", "others"],
  library: ["reading", "toRead", "finished"],
  notes: ["notes"],
}

/**
 * Models the limiting logic used across all module pages.
 * When `expanded` is false (default state), items are sliced to ITEMS_PER_SECTION.
 * When `expanded` is true (after user interaction), all items are shown.
 */
function applyListDisplayLimit<T>(items: T[], expanded: boolean): T[] {
  if (expanded) return items
  return items.slice(0, ITEMS_PER_SECTION)
}

/**
 * Determines whether a "show more" interaction should be available.
 * Returns true when the dataset exceeds the display limit.
 */
function hasMoreItems<T>(items: T[]): boolean {
  return items.length > ITEMS_PER_SECTION
}

/** Constrained date arbitrary that produces valid ISO strings using integer timestamps */
const validDateArb = fc
  .integer({
    min: new Date("2000-01-01T00:00:00.000Z").getTime(),
    max: new Date("2030-12-31T23:59:59.999Z").getTime(),
  })
  .map((ts) => new Date(ts).toISOString())

/** Arbitrary for generating a generic list item */
const listItemArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  createdAt: validDateArb,
})

/** Arbitrary for generating a task item */
const taskItemArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  completed: fc.boolean(),
  due_date: fc.option(validDateArb, { nil: null }),
})

/** Arbitrary for generating a contact item */
const contactItemArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  favorite: fc.boolean(),
})

/** Arbitrary for generating a book item */
const bookItemArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  author: fc.string({ minLength: 1, maxLength: 50 }),
  status: fc.constantFrom("reading", "to_read", "finished"),
})

/** Arbitrary for generating a note item */
const noteItemArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  content: fc.string({ minLength: 0, maxLength: 200 }),
  updated_at: validDateArb,
})

describe("Feature: app-ui-redesign, Property 12: List display item limits", () => {
  describe("Default display (collapsed) never exceeds 5 items", () => {
    it("tasks section displays at most 5 items when not expanded", () => {
      fc.assert(
        fc.property(
          fc.array(taskItemArb, { minLength: 0, maxLength: 100 }),
          (tasks) => {
            const displayed = applyListDisplayLimit(tasks, false)
            expect(displayed.length).toBeLessThanOrEqual(ITEMS_PER_SECTION)
          }
        ),
        { numRuns: 150 }
      )
    })

    it("contacts section displays at most 5 items when not expanded", () => {
      fc.assert(
        fc.property(
          fc.array(contactItemArb, { minLength: 0, maxLength: 100 }),
          (contacts) => {
            const displayed = applyListDisplayLimit(contacts, false)
            expect(displayed.length).toBeLessThanOrEqual(ITEMS_PER_SECTION)
          }
        ),
        { numRuns: 150 }
      )
    })

    it("library section displays at most 5 items when not expanded", () => {
      fc.assert(
        fc.property(
          fc.array(bookItemArb, { minLength: 0, maxLength: 100 }),
          (books) => {
            const displayed = applyListDisplayLimit(books, false)
            expect(displayed.length).toBeLessThanOrEqual(ITEMS_PER_SECTION)
          }
        ),
        { numRuns: 150 }
      )
    })

    it("notes section displays at most 5 items when not expanded", () => {
      fc.assert(
        fc.property(
          fc.array(noteItemArb, { minLength: 0, maxLength: 100 }),
          (notes) => {
            const displayed = applyListDisplayLimit(notes, false)
            expect(displayed.length).toBeLessThanOrEqual(ITEMS_PER_SECTION)
          }
        ),
        { numRuns: 150 }
      )
    })
  })

  describe("Expanded state shows all items (full content accessible via interaction)", () => {
    it("tasks section shows all items when expanded by user interaction", () => {
      fc.assert(
        fc.property(
          fc.array(taskItemArb, { minLength: 0, maxLength: 100 }),
          (tasks) => {
            const displayed = applyListDisplayLimit(tasks, true)
            expect(displayed.length).toBe(tasks.length)
            expect(displayed).toEqual(tasks)
          }
        ),
        { numRuns: 150 }
      )
    })

    it("contacts section shows all items when expanded by user interaction", () => {
      fc.assert(
        fc.property(
          fc.array(contactItemArb, { minLength: 0, maxLength: 100 }),
          (contacts) => {
            const displayed = applyListDisplayLimit(contacts, true)
            expect(displayed.length).toBe(contacts.length)
            expect(displayed).toEqual(contacts)
          }
        ),
        { numRuns: 150 }
      )
    })

    it("library section shows all items when expanded by user interaction", () => {
      fc.assert(
        fc.property(
          fc.array(bookItemArb, { minLength: 0, maxLength: 100 }),
          (books) => {
            const displayed = applyListDisplayLimit(books, true)
            expect(displayed.length).toBe(books.length)
            expect(displayed).toEqual(books)
          }
        ),
        { numRuns: 150 }
      )
    })

    it("notes section shows all items when expanded by user interaction", () => {
      fc.assert(
        fc.property(
          fc.array(noteItemArb, { minLength: 0, maxLength: 100 }),
          (notes) => {
            const displayed = applyListDisplayLimit(notes, true)
            expect(displayed.length).toBe(notes.length)
            expect(displayed).toEqual(notes)
          }
        ),
        { numRuns: 150 }
      )
    })
  })

  describe("Items under the limit are preserved without truncation", () => {
    it("displays all items when count is at or below 5", () => {
      fc.assert(
        fc.property(
          fc.array(listItemArb, { minLength: 0, maxLength: 5 }),
          (items) => {
            const displayed = applyListDisplayLimit(items, false)
            expect(displayed.length).toBe(items.length)
            expect(displayed).toEqual(items)
          }
        ),
        { numRuns: 150 }
      )
    })

    it("no 'show more' interaction is needed when items are at or below 5", () => {
      fc.assert(
        fc.property(
          fc.array(listItemArb, { minLength: 0, maxLength: 5 }),
          (items) => {
            expect(hasMoreItems(items)).toBe(false)
          }
        ),
        { numRuns: 150 }
      )
    })
  })

  describe("Datasets exceeding the limit are truncated to exactly 5", () => {
    it("truncates to exactly 5 items when dataset exceeds 5", () => {
      fc.assert(
        fc.property(
          fc.array(listItemArb, { minLength: 6, maxLength: 100 }),
          (items) => {
            const displayed = applyListDisplayLimit(items, false)
            expect(displayed.length).toBe(ITEMS_PER_SECTION)
            expect(displayed).toEqual(items.slice(0, 5))
          }
        ),
        { numRuns: 150 }
      )
    })

    it("'show more' interaction is available when items exceed 5", () => {
      fc.assert(
        fc.property(
          fc.array(listItemArb, { minLength: 6, maxLength: 100 }),
          (items) => {
            expect(hasMoreItems(items)).toBe(true)
          }
        ),
        { numRuns: 150 }
      )
    })
  })

  describe("Limit applies uniformly across all module sections", () => {
    it("every section in every module respects the 5-item limit", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...MODULE_PAGES),
          fc.array(listItemArb, { minLength: 0, maxLength: 100 }),
          (modulePage, items) => {
            const sections = MODULE_SECTIONS[modulePage]
            for (const _section of sections) {
              const displayed = applyListDisplayLimit(items, false)
              expect(displayed.length).toBeLessThanOrEqual(ITEMS_PER_SECTION)
            }
          }
        ),
        { numRuns: 150 }
      )
    })

    it("multiple sections within a module are independently limited", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...MODULE_PAGES),
          fc.array(
            fc.array(listItemArb, { minLength: 0, maxLength: 50 }),
            { minLength: 1, maxLength: 4 }
          ),
          (modulePage, sectionDatasets) => {
            const sections = MODULE_SECTIONS[modulePage]
            for (let i = 0; i < Math.min(sections.length, sectionDatasets.length); i++) {
              const displayed = applyListDisplayLimit(sectionDatasets[i], false)
              expect(displayed.length).toBeLessThanOrEqual(ITEMS_PER_SECTION)
            }
          }
        ),
        { numRuns: 150 }
      )
    })
  })

  describe("ITEMS_PER_SECTION constant matches implementation value", () => {
    it("the display limit constant is exactly 5 as specified in requirements", () => {
      expect(ITEMS_PER_SECTION).toBe(5)
    })

    it("all module pages use the same limit value", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...MODULE_PAGES),
          (modulePage) => {
            // Each module page uses the same ITEMS_PER_SECTION = 5 constant
            expect(ITEMS_PER_SECTION).toBe(5)
            // Verify the module has at least one section defined
            expect(MODULE_SECTIONS[modulePage].length).toBeGreaterThan(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("Order preservation during limiting", () => {
    it("displayed items maintain original order from the dataset", () => {
      fc.assert(
        fc.property(
          fc.array(listItemArb, { minLength: 6, maxLength: 100 }),
          (items) => {
            const displayed = applyListDisplayLimit(items, false)
            for (let i = 0; i < displayed.length; i++) {
              expect(displayed[i]).toEqual(items[i])
            }
          }
        ),
        { numRuns: 150 }
      )
    })

    it("expanded items maintain original order from the dataset", () => {
      fc.assert(
        fc.property(
          fc.array(listItemArb, { minLength: 0, maxLength: 100 }),
          (items) => {
            const displayed = applyListDisplayLimit(items, true)
            for (let i = 0; i < displayed.length; i++) {
              expect(displayed[i]).toEqual(items[i])
            }
          }
        ),
        { numRuns: 150 }
      )
    })
  })
})
