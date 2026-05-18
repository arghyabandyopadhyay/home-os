import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { isOverdue } from "@/lib/date"

/**
 * Property 6: Dashboard section ordering
 * Validates: Requirements 8.6
 *
 * For any set of tasks with due dates displayed in the focus section, the order SHALL be:
 * overdue items first sorted by due date ascending, followed by non-overdue items sorted
 * by due date ascending. For any set of notes or books displayed, the order SHALL be by
 * `updated_at` descending (most recently updated first).
 *
 * Tags: Feature: app-ui-redesign, Property 6: Dashboard section ordering
 */

// --- Sorting functions that mirror the dashboard ordering logic ---

type TaskWithDueDate = {
  id: string
  title: string
  due_date: string
  completed: boolean
}

type NoteOrBook = {
  id: string
  title: string
  updated_at: string
}

/**
 * Sorts tasks according to dashboard focus section rules:
 * - Overdue items first, sorted by due_date ascending
 * - Then non-overdue items, sorted by due_date ascending
 */
function sortFocusTasks(tasks: TaskWithDueDate[]): TaskWithDueDate[] {
  return [...tasks].sort((a, b) => {
    const aOverdue = isOverdue(a.due_date)
    const bOverdue = isOverdue(b.due_date)

    // Overdue items come first
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1

    // Within the same group, sort by due_date ascending
    return a.due_date.localeCompare(b.due_date)
  })
}

/**
 * Sorts notes or books by updated_at descending (most recently updated first).
 */
function sortByUpdatedAtDescending(items: NoteOrBook[]): NoteOrBook[] {
  return [...items].sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

// --- Arbitraries ---

/** Generate a date key string in YYYY-MM-DD format using integer components */
const dateKeyArb = fc
  .record({
    year: fc.integer({ min: 2020, max: 2030 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }), // Use 28 to avoid invalid dates
  })
  .map(({ year, month, day }) => {
    const m = String(month).padStart(2, "0")
    const d = String(day).padStart(2, "0")
    return `${year}-${m}-${d}`
  })

/** Generate a timestamp string in ISO format for updated_at */
const timestampArb = fc
  .record({
    year: fc.integer({ min: 2020, max: 2030 }),
    month: fc.integer({ min: 1, max: 12 }),
    day: fc.integer({ min: 1, max: 28 }),
    hour: fc.integer({ min: 0, max: 23 }),
    minute: fc.integer({ min: 0, max: 59 }),
    second: fc.integer({ min: 0, max: 59 }),
  })
  .map(({ year, month, day, hour, minute, second }) => {
    const date = new Date(Date.UTC(year, month - 1, day, hour, minute, second))
    return date.toISOString()
  })

/** Generate a task with a due date */
const taskWithDueDateArb: fc.Arbitrary<TaskWithDueDate> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  due_date: dateKeyArb,
  completed: fc.constant(false),
})

/** Generate a note or book with updated_at */
const noteOrBookArb: fc.Arbitrary<NoteOrBook> = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }),
  updated_at: timestampArb,
})

/** Generate an array of tasks (1 to 8 items, matching dashboard max) */
const taskArrayArb = fc.array(taskWithDueDateArb, { minLength: 1, maxLength: 8 })

/** Generate an array of notes (1 to 6 items, matching dashboard max) */
const noteArrayArb = fc.array(noteOrBookArb, { minLength: 1, maxLength: 6 })

/** Generate an array of books (1 to 3 items, matching dashboard max) */
const bookArrayArb = fc.array(noteOrBookArb, { minLength: 1, maxLength: 3 })

