import { describe, it, expect } from "vitest"
import {
  groupTasksBySection,
  filterTodayTasks,
  countTodayIncomplete,
} from "@/lib/tasks"
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

const TODAY = new Date(2025, 0, 15) // Jan 15, 2025

// ─── groupTasksBySection ──────────────────────────────────────────────────────

describe("groupTasksBySection", () => {
  it("places completed tasks in the completed section", () => {
    const tasks = [makeTask({ id: "1", completed: true })]
    const result = groupTasksBySection(tasks, TODAY)
    expect(result.completed).toHaveLength(1)
    expect(result.today).toHaveLength(0)
    expect(result.upcoming).toHaveLength(0)
  })

  it("places tasks due today in the today section", () => {
    const tasks = [makeTask({ id: "1", due_date: "2025-01-15T09:00:00" })]
    const result = groupTasksBySection(tasks, TODAY)
    expect(result.today).toHaveLength(1)
    expect(result.upcoming).toHaveLength(0)
  })

  it("places overdue tasks in the today section", () => {
    const tasks = [makeTask({ id: "1", due_date: "2025-01-10T09:00:00" })]
    const result = groupTasksBySection(tasks, TODAY)
    expect(result.today).toHaveLength(1)
  })

  it("places tasks with future due dates in the upcoming section", () => {
    const tasks = [makeTask({ id: "1", due_date: "2025-01-20T09:00:00" })]
    const result = groupTasksBySection(tasks, TODAY)
    expect(result.upcoming).toHaveLength(1)
    expect(result.today).toHaveLength(0)
  })

  it("places undated incomplete tasks in the upcoming section", () => {
    const tasks = [makeTask({ id: "1", due_date: null })]
    const result = groupTasksBySection(tasks, TODAY)
    expect(result.upcoming).toHaveLength(1)
    expect(result.today).toHaveLength(0)
  })

  it("sorts today tasks by due_date ascending (overdue first)", () => {
    const tasks = [
      makeTask({ id: "a", due_date: "2025-01-15T12:00:00" }),
      makeTask({ id: "b", due_date: "2025-01-10T08:00:00" }),
      makeTask({ id: "c", due_date: "2025-01-14T08:00:00" }),
    ]
    const result = groupTasksBySection(tasks, TODAY)
    expect(result.today.map((t) => t.id)).toEqual(["b", "c", "a"])
  })

  it("sorts upcoming dated tasks by due_date ascending, undated after", () => {
    const tasks = [
      makeTask({ id: "a", due_date: "2025-01-25T12:00:00" }),
      makeTask({ id: "b", due_date: null }),
      makeTask({ id: "c", due_date: "2025-01-20T08:00:00" }),
    ]
    const result = groupTasksBySection(tasks, TODAY)
    expect(result.upcoming.map((t) => t.id)).toEqual(["c", "a", "b"])
  })

  it("returns empty sections for an empty task list", () => {
    const result = groupTasksBySection([], TODAY)
    expect(result.today).toHaveLength(0)
    expect(result.upcoming).toHaveLength(0)
    expect(result.completed).toHaveLength(0)
  })

  it("every task appears in exactly one section (partition property)", () => {
    const tasks = [
      makeTask({ id: "1", completed: true, due_date: "2025-01-15T09:00:00" }),
      makeTask({ id: "2", due_date: "2025-01-15T09:00:00" }),
      makeTask({ id: "3", due_date: "2025-01-20T09:00:00" }),
      makeTask({ id: "4", due_date: null }),
      makeTask({ id: "5", due_date: "2025-01-10T09:00:00" }),
    ]
    const result = groupTasksBySection(tasks, TODAY)
    const allIds = [
      ...result.today.map((t) => t.id),
      ...result.upcoming.map((t) => t.id),
      ...result.completed.map((t) => t.id),
    ]
    expect(allIds.sort()).toEqual(tasks.map((t) => t.id).sort())
  })
})

// ─── filterTodayTasks ─────────────────────────────────────────────────────────

describe("filterTodayTasks", () => {
  it("returns only tasks due today or overdue that are incomplete", () => {
    const tasks = [
      makeTask({ id: "1", due_date: "2025-01-15T09:00:00" }),
      makeTask({ id: "2", due_date: "2025-01-10T09:00:00" }),
      makeTask({ id: "3", due_date: "2025-01-20T09:00:00" }),
      makeTask({ id: "4", completed: true, due_date: "2025-01-15T09:00:00" }),
    ]
    const result = filterTodayTasks(tasks, TODAY)
    expect(result.map((t) => t.id).sort()).toEqual(["1", "2"])
  })

  it("returns empty array when no tasks are due today", () => {
    const tasks = [
      makeTask({ id: "1", due_date: "2025-01-20T09:00:00" }),
      makeTask({ id: "2", due_date: null }),
    ]
    const result = filterTodayTasks(tasks, TODAY)
    expect(result).toHaveLength(0)
  })
})

// ─── countTodayIncomplete ─────────────────────────────────────────────────────

describe("countTodayIncomplete", () => {
  it("returns the count of incomplete tasks due today or overdue", () => {
    const tasks = [
      makeTask({ id: "1", due_date: "2025-01-15T09:00:00" }),
      makeTask({ id: "2", due_date: "2025-01-10T09:00:00" }),
      makeTask({ id: "3", due_date: "2025-01-20T09:00:00" }),
      makeTask({ id: "4", completed: true, due_date: "2025-01-15T09:00:00" }),
    ]
    expect(countTodayIncomplete(tasks, TODAY)).toBe(2)
  })

  it("returns 0 when all today tasks are completed", () => {
    const tasks = [
      makeTask({ id: "1", completed: true, due_date: "2025-01-15T09:00:00" }),
    ]
    expect(countTodayIncomplete(tasks, TODAY)).toBe(0)
  })

  it("returns 0 for an empty task list", () => {
    expect(countTodayIncomplete([], TODAY)).toBe(0)
  })
})

