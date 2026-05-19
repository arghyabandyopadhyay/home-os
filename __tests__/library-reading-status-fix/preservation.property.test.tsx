// Feature: library-reading-status-fix
// Property 2: Preservation — Non-Reading Book Rendering Unchanged
//
// **Validates: Requirements 3.1, 3.2, 3.3, 3.4**
//
// This test observes and asserts that books with status "to_read" or "finished"
// render with the full BookCard component including progress slider, preview link
// (when preview_url is set), and reader link (when file_path is set).
// These tests MUST PASS on unfixed code — they capture baseline behavior to preserve.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import * as fc from "fast-check"
import React from "react"

// Mock next/image to render a simple img element
vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: { src: string; alt: string; [key: string]: unknown }) =>
    React.createElement("img", { src, alt, ...props }),
}))

// Mock next/link to render a plain anchor
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("a", { href, ...props }, children),
}))

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}))

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "test-user" } }, error: null }),
    },
    from: () => ({
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
      }),
    },
  }),
}))

import { LibraryView } from "@/components/library/library-view"
import { Book } from "@/types/book"

/**
 * Arbitrary generator for a non-empty string (used for preview_url and file_path)
 */
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0)

/**
 * Arbitrary generator for a book with a given status.
 * Generates books with varying optional fields to test property across many inputs.
 */
function bookArb(status: "to_read" | "finished"): fc.Arbitrary<Book> {
  return fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
    author: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
    cover_url: fc.option(fc.constant("https://covers.openlibrary.org/b/id/123-M.jpg"), { nil: null }),
    status: fc.constant(status),
    rating: fc.integer({ min: 0, max: 5 }),
    notes: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
    progress: fc.integer({ min: 0, max: 100 }),
    isbn: fc.option(fc.string({ maxLength: 13 }), { nil: null }),
    published_year: fc.option(fc.string({ maxLength: 4 }), { nil: null }),
    description: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
    created_at: fc.constant("2024-01-01T00:00:00.000Z"),
    source: fc.option(fc.constant("google_books"), { nil: null }),
    external_id: fc.option(fc.string({ maxLength: 20 }), { nil: null }),
    preview_url: fc.option(nonEmptyStringArb, { nil: null }),
    info_url: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
    epub_url: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
    pdf_url: fc.option(fc.string({ maxLength: 50 }), { nil: null }),
    file_path: fc.option(nonEmptyStringArb, { nil: null }),
    file_type: fc.option(fc.constantFrom("epub", "pdf"), { nil: null }),
  })
}

describe("Feature: library-reading-status-fix, Property 2: Preservation — Non-Reading Book Rendering Unchanged", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("for all books with status 'to_read': progress slider (input type=range) exists", () => {
    fc.assert(
      fc.property(
        bookArb("to_read"),
        (book) => {
          const { unmount, container } = render(<LibraryView books={[book]} />)

          // BookCard renders an <input type="range"> for progress
          const rangeInput = container.querySelector('input[type="range"]')
          expect(rangeInput).not.toBeNull()

          unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  it("for all books with status 'to_read': 'Read Preview' link exists when preview_url is non-empty", () => {
    fc.assert(
      fc.property(
        bookArb("to_read").filter((b) => b.preview_url !== null && b.preview_url.length > 0),
        (book) => {
          const { unmount } = render(<LibraryView books={[book]} />)

          const previewLink = screen.getByText("Read Preview")
          expect(previewLink).toBeDefined()
          expect(previewLink.tagName.toLowerCase()).toBe("a")
          expect(previewLink.getAttribute("href")).toBe(book.preview_url)

          unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  it("for all books with status 'to_read': 'Open Reader' link exists when file_path is non-empty", () => {
    fc.assert(
      fc.property(
        bookArb("to_read").filter((b) => b.file_path !== null && b.file_path.length > 0),
        (book) => {
          const { unmount } = render(<LibraryView books={[book]} />)

          const readerLink = screen.getByText("Open Reader")
          expect(readerLink).toBeDefined()
          expect(readerLink.tagName.toLowerCase()).toBe("a")
          expect(readerLink.getAttribute("href")).toBe(`/reader/${book.id}`)

          unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  it("for all books with status 'finished': progress slider (input type=range) exists", () => {
    fc.assert(
      fc.property(
        bookArb("finished"),
        (book) => {
          const { unmount, container } = render(<LibraryView books={[book]} />)

          // BookCard renders an <input type="range"> for progress
          const rangeInput = container.querySelector('input[type="range"]')
          expect(rangeInput).not.toBeNull()

          unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  it("for all books with status 'finished': 'Read Preview' link exists when preview_url is non-empty", () => {
    fc.assert(
      fc.property(
        bookArb("finished").filter((b) => b.preview_url !== null && b.preview_url.length > 0),
        (book) => {
          const { unmount } = render(<LibraryView books={[book]} />)

          const previewLink = screen.getByText("Read Preview")
          expect(previewLink).toBeDefined()
          expect(previewLink.tagName.toLowerCase()).toBe("a")
          expect(previewLink.getAttribute("href")).toBe(book.preview_url)

          unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  it("for all books with status 'finished': 'Open Reader' link exists when file_path is non-empty", () => {
    fc.assert(
      fc.property(
        bookArb("finished").filter((b) => b.file_path !== null && b.file_path.length > 0),
        (book) => {
          const { unmount } = render(<LibraryView books={[book]} />)

          const readerLink = screen.getByText("Open Reader")
          expect(readerLink).toBeDefined()
          expect(readerLink.tagName.toLowerCase()).toBe("a")
          expect(readerLink.getAttribute("href")).toBe(`/reader/${book.id}`)

          unmount()
        }
      ),
      { numRuns: 50 }
    )
  })

  it("for all books with status !== 'reading': grid layout is used for the section container", () => {
    fc.assert(
      fc.property(
        fc.oneof(bookArb("to_read"), bookArb("finished")),
        (book) => {
          const { unmount, container } = render(<LibraryView books={[book]} />)

          // The section container for "To Read" and "Finished" uses grid layout
          const gridContainer = container.querySelector(".grid.gap-6.sm\\:grid-cols-2.lg\\:grid-cols-3")
          expect(gridContainer).not.toBeNull()

          unmount()
        }
      ),
      { numRuns: 50 }
    )
  })
})
