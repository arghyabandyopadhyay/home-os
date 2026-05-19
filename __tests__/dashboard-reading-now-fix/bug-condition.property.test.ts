// Feature: dashboard-reading-now-fix
// Property 1: Bug Condition - Reading Books Query Uses Non-Existent Column
//
// The getTodayData() function in lib/dashboard.ts queries the books table with
// .order("updated_at", { ascending: false }), but the books table only has created_at.
// This causes Supabase to return empty results silently.
//
// This test asserts the EXPECTED behavior: books with status "reading" should be
// returned ordered by created_at descending. On unfixed code, this test FAILS
// because the query uses "updated_at" which doesn't exist on the books table.
//
// **Validates: Requirements 1.1, 2.1**

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as fc from "fast-check";

// Track all query builder calls to inspect what columns are used
let orderCalls: Array<{ table: string; column: string; options: unknown }> = [];

// Store mock data that will be returned by the query builder
let mockBooksData: unknown[] = [];

// Create a chainable query builder mock that tracks calls
// Each builder captures its own local state to avoid shared mutable state issues
// when getTodayData() runs multiple queries concurrently via Promise.all
function createQueryBuilder(table: string) {
  // Local state for THIS builder instance — not shared across concurrent queries
  const localFilters: Array<{ method: string; args: unknown[] }> = [];

  const builder: Record<string, unknown> = {};

  const chainMethods = [
    "select",
    "eq",
    "not",
    "lte",
    "gte",
    "in",
    "is",
    "limit",
    "single",
  ];

  for (const method of chainMethods) {
    builder[method] = vi.fn((...args: unknown[]) => {
      localFilters.push({ method, args });
      return builder;
    });
  }

  builder.order = vi.fn((column: string, options?: unknown) => {
    orderCalls.push({ table, column, options });
    return builder;
  });

  // When the chain resolves (via await), return appropriate data
  builder.then = (resolve: (value: unknown) => void) => {
    if (table === "books") {
      // Check if this is a count query (head: true)
      const isCountQuery = localFilters.some(
        (f) =>
          f.method === "select" &&
          f.args.length >= 2 &&
          typeof f.args[1] === "object" &&
          f.args[1] !== null &&
          (f.args[1] as Record<string, unknown>).head === true
      );

      if (isCountQuery) {
        resolve({ data: null, count: mockBooksData.length, error: null });
      } else {
        // For the actual books query, check if order was called with "created_at"
        // If the code uses "updated_at" (the bug), Supabase returns empty results
        const booksOrderCall = orderCalls.find((c) => c.table === "books");
        if (booksOrderCall && booksOrderCall.column === "updated_at") {
          // Simulate Supabase behavior: ordering by non-existent column returns empty
          resolve({ data: [], error: null });
        } else {
          // Correct column: return the mock data sorted by created_at desc
          const sorted = [...mockBooksData].sort(
            (a: unknown, b: unknown) =>
              new Date((b as { created_at: string }).created_at).getTime() -
              new Date((a as { created_at: string }).created_at).getTime()
          );
          const limitFilter = localFilters.find(
            (f) => f.method === "limit"
          );
          const limit = limitFilter
            ? (limitFilter.args[0] as number)
            : sorted.length;
          resolve({ data: sorted.slice(0, limit), error: null });
        }
      }
    } else if (table === "tasks") {
      const isCountQuery = localFilters.some(
        (f) =>
          f.method === "select" &&
          f.args.length >= 2 &&
          typeof f.args[1] === "object" &&
          f.args[1] !== null &&
          (f.args[1] as Record<string, unknown>).head === true
      );
      resolve(
        isCountQuery
          ? { data: null, count: 0, error: null }
          : { data: [], error: null }
      );
    } else if (table === "contacts") {
      const isCountQuery = localFilters.some(
        (f) =>
          f.method === "select" &&
          f.args.length >= 2 &&
          typeof f.args[1] === "object" &&
          f.args[1] !== null &&
          (f.args[1] as Record<string, unknown>).head === true
      );
      resolve(
        isCountQuery
          ? { data: null, count: 0, error: null }
          : { data: [], error: null }
      );
    } else if (table === "notes") {
      const isCountQuery = localFilters.some(
        (f) =>
          f.method === "select" &&
          f.args.length >= 2 &&
          typeof f.args[1] === "object" &&
          f.args[1] !== null &&
          (f.args[1] as Record<string, unknown>).head === true
      );
      resolve(
        isCountQuery
          ? { data: null, count: 0, error: null }
          : { data: [], error: null }
      );
    } else if (table === "profiles") {
      resolve({
        data: { preferences: { pinnedNoteIds: [] } },
        error: null,
      });
    } else {
      resolve({ data: [], error: null });
    }
    return undefined;
  };

  return builder;
}

// Mock the Supabase server client
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: {
          user: {
            id: "test-user-id",
            email: "test@example.com",
            user_metadata: { full_name: "Test User" },
          },
        },
        error: null,
      }),
    },
    from: vi.fn((table: string) => createQueryBuilder(table)),
  })),
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    getAll: () => [],
    set: vi.fn(),
  })),
}));

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
});

describe("Feature: dashboard-reading-now-fix, Property 1: Bug Condition - Reading Books Query Uses Non-Existent Column", () => {
  beforeEach(() => {
    orderCalls = [];
    mockBooksData = [];
  });

  it("getTodayData() should return reading books ordered by created_at (not updated_at)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(readingBookArb, { minLength: 1, maxLength: 5 }),
        async (books) => {
          // Reset state for each property run
          orderCalls = [];
          mockBooksData = books;

          // Import fresh for each run
          const { getTodayData } = await import("@/lib/dashboard");

          const result = await getTodayData();

          // The function should return non-null result
          expect(result).not.toBeNull();

          // Find the order call made on the books table
          const booksOrderCall = orderCalls.find((c) => c.table === "books");

          // CRITICAL ASSERTION: The books query must use "created_at" for ordering
          // On unfixed code, this will be "updated_at" which is the bug
          expect(booksOrderCall).toBeDefined();
          expect(booksOrderCall!.column).toBe("created_at");
        }
      ),
      { numRuns: 20 }
    );
  });

  it("getTodayData() should return up to 3 books with status 'reading' when they exist", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(readingBookArb, { minLength: 1, maxLength: 5 }),
        async (books) => {
          // Reset state for each property run
          orderCalls = [];
          mockBooksData = books;

          const { getTodayData } = await import("@/lib/dashboard");

          const result = await getTodayData();

          expect(result).not.toBeNull();

          // The readingBooks should contain up to 3 books (limit)
          const expectedCount = Math.min(3, books.length);
          expect(result!.readingBooks.length).toBe(expectedCount);

          // Books should be ordered by created_at descending
          for (let i = 1; i < result!.readingBooks.length; i++) {
            const prev = new Date(
              result!.readingBooks[i - 1].created_at
            ).getTime();
            const curr = new Date(result!.readingBooks[i].created_at).getTime();
            expect(prev).toBeGreaterThanOrEqual(curr);
          }
        }
      ),
      { numRuns: 20 }
    );
  });
});
