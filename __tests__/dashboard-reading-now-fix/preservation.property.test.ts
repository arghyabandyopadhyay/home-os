// Feature: dashboard-reading-now-fix
// Property 2: Preservation — Non-Books Dashboard Queries Unchanged
//
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
//
// This test observes and asserts that non-books queries in getTodayData() continue
// to work correctly on UNFIXED code. Focus tasks are ordered by due_date,
// pinned notes are fetched correctly, favorite contacts are ordered by updated_at,
// and all count queries return correct values.
// These tests MUST PASS on unfixed code — they capture baseline behavior to preserve.

import { describe, it, expect, vi, beforeEach } from "vitest"
import * as fc from "fast-check"

// --- Mocking infrastructure ---

// We need to track what queries are made and return generated data
type MockQueryState = {
  focusTasks: Array<Record<string, unknown>>
  readingBooks: Array<Record<string, unknown>>
  favoriteContacts: Array<Record<string, unknown>>
  pinnedNotes: Array<Record<string, unknown>>
  recentNotes: Array<Record<string, unknown>>
  openTasksCount: number
  notesCount: number
  readingCount: number
  contactsCount: number
}

let mockState: MockQueryState = {
  focusTasks: [],
  readingBooks: [],
  favoriteContacts: [],
  pinnedNotes: [],
  recentNotes: [],
  openTasksCount: 0,
  notesCount: 0,
  readingCount: 0,
  contactsCount: 0,
}

// Build a chainable mock query builder that resolves based on accumulated filters
function createMockQueryBuilder(table: string) {
  const state: {
    table: string
    filters: Array<{ method: string; args: unknown[] }>
    selectArgs: unknown[]
    orderCol: string | null
    orderAsc: boolean
    limitVal: number | null
  } = {
    table,
    filters: [],
    selectArgs: [],
    orderCol: null,
    orderAsc: true,
    limitVal: null,
  }

  const builder: Record<string, unknown> = {}

  const chainMethods = ["eq", "not", "lte", "is", "in", "gte", "lt", "gt", "neq", "like", "ilike"]

  for (const method of chainMethods) {
    builder[method] = (...args: unknown[]) => {
      state.filters.push({ method, args })
      return builder
    }
  }

  builder.select = (...args: unknown[]) => {
    state.selectArgs = args
    return builder
  }

  builder.order = (col: string, opts?: { ascending?: boolean }) => {
    state.orderCol = col
    state.orderAsc = opts?.ascending ?? true
    return builder
  }

  builder.limit = (n: number) => {
    state.limitVal = n
    return builder
  }

  // When the promise resolves, determine what data to return
  builder.then = (resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) => {
    const result = resolveQuery(state)
    return Promise.resolve(result).then(resolve, reject)
  }

  return builder
}

function resolveQuery(state: {
  table: string
  filters: Array<{ method: string; args: unknown[] }>
  selectArgs: unknown[]
  orderCol: string | null
  orderAsc: boolean
  limitVal: number | null
}) {
  const { table, filters, selectArgs } = state

  // Check if this is a count query
  const isCountQuery =
    selectArgs.length >= 2 &&
    typeof selectArgs[1] === "object" &&
    selectArgs[1] !== null &&
    (selectArgs[1] as Record<string, unknown>).count === "exact" &&
    (selectArgs[1] as Record<string, unknown>).head === true

  if (isCountQuery) {
    if (table === "tasks") {
      return { count: mockState.openTasksCount, data: null, error: null }
    }
    if (table === "notes") {
      return { count: mockState.notesCount, data: null, error: null }
    }
    if (table === "books") {
      return { count: mockState.readingCount, data: null, error: null }
    }
    if (table === "contacts") {
      return { count: mockState.contactsCount, data: null, error: null }
    }
  }

  // Data queries
  if (table === "tasks") {
    return { data: mockState.focusTasks, error: null }
  }
  if (table === "books") {
    // The books query uses updated_at (the bug) — Supabase returns empty
    return { data: mockState.readingBooks, error: null }
  }
  if (table === "contacts") {
    return { data: mockState.favoriteContacts, error: null }
  }
  if (table === "notes") {
    // Check if this is a pinned notes query (uses .in filter) or recent notes
    const hasInFilter = filters.some((f) => f.method === "in")
    if (hasInFilter) {
      return { data: mockState.pinnedNotes, error: null }
    }
    return { data: mockState.recentNotes, error: null }
  }

  return { data: [], error: null }
}

