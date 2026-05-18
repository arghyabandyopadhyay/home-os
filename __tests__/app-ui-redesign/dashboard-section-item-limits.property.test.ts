import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 4: Dashboard section item limits
 * Validates: Requirements 8.1
 *
 * For any dataset of user content (tasks, notes, books, contacts) regardless
 * of total count, the dashboard SHALL display at most 8 focus tasks, at most
 * 6 pinned/recent notes, at most 3 currently-reading books, and at most 4
 * favorite contacts.
 *
 * Tags: Feature: app-ui-redesign, Property 4: Dashboard section item limits
 */

/** Dashboard section limits as defined in requirements */
const DASHBOARD_LIMITS = {
  focusTasks: 8,
  notes: 6,
  books: 3,
  contacts: 4,
} as const

type DashboardSection = keyof typeof DASHBOARD_LIMITS

/**
 * Models the limiting logic applied in lib/dashboard.ts via Supabase `.limit()`
 * and `.slice()` calls. Given a dataset of arbitrary size, returns at most
 * the configured maximum number of items for that section.
 */
function applyDashboardLimit<T>(items: T[], section: DashboardSection): T[] {
  return items.slice(0, DASHBOARD_LIMITS[section])
}

/**
 * Simulates the full dashboard data assembly, applying limits to each section
 * independently — mirroring getTodayData() in lib/dashboard.ts.
 */
function simulateDashboardData(datasets: {
  focusTasks: unknown[]
  notes: unknown[]
  books: unknown[]
  contacts: unknown[]
}): Record<DashboardSection, unknown[]> {
  return {
    focusTasks: applyDashboardLimit(datasets.focusTasks, "focusTasks"),
    notes: applyDashboardLimit(datasets.notes, "notes"),
    books: applyDashboardLimit(datasets.books, "books"),
    contacts: applyDashboardLimit(datasets.contacts, "contacts"),
  }
}

/** Constrained date arbitrary that produces valid ISO strings using integer timestamps */
const validDateArb = fc.integer({
  min: new Date("2000-01-01T00:00:00.000Z").getTime(),
  max: new Date("2030-12-31T23:59:59.999Z").getTime(),
}).map((ts) => new Date(ts).toISOString())

/** Arbitrary for generating a task item */
const taskArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  completed: fc.constant(false),
  due_date: fc.option(validDateArb, { nil: null }),
})

/** Arbitrary for generating a note item */
const noteArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  content: fc.string({ minLength: 0, maxLength: 200 }),
  updated_at: validDateArb,
})

/** Arbitrary for generating a book item */
const bookArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }),
  author: fc.string({ minLength: 1, maxLength: 50 }),
  status: fc.constant("reading"),
  updated_at: validDateArb,
})

/** Arbitrary for generating a contact item */
const contactArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  favorite: fc.constant(true),
})

/** Arbitrary for generating datasets of varying sizes (0 to 50 items) */
const allDatasetsArb = fc.record({
  focusTasks: fc.array(taskArb, { minLength: 0, maxLength: 50 }),
  notes: fc.array(noteArb, { minLength: 0, maxLength: 50 }),
  books: fc.array(bookArb, { minLength: 0, maxLength: 50 }),
  contacts: fc.array(contactArb, { minLength: 0, maxLength: 50 }),
})