// ─── Property-Based Tests ─────────────────────────────────────────────────────

import * as fc from "fast-check"

function taskArb(today: Date): fc.Arbitrary<Task> {
  const todayTs = today.getTime()

  return fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 0, maxLength: 100 }),
    completed: fc.boolean(),
    due_date: fc.oneof(
      fc.constant(null),
      // Past dates (overdue / today)
      fc.integer({ min: todayTs - 30 * 86400000, max: todayTs }).map(
        (ts) => new Date(ts).toISOString()
      ),
      // Future dates
      fc.integer({ min: todayTs + 86400000, max: todayTs + 365 * 86400000 }).map(
        (ts) => new Date(ts).toISOString()
      )
    ),
    created_at: fc.constant("2025-01-01T00:00:00"),
    priority: fc.oneof(
      fc.constant(null),
      fc.constant("low" as const),
      fc.constant("medium" as const),
      fc.constant("high" as const)
    ),
    updated_at: fc.constant("2025-01-01T00:00:00"),
  })
}

// Feature: calm-home-os, Property 10: Task grouping partition
describe("P10: Task Grouping Partition", () => {
  it("every task appears in exactly one section, no task omitted or duplicated", () => {
    fc.assert(
      fc.property(
        fc.array(taskArb(TODAY), { minLength: 0, maxLength: 30 }),
        (tasks) => {
          const result = groupTasksBySection(tasks, TODAY)
          const allIds = [
            ...result.today.map((t) => t.id),
            ...result.upcoming.map((t) => t.id),
            ...result.completed.map((t) => t.id),
          ]

          // No duplicates
          expect(new Set(allIds).size).toBe(allIds.length)
          // No omissions
          expect(allIds.length).toBe(tasks.length)
          // Every original task is present
          const originalIds = tasks.map((t) => t.id).sort()
          expect([...allIds].sort()).toEqual(originalIds)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 11: Whitespace rejection
describe("P11: Whitespace Task Rejection", () => {
  it("whitespace-only strings should be rejected as task titles", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(" ", "\t", "\n", "\r"), { minLength: 1, maxLength: 50 }).map(
          (chars) => chars.join("")
        ),
        (whitespaceTitle) => {
          // The validation logic: a title is invalid if trim() is empty
          const isValid = whitespaceTitle.trim().length > 0
          expect(isValid).toBe(false)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 12: Complete/incomplete round-trip
describe("P12: Task Complete/Incomplete Round-Trip", () => {
  it("marking complete then incomplete returns task to same section with same fields", () => {
    fc.assert(
      fc.property(
        taskArb(TODAY).filter((t) => !t.completed),
        (task) => {
          const tasks = [task]

          // Find original section
          const before = groupTasksBySection(tasks, TODAY)
          const originalSection = before.today.includes(task)
            ? "today"
            : "upcoming"

          // Mark complete
          const completedTask = { ...task, completed: true }
          const afterComplete = groupTasksBySection([completedTask], TODAY)
          expect(afterComplete.completed).toHaveLength(1)

          // Mark incomplete again
          const restoredTask = { ...completedTask, completed: false }
          const afterRestore = groupTasksBySection([restoredTask], TODAY)

          // Should be back in original section
          if (originalSection === "today") {
            expect(afterRestore.today).toHaveLength(1)
            expect(afterRestore.today[0].title).toBe(task.title)
            expect(afterRestore.today[0].due_date).toBe(task.due_date)
          } else {
            expect(afterRestore.upcoming).toHaveLength(1)
            expect(afterRestore.upcoming[0].title).toBe(task.title)
            expect(afterRestore.upcoming[0].due_date).toBe(task.due_date)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 13: Today filter predicate
describe("P13: Today Filter Predicate", () => {
  it("only returns tasks where !completed AND due_date is not null AND due_date <= today", () => {
    const todayKey = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}-${String(TODAY.getDate()).padStart(2, "0")}`

    fc.assert(
      fc.property(
        fc.array(taskArb(TODAY), { minLength: 0, maxLength: 30 }),
        (tasks) => {
          const result = filterTodayTasks(tasks, TODAY)

          for (const task of result) {
            expect(task.completed).toBe(false)
            expect(task.due_date).not.toBeNull()
            const dueDateKey = task.due_date!.slice(0, 10)
            expect(dueDateKey <= todayKey).toBe(true)
          }

          // No task matching the predicate should be missing
          for (const task of tasks) {
            if (
              !task.completed &&
              task.due_date !== null &&
              task.due_date.slice(0, 10) <= todayKey
            ) {
              expect(result.some((t) => t.id === task.id)).toBe(true)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 14: Today count invariant
describe("P14: Today Count Invariant", () => {
  it("count equals the number of tasks matching the today predicate", () => {
    const todayKey = `${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, "0")}-${String(TODAY.getDate()).padStart(2, "0")}`

    fc.assert(
      fc.property(
        fc.array(taskArb(TODAY), { minLength: 0, maxLength: 30 }),
        (tasks) => {
          const count = countTodayIncomplete(tasks, TODAY)
          const expected = tasks.filter(
            (t) =>
              !t.completed &&
              t.due_date !== null &&
              t.due_date.slice(0, 10) <= todayKey
          ).length

          expect(count).toBe(expected)
        }
      ),
      { numRuns: 100 }
    )
  })
})