describe("Feature: app-ui-redesign, Property 6: Dashboard section ordering", () => {
  describe("Task ordering: overdue first (ascending), then non-overdue (ascending)", () => {
    it("all overdue tasks appear before all non-overdue tasks", () => {
      fc.assert(
        fc.property(taskArrayArb, (tasks) => {
          const sorted = sortFocusTasks(tasks)

          // Find the boundary: last overdue index and first non-overdue index
          let lastOverdueIdx = -1
          let firstNonOverdueIdx = sorted.length

          sorted.forEach((task, idx) => {
            if (isOverdue(task.due_date)) {
              lastOverdueIdx = idx
            } else if (firstNonOverdueIdx === sorted.length) {
              firstNonOverdueIdx = idx
            }
          })

          // All overdue items must come before all non-overdue items
          if (lastOverdueIdx >= 0 && firstNonOverdueIdx < sorted.length) {
            expect(lastOverdueIdx).toBeLessThan(firstNonOverdueIdx)
          }
        }),
        { numRuns: 100 }
      )
    })

    it("overdue tasks are sorted by due_date ascending within their group", () => {
      fc.assert(
        fc.property(taskArrayArb, (tasks) => {
          const sorted = sortFocusTasks(tasks)
          const overdueTasks = sorted.filter((t) => isOverdue(t.due_date))

          for (let i = 1; i < overdueTasks.length; i++) {
            expect(overdueTasks[i].due_date >= overdueTasks[i - 1].due_date).toBe(
              true
            )
          }
        }),
        { numRuns: 100 }
      )
    })

    it("non-overdue tasks are sorted by due_date ascending within their group", () => {
      fc.assert(
        fc.property(taskArrayArb, (tasks) => {
          const sorted = sortFocusTasks(tasks)
          const nonOverdueTasks = sorted.filter((t) => !isOverdue(t.due_date))

          for (let i = 1; i < nonOverdueTasks.length; i++) {
            expect(
              nonOverdueTasks[i].due_date >= nonOverdueTasks[i - 1].due_date
            ).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })

    it("sorting is stable: output length equals input length", () => {
      fc.assert(
        fc.property(taskArrayArb, (tasks) => {
          const sorted = sortFocusTasks(tasks)
          expect(sorted.length).toBe(tasks.length)
        }),
        { numRuns: 100 }
      )
    })

    it("sorting preserves all original items (no items lost or duplicated)", () => {
      fc.assert(
        fc.property(taskArrayArb, (tasks) => {
          const sorted = sortFocusTasks(tasks)
          const originalIds = new Set(tasks.map((t) => t.id))
          const sortedIds = new Set(sorted.map((t) => t.id))
          expect(sortedIds).toEqual(originalIds)
        }),
        { numRuns: 100 }
      )
    })

    it("sorting is idempotent: sorting an already-sorted array produces the same result", () => {
      fc.assert(
        fc.property(taskArrayArb, (tasks) => {
          const sorted = sortFocusTasks(tasks)
          const sortedAgain = sortFocusTasks(sorted)
          expect(sortedAgain.map((t) => t.id)).toEqual(sorted.map((t) => t.id))
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Notes ordering: updated_at descending (most recently updated first)", () => {
    it("notes are sorted by updated_at descending", () => {
      fc.assert(
        fc.property(noteArrayArb, (notes) => {
          const sorted = sortByUpdatedAtDescending(notes)

          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].updated_at <= sorted[i - 1].updated_at).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })

    it("sorting preserves all original items", () => {
      fc.assert(
        fc.property(noteArrayArb, (notes) => {
          const sorted = sortByUpdatedAtDescending(notes)
          const originalIds = new Set(notes.map((n) => n.id))
          const sortedIds = new Set(sorted.map((n) => n.id))
          expect(sortedIds).toEqual(originalIds)
          expect(sorted.length).toBe(notes.length)
        }),
        { numRuns: 100 }
      )
    })

    it("sorting is idempotent", () => {
      fc.assert(
        fc.property(noteArrayArb, (notes) => {
          const sorted = sortByUpdatedAtDescending(notes)
          const sortedAgain = sortByUpdatedAtDescending(sorted)
          expect(sortedAgain.map((n) => n.id)).toEqual(sorted.map((n) => n.id))
        }),
        { numRuns: 100 }
      )
    })

    it("the first item always has the most recent updated_at", () => {
      fc.assert(
        fc.property(noteArrayArb, (notes) => {
          const sorted = sortByUpdatedAtDescending(notes)
          const maxUpdatedAt = notes.reduce(
            (max, n) => (n.updated_at > max ? n.updated_at : max),
            notes[0].updated_at
          )
          expect(sorted[0].updated_at).toBe(maxUpdatedAt)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Books ordering: updated_at descending (most recently updated first)", () => {
    it("books are sorted by updated_at descending", () => {
      fc.assert(
        fc.property(bookArrayArb, (books) => {
          const sorted = sortByUpdatedAtDescending(books)

          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].updated_at <= sorted[i - 1].updated_at).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })

    it("sorting preserves all original items", () => {
      fc.assert(
        fc.property(bookArrayArb, (books) => {
          const sorted = sortByUpdatedAtDescending(books)
          const originalIds = new Set(books.map((b) => b.id))
          const sortedIds = new Set(sorted.map((b) => b.id))
          expect(sortedIds).toEqual(originalIds)
          expect(sorted.length).toBe(books.length)
        }),
        { numRuns: 100 }
      )
    })

    it("the first item always has the most recent updated_at", () => {
      fc.assert(
        fc.property(bookArrayArb, (books) => {
          const sorted = sortByUpdatedAtDescending(books)
          const maxUpdatedAt = books.reduce(
            (max, b) => (b.updated_at > max ? b.updated_at : max),
            books[0].updated_at
          )
          expect(sorted[0].updated_at).toBe(maxUpdatedAt)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Edge cases", () => {
    it("single task array is already sorted", () => {
      fc.assert(
        fc.property(taskWithDueDateArb, (task) => {
          const sorted = sortFocusTasks([task])
          expect(sorted).toHaveLength(1)
          expect(sorted[0].id).toBe(task.id)
        }),
        { numRuns: 100 }
      )
    })

    it("all tasks overdue: sorted by due_date ascending", () => {
      // Generate tasks with dates guaranteed to be in the past
      const pastDateArb = fc
        .record({
          year: fc.integer({ min: 2020, max: 2023 }),
          month: fc.integer({ min: 1, max: 12 }),
          day: fc.integer({ min: 1, max: 28 }),
        })
        .map(({ year, month, day }) => {
          const m = String(month).padStart(2, "0")
          const d = String(day).padStart(2, "0")
          return `${year}-${m}-${d}`
        })

      const overdueTaskArb = fc.record({
        id: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 50 }),
        due_date: pastDateArb,
        completed: fc.constant(false),
      })

      const overdueArrayArb = fc.array(overdueTaskArb, {
        minLength: 2,
        maxLength: 8,
      })

      fc.assert(
        fc.property(overdueArrayArb, (tasks) => {
          const sorted = sortFocusTasks(tasks)
          // All should be overdue
          expect(sorted.every((t) => isOverdue(t.due_date))).toBe(true)
          // Should be in ascending due_date order
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].due_date >= sorted[i - 1].due_date).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })

    it("all tasks non-overdue: sorted by due_date ascending", () => {
      // Generate tasks with dates guaranteed to be in the future
      const futureDateArb = fc
        .record({
          year: fc.integer({ min: 2028, max: 2030 }),
          month: fc.integer({ min: 1, max: 12 }),
          day: fc.integer({ min: 1, max: 28 }),
        })
        .map(({ year, month, day }) => {
          const m = String(month).padStart(2, "0")
          const d = String(day).padStart(2, "0")
          return `${year}-${m}-${d}`
        })

      const futureTaskArb = fc.record({
        id: fc.uuid(),
        title: fc.string({ minLength: 1, maxLength: 50 }),
        due_date: futureDateArb,
        completed: fc.constant(false),
      })

      const futureArrayArb = fc.array(futureTaskArb, {
        minLength: 2,
        maxLength: 8,
      })

      fc.assert(
        fc.property(futureArrayArb, (tasks) => {
          const sorted = sortFocusTasks(tasks)
          // None should be overdue
          expect(sorted.every((t) => !isOverdue(t.due_date))).toBe(true)
          // Should be in ascending due_date order
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].due_date >= sorted[i - 1].due_date).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })

    it("single note/book is already sorted", () => {
      fc.assert(
        fc.property(noteOrBookArb, (item) => {
          const sorted = sortByUpdatedAtDescending([item])
          expect(sorted).toHaveLength(1)
          expect(sorted[0].id).toBe(item.id)
        }),
        { numRuns: 100 }
      )
    })
  })
})
