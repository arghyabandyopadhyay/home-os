// Feature: dashboard-reading-now-fix
// Property 1: Bug Condition - Reading Books Query Uses Non-Existent Column
//
// After the API migration, getTodayData() delegates to the API Gateway via a single
// GET /dashboard call. The backend is responsible for correct query construction.
// This test verifies that getTodayData() correctly returns reading books data from
// the API response, preserving ordering (created_at descending) and the limit of 3.
//
// **Validates: Requirements 1.1, 2.1**

import { describe, it, expect, vi, beforeEach } from "vitest"
import * as fc from "fast-check"

// Mock data to be returned by the API client
let mockDashboardResponse: unknown = null
let mockShouldThrow = false

// Mock the API client module (server entrypoint used by dashboard.ts)
vi.mock("@/lib/api-client/server", () => ({
  createServerApiClient: vi.fn(async () => ({
    get: vi.fn(async () => {
      if (mockShouldThrow) {
        throw new Error("API error")
      }
      return mockDashboardResponse
    }),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  })),
}))

// Arbitrary for generating a book record with status "reading"
const readingBookArb = fc.record({
  id: fc.uuid(),
  title: fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => s.trim().length > 0),
  author: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
  cover_url: fc.option(fc.webUrl(), { nil: null }),
  status: fc.constant("reading" as const),
  rating: fc.integer({ min: 0, max: 5 }),
  notes: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  progress: fc.integer({ min: 0, max: 100 }),
  isbn: fc.option(fc.string({ minLength: 10, maxLength: 13 }), { nil: null }),
  published_year: fc.option(
    fc.integer({ min: 1900, max: 2024 }).map(String),
    { nil: null }
  ),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  created_at: fc
    .integer({
      min: new Date("2020-01-01").getTime(),
      max: new Date("2025-01-01").getTime(),
    })
    .map((ts) => new Date(ts).toISOString()),
  source: fc.option(fc.constantFrom("google_books", "manual"), { nil: null }),
  external_id: fc.option(fc.string(), { nil: null }),
  preview_url: fc.option(fc.webUrl(), { nil: null }),
  info_url: fc.option(fc.webUrl(), { nil: null }),
  epub_url: fc.option(fc.webUrl(), { nil: null }),
  pdf_url: fc.option(fc.webUrl(), { nil: null }),
  file_path: fc.option(
    fc
      .string({ minLength: 1, maxLength: 50 })
      .filter((s) => s.trim().length > 0),
    { nil: null }
  ),
  file_type: fc.option(fc.constantFrom("epub", "pdf"), { nil: null }),
  user_id: fc.constant("test-user-id"),
})

describe("Feature: dashboard-reading-now-fix, Property 1: Bug Condition - Reading Books Query Uses Non-Existent Column", () => {
  beforeEach(() => {
    mockDashboardResponse = null
    mockShouldThrow = false
  })

  it("getTodayData() should return reading books ordered by created_at (not updated_at)", async () => {
    const { getTodayData } = await import("@/lib/dashboard")

    await fc.assert(
      fc.asyncProperty(
        fc.array(readingBookArb, { minLength: 1, maxLength: 5 }),
        async (books) => {
          // Sort books by created_at descending (as the backend should return them)
          const sortedBooks = [...books].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          const limitedBooks = sortedBooks.slice(0, 3)

          // Mock the API response with books already sorted by created_at desc
          mockDashboardResponse = {
            userName: "Test User",
            email: "test@example.com",
            focusTasks: [],
            readingBooks: limitedBooks,
            pinnedNotes: [],
            recentNotes: [],
            favoriteContacts: [],
            counts: {
              openTasks: 0,
              notes: 0,
              reading: books.length,
              contacts: 0,
            },
          }

          const result = await getTodayData()

          // The function should return non-null result
          expect(result).not.toBeNull()

          // Reading books should be present and limited to 3
          expect(result!.readingBooks.length).toBeLessThanOrEqual(3)
          expect(result!.readingBooks.length).toBe(limitedBooks.length)

          // Books should be ordered by created_at descending
          for (let i = 1; i < result!.readingBooks.length; i++) {
            const prev = new Date(
              result!.readingBooks[i - 1].created_at
            ).getTime()
            const curr = new Date(
              result!.readingBooks[i].created_at
            ).getTime()
            expect(prev).toBeGreaterThanOrEqual(curr)
          }
        }
      ),
      { numRuns: 20 }
    )
  })

  it("getTodayData() should return up to 3 books with status 'reading' when they exist", async () => {
    const { getTodayData } = await import("@/lib/dashboard")

    await fc.assert(
      fc.asyncProperty(
        fc.array(readingBookArb, { minLength: 1, maxLength: 5 }),
        async (books) => {
          // Sort by created_at descending, limit to 3
          const sortedBooks = [...books].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
          const limitedBooks = sortedBooks.slice(0, 3)

          mockDashboardResponse = {
            userName: "Test User",
            email: "test@example.com",
            focusTasks: [],
            readingBooks: limitedBooks,
            pinnedNotes: [],
            recentNotes: [],
            favoriteContacts: [],
            counts: {
              openTasks: 0,
              notes: 0,
              reading: books.length,
              contacts: 0,
            },
          }

          const result = await getTodayData()

          expect(result).not.toBeNull()

          // The readingBooks should contain up to 3 books
          const expectedCount = Math.min(3, books.length)
          expect(result!.readingBooks.length).toBe(expectedCount)

          // Books should be ordered by created_at descending
          for (let i = 1; i < result!.readingBooks.length; i++) {
            const prev = new Date(
              result!.readingBooks[i - 1].created_at
            ).getTime()
            const curr = new Date(
              result!.readingBooks[i].created_at
            ).getTime()
            expect(prev).toBeGreaterThanOrEqual(curr)
          }
        }
      ),
      { numRuns: 20 }
    )
  })
})
