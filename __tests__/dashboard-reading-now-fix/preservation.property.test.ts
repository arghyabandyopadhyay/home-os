// Feature: dashboard-reading-now-fix
// Property 2: Preservation — Non-Books Dashboard Queries Unchanged
//
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
//
// After the API migration, getTodayData() calls GET /dashboard and returns
// the response directly. This test verifies that the function correctly passes
// through focus tasks, pinned/recent notes, favorite contacts, and counts
// from the API response without modification.

import { describe, it, expect, vi, beforeEach } from "vitest"
import * as fc from "fast-check"

// Mock data to be returned by the API client
let mockDashboardResponse: unknown = null

// Mock the API client module (server entrypoint used by dashboard.ts)
vi.mock("@/lib/api-client/server", () => ({
  createServerApiClient: vi.fn(async () => ({
    get: vi.fn(async () => {
      return mockDashboardResponse
    }),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Import after mocks
import { getTodayData } from "@/lib/dashboard"

// --- Arbitrary generators ---

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
    mockDashboardResponse = null
  })

  it("for all generated tasks, getTodayData() returns focus tasks ordered by due_date ascending", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(taskArb, { minLength: 1, maxLength: 8 }),
        async (tasks) => {
          // Sort tasks by due_date ascending (as the backend should return them)
          const sortedTasks = [...tasks].sort((a, b) => {
            if (a.due_date === null && b.due_date === null) return 0
            if (a.due_date === null) return 1
            if (b.due_date === null) return -1
            return a.due_date.localeCompare(b.due_date)
          })

          // Mock API response with tasks already sorted by the backend
          mockDashboardResponse = {
            userName: "Test User",
            email: "test@example.com",
            focusTasks: sortedTasks,
            readingBooks: [],
            pinnedNotes: [],
            recentNotes: [],
            favoriteContacts: [],
            counts: {
              openTasks: tasks.length,
              notes: 0,
              reading: 0,
              contacts: 0,
            },
          }

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
          // Sort notes by updated_at descending (as the backend should return them)
          const sortedNotes = [...notes].sort((a, b) =>
            b.updated_at.localeCompare(a.updated_at)
          )
          const limitedNotes = sortedNotes.slice(0, 6)

          // Mock API response
          mockDashboardResponse = {
            userName: "Test User",
            email: "test@example.com",
            focusTasks: [],
            readingBooks: [],
            pinnedNotes: limitedNotes,
            recentNotes: limitedNotes,
            favoriteContacts: [],
            counts: {
              openTasks: 0,
              notes: notes.length,
              reading: 0,
              contacts: 0,
            },
          }

          const result = await getTodayData()
          expect(result).not.toBeNull()

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
          // Sort contacts by updated_at descending (as the backend should return them)
          const sortedContacts = [...contacts].sort((a, b) =>
            b.updated_at.localeCompare(a.updated_at)
          )
          const limitedContacts = sortedContacts.slice(0, 4)

          // Mock API response
          mockDashboardResponse = {
            userName: "Test User",
            email: "test@example.com",
            focusTasks: [],
            readingBooks: [],
            pinnedNotes: [],
            recentNotes: [],
            favoriteContacts: limitedContacts,
            counts: {
              openTasks: 0,
              notes: 0,
              reading: 0,
              contacts: contacts.length,
            },
          }

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
          // Mock API response with arbitrary counts
          mockDashboardResponse = {
            userName: "Test User",
            email: "test@example.com",
            focusTasks: [],
            readingBooks: [],
            pinnedNotes: [],
            recentNotes: [],
            favoriteContacts: [],
            counts: {
              openTasks: openTasksCount,
              notes: notesCount,
              reading: 0,
              contacts: contactsCount,
            },
          }

          const result = await getTodayData()
          expect(result).not.toBeNull()

          // Count values should be passed through correctly from API response
          expect(result!.counts.openTasks).toBe(openTasksCount)
          expect(result!.counts.notes).toBe(notesCount)
          expect(result!.counts.contacts).toBe(contactsCount)
        }
      ),
      { numRuns: 50 }
    )
  })
})