// Mock Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockImplementation(async () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id", email: "test@example.com", user_metadata: { full_name: "Test User" } } },
        error: null,
      }),
    },
    from: (table: string) => createMockQueryBuilder(table),
  })),
}))

// Mock user-settings to return empty pinned notes (so it falls back to recent notes)
vi.mock("@/lib/user-settings", () => ({
  fetchUserPreferences: vi.fn().mockResolvedValue({ pinnedNoteIds: [] }),
}))

// Import after mocks
import { getTodayData } from "@/lib/dashboard"

// --- Arbitrary generators ---

/**
 * Generate a date string in ISO format within a reasonable range.
 * Uses integer timestamps to avoid invalid date issues with fc.date().
 */
const minTimestamp = new Date("2020-01-01T00:00:00Z").getTime()
const maxTimestamp = new Date("2025-01-01T00:00:00Z").getTime()

const dateStringArb = fc
  .integer({ min: minTimestamp, max: maxTimestamp })
  .map((ts) => new Date(ts).toISOString())

const dateKeyArb = fc
  .integer({ min: minTimestamp, max: maxTimestamp })
  .map((ts) => new Date(ts).toISOString().slice(0, 10))

/**
 * Generate a task with a due_date for focus tasks testing.
 * Focus tasks are: completed=false, due_date <= today, ordered by due_date ascending.
 */
const taskArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
  completed: fc.constant(false),
  due_date: dateKeyArb,
  created_at: dateStringArb,
  priority: fc.constantFrom("low", "medium", "high", null),
  updated_at: dateStringArb,
  user_id: fc.constant("test-user-id"),
})

/**
 * Generate a note with updated_at for ordering.
 */
const noteArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
  content: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  created_at: dateStringArb,
  updated_at: dateStringArb,
  tags: fc.array(fc.string({ minLength: 1, maxLength: 10 }), { maxLength: 3 }),
  linked_book_id: fc.constant(null),
  linked_contact_id: fc.constant(null),
  user_id: fc.constant("test-user-id"),
})

/**
 * Generate a contact with favorite=true and updated_at for ordering.
 */
const favoriteContactArb = fc.record({
  id: fc.uuid(),
  user_id: fc.constant("test-user-id"),
  name: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
  email: fc.option(fc.string({ minLength: 5, maxLength: 30 }), { nil: null }),
  phone: fc.option(fc.string({ maxLength: 15 }), { nil: null }),
  company: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
  role: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
  notes: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
  favorite: fc.constant(true),
  created_at: dateStringArb,
  updated_at: dateStringArb,
})

