// Feature: library-reading-status-fix
// Property 1: Bug Condition - Reading Books Missing Interactive Controls
//
// For any book where status === "reading", the LibraryView component SHALL render
// that book with a progress range slider, a "Read Preview" link (when preview_url
// is non-empty), and an "Open Reader" link (when file_path is non-empty).
//
// **Validates: Requirements 1.1, 1.2, 1.3**

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import * as fc from "fast-check"

// Mock Supabase client
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
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
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "" } }),
      }),
    },
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
        error: null,
      }),
    },
  }),
}))

// Mock next/image
vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill, ...rest } = props
    return <img {...rest} data-fill={fill ? "true" : undefined} />
  },
}))

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

// Mock sonner
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock uuid
vi.mock("uuid", () => ({
  v4: () => "test-uuid-1234",
}))

// Mock react-textarea-autosize
vi.mock("react-textarea-autosize", () => ({
  default: (props: Record<string, unknown>) => <textarea {...props} />,
}))

import { LibraryView } from "@/components/library/library-view"
import { Book } from "@/types/book"

/** Arbitrary for generating a book with status "reading" and varying optional fields */
const readingBookArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
  author: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
  cover_url: fc.option(fc.webUrl(), { nil: null }),
  status: fc.constant("reading"),
  rating: fc.integer({ min: 0, max: 5 }),
  notes: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
  progress: fc.integer({ min: 0, max: 100 }),
  isbn: fc.option(fc.string({ minLength: 10, maxLength: 13 }), { nil: null }),
  published_year: fc.option(fc.integer({ min: 1900, max: 2024 }).map(String), { nil: null }),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: null }),
  created_at: fc.constant("2024-01-01T00:00:00Z"),
  source: fc.option(fc.constantFrom("google_books", "manual"), { nil: null }),
  external_id: fc.option(fc.string(), { nil: null }),
  preview_url: fc.oneof(fc.constant(null), fc.webUrl()),
  info_url: fc.option(fc.webUrl(), { nil: null }),
  epub_url: fc.option(fc.webUrl(), { nil: null }),
  pdf_url: fc.option(fc.webUrl(), { nil: null }),
  file_path: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0)),
  file_type: fc.option(fc.constantFrom("epub", "pdf"), { nil: null }),
})

describe("Feature: library-reading-status-fix, Property 1: Bug Condition - Reading Books Missing Interactive Controls", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("books with status 'reading' should have a progress range slider (input type='range')", () => {
    fc.assert(
      fc.property(readingBookArb, (book: Book) => {
        const { unmount, container } = render(<LibraryView books={[book]} />)

        // A progress range slider should exist for reading books
        const rangeInput = container.querySelector('input[type="range"]')
        expect(rangeInput).not.toBeNull()

        unmount()
      }),
      { numRuns: 50 }
    )
  })

  it("books with status 'reading' and non-empty preview_url should have a 'Read Preview' link", () => {
    // Generate books that always have a preview_url
    const readingBookWithPreviewArb = readingBookArb.map((book) => ({
      ...book,
      preview_url: "https://books.google.com/preview/" + book.id,
    }))

    fc.assert(
      fc.property(readingBookWithPreviewArb, (book: Book) => {
        const { unmount } = render(<LibraryView books={[book]} />)

        // A "Read Preview" link should exist when preview_url is set
        const previewLink = screen.queryByText("Read Preview")
        expect(previewLink).not.toBeNull()

        unmount()
      }),
      { numRuns: 50 }
    )
  })

  it("books with status 'reading' and non-empty file_path should have an 'Open Reader' link", () => {
    // Generate books that always have a file_path
    const readingBookWithFileArb = readingBookArb.map((book) => ({
      ...book,
      file_path: `user123/${book.id}.epub`,
    }))

    fc.assert(
      fc.property(readingBookWithFileArb, (book: Book) => {
        const { unmount } = render(<LibraryView books={[book]} />)

        // An "Open Reader" link should exist when file_path is set
        const readerLink = screen.queryByText("Open Reader")
        expect(readerLink).not.toBeNull()

        unmount()
      }),
      { numRuns: 50 }
    )
  })
})
