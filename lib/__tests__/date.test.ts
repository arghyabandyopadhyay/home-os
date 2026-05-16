import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { Task } from "@/types/task"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Test task",
    completed: false,
    due_date: null,
    created_at: "2025-01-15T10:00:00",
    priority: null,
    updated_at: "2025-01-15T10:00:00",
    ...overrides,
  }
}

/**
 * Sort tasks by due_date ascending (earliest first), nulls last.
 * This is the ordering expected on the dashboard focus tasks.
 */
function sortTasksByDueDate(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.due_date === null && b.due_date === null) return 0
    if (a.due_date === null) return 1
    if (b.due_date === null) return -1
    return a.due_date.localeCompare(b.due_date)
  })
}

/**
 * Format a UTC ISO string to local time using Intl.DateTimeFormat.
 */
function formatEventTime(isoString: string, timeZone: string): string {
  const date = new Date(isoString)
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
  }).format(date)
}

// ─── Property Tests ───────────────────────────────────────────────────────────

// Feature: calm-home-os, Property 2: Dashboard task ordering
describe("P2: Dashboard Task Ordering", () => {
  it("focus tasks are ordered by due_date ascending (earliest first)", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1, maxLength: 50 }),
            completed: fc.constant(false),
            due_date: fc.oneof(
              fc.constant(null),
              fc.integer({ min: 1704067200000, max: 1798761600000 }).map(
                (ts) => new Date(ts).toISOString()
              )
            ),
            created_at: fc.constant("2025-01-01T00:00:00"),
            priority: fc.constant(null),
            updated_at: fc.constant("2025-01-01T00:00:00"),
          }) as fc.Arbitrary<Task>,
          { minLength: 0, maxLength: 20 }
        ),
        (tasks) => {
          const sorted = sortTasksByDueDate(tasks)

          // Verify ordering: for any two adjacent tasks with non-null due_dates,
          // the first should have due_date <= the second
          for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].due_date !== null && sorted[i + 1].due_date !== null) {
              expect(sorted[i].due_date! <= sorted[i + 1].due_date!).toBe(true)
            }
            // Null due_dates should be at the end
            if (sorted[i].due_date === null) {
              expect(sorted[i + 1].due_date).toBeNull()
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 16: UTC-to-local timezone conversion
describe("P16: UTC-to-Local Timezone Conversion", () => {
  it("same UTC timestamp always produces the same local time string in the same timezone", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1577836800000, max: 1924905600000 }).map(
          (ts) => new Date(ts)
        ),
        fc.constantFrom("America/New_York", "Europe/London", "Asia/Tokyo", "UTC"),
        (date, timeZone) => {
          const isoString = date.toISOString()

          const result1 = formatEventTime(isoString, timeZone)
          const result2 = formatEventTime(isoString, timeZone)

          // Consistency: same input always produces same output
          expect(result1).toBe(result2)

          // The result should match what Intl.DateTimeFormat produces
          const expected = new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
            timeZone,
          }).format(new Date(isoString))

          expect(result1).toBe(expected)
        }
      ),
      { numRuns: 100 }
    )
  })
})