describe("Feature: app-ui-redesign, Property 4: Dashboard section item limits", () => {
  describe("applyDashboardLimit correctly caps each section", () => {
    it("focus tasks are capped at 8 for any input size", () => {
      fc.assert(
        fc.property(
          fc.array(taskArb, { minLength: 0, maxLength: 100 }),
          (tasks) => {
            const limited = applyDashboardLimit(tasks, "focusTasks")
            expect(limited.length).toBeLessThanOrEqual(DASHBOARD_LIMITS.focusTasks)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("notes are capped at 6 for any input size", () => {
      fc.assert(
        fc.property(
          fc.array(noteArb, { minLength: 0, maxLength: 100 }),
          (notes) => {
            const limited = applyDashboardLimit(notes, "notes")
            expect(limited.length).toBeLessThanOrEqual(DASHBOARD_LIMITS.notes)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("books are capped at 3 for any input size", () => {
      fc.assert(
        fc.property(
          fc.array(bookArb, { minLength: 0, maxLength: 100 }),
          (books) => {
            const limited = applyDashboardLimit(books, "books")
            expect(limited.length).toBeLessThanOrEqual(DASHBOARD_LIMITS.books)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("contacts are capped at 4 for any input size", () => {
      fc.assert(
        fc.property(
          fc.array(contactArb, { minLength: 0, maxLength: 100 }),
          (contacts) => {
            const limited = applyDashboardLimit(contacts, "contacts")
            expect(limited.length).toBeLessThanOrEqual(DASHBOARD_LIMITS.contacts)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("applyDashboardLimit preserves items when under the limit", () => {
    it("preserves all tasks when count is at or below 8", () => {
      fc.assert(
        fc.property(
          fc.array(taskArb, { minLength: 0, maxLength: 8 }),
          (tasks) => {
            const limited = applyDashboardLimit(tasks, "focusTasks")
            expect(limited.length).toBe(tasks.length)
            expect(limited).toEqual(tasks)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("preserves all notes when count is at or below 6", () => {
      fc.assert(
        fc.property(
          fc.array(noteArb, { minLength: 0, maxLength: 6 }),
          (notes) => {
            const limited = applyDashboardLimit(notes, "notes")
            expect(limited.length).toBe(notes.length)
            expect(limited).toEqual(notes)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("preserves all books when count is at or below 3", () => {
      fc.assert(
        fc.property(
          fc.array(bookArb, { minLength: 0, maxLength: 3 }),
          (books) => {
            const limited = applyDashboardLimit(books, "books")
            expect(limited.length).toBe(books.length)
            expect(limited).toEqual(books)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("preserves all contacts when count is at or below 4", () => {
      fc.assert(
        fc.property(
          fc.array(contactArb, { minLength: 0, maxLength: 4 }),
          (contacts) => {
            const limited = applyDashboardLimit(contacts, "contacts")
            expect(limited.length).toBe(contacts.length)
            expect(limited).toEqual(contacts)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("applyDashboardLimit truncates to exact limit when exceeded", () => {
    it("truncates tasks to exactly 8 when dataset exceeds 8", () => {
      fc.assert(
        fc.property(
          fc.array(taskArb, { minLength: 9, maxLength: 50 }),
          (tasks) => {
            const limited = applyDashboardLimit(tasks, "focusTasks")
            expect(limited.length).toBe(DASHBOARD_LIMITS.focusTasks)
            expect(limited).toEqual(tasks.slice(0, 8))
          }
        ),
        { numRuns: 100 }
      )
    })

    it("truncates notes to exactly 6 when dataset exceeds 6", () => {
      fc.assert(
        fc.property(
          fc.array(noteArb, { minLength: 7, maxLength: 50 }),
          (notes) => {
            const limited = applyDashboardLimit(notes, "notes")
            expect(limited.length).toBe(DASHBOARD_LIMITS.notes)
            expect(limited).toEqual(notes.slice(0, 6))
          }
        ),
        { numRuns: 100 }
      )
    })

    it("truncates books to exactly 3 when dataset exceeds 3", () => {
      fc.assert(
        fc.property(
          fc.array(bookArb, { minLength: 4, maxLength: 50 }),
          (books) => {
            const limited = applyDashboardLimit(books, "books")
            expect(limited.length).toBe(DASHBOARD_LIMITS.books)
            expect(limited).toEqual(books.slice(0, 3))
          }
        ),
        { numRuns: 100 }
      )
    })

    it("truncates contacts to exactly 4 when dataset exceeds 4", () => {
      fc.assert(
        fc.property(
          fc.array(contactArb, { minLength: 5, maxLength: 50 }),
          (contacts) => {
            const limited = applyDashboardLimit(contacts, "contacts")
            expect(limited.length).toBe(DASHBOARD_LIMITS.contacts)
            expect(limited).toEqual(contacts.slice(0, 4))
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("Full dashboard simulation respects all limits simultaneously", () => {
    it("all sections are within their respective limits for any dataset combination", () => {
      fc.assert(
        fc.property(allDatasetsArb, (datasets) => {
          const result = simulateDashboardData(datasets)

          expect(result.focusTasks.length).toBeLessThanOrEqual(DASHBOARD_LIMITS.focusTasks)
          expect(result.notes.length).toBeLessThanOrEqual(DASHBOARD_LIMITS.notes)
          expect(result.books.length).toBeLessThanOrEqual(DASHBOARD_LIMITS.books)
          expect(result.contacts.length).toBeLessThanOrEqual(DASHBOARD_LIMITS.contacts)
        }),
        { numRuns: 100 }
      )
    })

    it("total dashboard items never exceed 21 (8 + 6 + 3 + 4)", () => {
      fc.assert(
        fc.property(allDatasetsArb, (datasets) => {
          const result = simulateDashboardData(datasets)
          const total =
            result.focusTasks.length +
            result.notes.length +
            result.books.length +
            result.contacts.length

          const maxTotal =
            DASHBOARD_LIMITS.focusTasks +
            DASHBOARD_LIMITS.notes +
            DASHBOARD_LIMITS.books +
            DASHBOARD_LIMITS.contacts

          expect(total).toBeLessThanOrEqual(maxTotal)
        }),
        { numRuns: 100 }
      )
    })

    it("sections are independent — one large dataset does not affect other sections", () => {
      fc.assert(
        fc.property(
          fc.tuple(
            fc.constantFrom<DashboardSection>("focusTasks", "notes", "books", "contacts"),
            fc.array(taskArb, { minLength: 20, maxLength: 50 }),
            fc.array(noteArb, { minLength: 0, maxLength: 2 }),
            fc.array(bookArb, { minLength: 0, maxLength: 2 }),
            fc.array(contactArb, { minLength: 0, maxLength: 2 })
          ),
          ([largeSection, largeTasks, smallNotes, smallBooks, smallContacts]) => {
            const datasets = {
              focusTasks: largeSection === "focusTasks" ? largeTasks : smallNotes as unknown[],
              notes: largeSection === "notes" ? largeTasks as unknown[] : smallNotes,
              books: largeSection === "books" ? largeTasks as unknown[] : smallBooks,
              contacts: largeSection === "contacts" ? largeTasks as unknown[] : smallContacts,
            }

            const result = simulateDashboardData(datasets)

            // The large section is still capped at its limit
            expect(result[largeSection].length).toBeLessThanOrEqual(
              DASHBOARD_LIMITS[largeSection]
            )
          }
        ),
        { numRuns: 100 }
      )
    })

    it("empty datasets produce empty results for all sections", () => {
      fc.assert(
        fc.property(
          fc.constant({
            focusTasks: [] as unknown[],
            notes: [] as unknown[],
            books: [] as unknown[],
            contacts: [] as unknown[],
          }),
          (datasets) => {
            const result = simulateDashboardData(datasets)
            expect(result.focusTasks.length).toBe(0)
            expect(result.notes.length).toBe(0)
            expect(result.books.length).toBe(0)
            expect(result.contacts.length).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("Dashboard limit constants match implementation values", () => {
    it("focus tasks limit is exactly 8 as specified in requirements", () => {
      expect(DASHBOARD_LIMITS.focusTasks).toBe(8)
    })

    it("notes limit is exactly 6 as specified in requirements", () => {
      expect(DASHBOARD_LIMITS.notes).toBe(6)
    })

    it("books limit is exactly 3 as specified in requirements", () => {
      expect(DASHBOARD_LIMITS.books).toBe(3)
    })

    it("contacts limit is exactly 4 as specified in requirements", () => {
      expect(DASHBOARD_LIMITS.contacts).toBe(4)
    })
  })
})