describe("Feature: dashboard-reading-now-fix, Property 2: Preservation — Non-Books Dashboard Queries Unchanged", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset mock state
    mockState = {
      focusTasks: [],
      readingBooks: [],
      favoriteContacts: [],
      pinnedNotes: [],
      recentNotes: [],
      openTasksCount: 0,
      notesCount: 0,
      readingCount: 0,
      contactsCount: 0,
    }
  })

  it("for all generated tasks, getTodayData() returns focus tasks ordered by due_date ascending", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(taskArb, { minLength: 1, maxLength: 8 }),
        async (tasks) => {
          // Sort tasks by due_date ascending (simulating what Supabase would return)
          const sortedTasks = [...tasks].sort((a, b) => {
            if (a.due_date === null && b.due_date === null) return 0
            if (a.due_date === null) return 1
            if (b.due_date === null) return -1
            return a.due_date.localeCompare(b.due_date)
          })

          // Set mock state — Supabase returns tasks already sorted
          mockState.focusTasks = sortedTasks
          mockState.openTasksCount = tasks.length
          mockState.recentNotes = []
          mockState.readingBooks = []
          mockState.favoriteContacts = []
          mockState.notesCount = 0
          mockState.readingCount = 0
          mockState.contactsCount = 0

          const result = await getTodayData()
          expect(result).not.toBeNull()

          // Focus tasks should be returned in due_date ascending order
          const focusTasks = result!.focusTasks
          expect(focusTasks.length).toBeGreaterThan(0)
          expect(focusTasks.length).toBeLessThanOrEqual(8)

          // Verify ordering is preserved (due_date ascending)
          for (let i = 1; i < focusTasks.length; i++) {
            const prev = focusTasks[i - 1].due_date
            const curr = focusTasks[i].due_date
            if (prev !== null && curr !== null) {
              expect(prev <= curr).toBe(true)
            }
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it("for all generated notes, getTodayData() returns pinned/recent notes correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(noteArb, { minLength: 1, maxLength: 6 }),
        async (notes) => {
          // Sort notes by updated_at descending (simulating Supabase behavior)
          const sortedNotes = [...notes].sort((a, b) => b.updated_at.localeCompare(a.updated_at))
          const limitedNotes = sortedNotes.slice(0, 6)

          // Set mock state — with no pinned IDs, it falls back to recent notes
          mockState.recentNotes = limitedNotes
          mockState.notesCount = notes.length
          mockState.focusTasks = []
          mockState.readingBooks = []
          mockState.favoriteContacts = []
          mockState.openTasksCount = 0
          mockState.readingCount = 0
          mockState.contactsCount = 0

          const result = await getTodayData()
          expect(result).not.toBeNull()

          // pinnedNotes falls back to recent notes when no pinned IDs
          const pinnedNotes = result!.pinnedNotes
          expect(pinnedNotes.length).toBeLessThanOrEqual(6)
          expect(pinnedNotes.length).toBe(limitedNotes.length)

          // Verify ordering is preserved (updated_at descending)
          for (let i = 1; i < pinnedNotes.length; i++) {
            const prev = pinnedNotes[i - 1].updated_at
            const curr = pinnedNotes[i].updated_at
            expect(prev >= curr).toBe(true)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it("for all generated contacts, getTodayData() returns favorite contacts ordered by updated_at descending", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(favoriteContactArb, { minLength: 1, maxLength: 4 }),
        async (contacts) => {
          // Sort contacts by updated_at descending (simulating Supabase behavior)
          const sortedContacts = [...contacts].sort((a, b) => b.updated_at.localeCompare(a.updated_at))
          const limitedContacts = sortedContacts.slice(0, 4)

          // Set mock state
          mockState.favoriteContacts = limitedContacts
          mockState.contactsCount = contacts.length
          mockState.focusTasks = []
          mockState.readingBooks = []
          mockState.recentNotes = []
          mockState.pinnedNotes = []
          mockState.openTasksCount = 0
          mockState.notesCount = 0
          mockState.readingCount = 0

          const result = await getTodayData()
          expect(result).not.toBeNull()

          const favoriteContacts = result!.favoriteContacts
          expect(favoriteContacts.length).toBeGreaterThan(0)
          expect(favoriteContacts.length).toBeLessThanOrEqual(4)

          // Verify ordering is preserved (updated_at descending)
          for (let i = 1; i < favoriteContacts.length; i++) {
            const prev = favoriteContacts[i - 1].updated_at
            const curr = favoriteContacts[i].updated_at
            expect(prev >= curr).toBe(true)
          }
        }
      ),
      { numRuns: 50 }
    )
  })

  it("count queries return correct values for open tasks, notes, and contacts regardless of books query state", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.nat({ max: 100 }),
        fc.nat({ max: 100 }),
        fc.nat({ max: 100 }),
        async (openTasksCount, notesCount, contactsCount) => {
          // Set mock state with arbitrary counts
          mockState.openTasksCount = openTasksCount
          mockState.notesCount = notesCount
          mockState.contactsCount = contactsCount
          mockState.readingCount = 0
          mockState.focusTasks = []
          mockState.readingBooks = []
          mockState.favoriteContacts = []
          mockState.recentNotes = []
          mockState.pinnedNotes = []

          const result = await getTodayData()
          expect(result).not.toBeNull()

          // Count queries should return the correct values
          expect(result!.counts.openTasks).toBe(openTasksCount)
          expect(result!.counts.notes).toBe(notesCount)
          expect(result!.counts.contacts).toBe(contactsCount)
        }
      ),
      { numRuns: 50 }
    )
  })
})
