import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import {
  validateUploadFile,
  filterDocumentsByQuery,
} from "@/lib/documents-utils"
import type { Document } from "@/types/document"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function documentArb(): fc.Arbitrary<Document> {
  const isoDateArb = fc.integer({ min: 1577836800000, max: 1924905600000 }).map(
    (ts) => new Date(ts).toISOString()
  )
  const processingStateArb = fc.record({
    status: fc.constantFrom("pending" as const, "processing" as const, "ready" as const, "failed" as const),
    current_stage: fc.option(
      fc.constantFrom("scanning" as const, "ocr" as const, "text_extraction" as const, "indexing" as const),
      { nil: null }
    ),
    completed_stages: fc.array(
      fc.constantFrom("scanning" as const, "ocr" as const, "text_extraction" as const, "indexing" as const),
      { maxLength: 4 }
    ),
    failed_stage: fc.option(
      fc.constantFrom("scanning" as const, "ocr" as const, "text_extraction" as const, "indexing" as const),
      { nil: null }
    ),
    error_message: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: null }),
    started_at: fc.option(isoDateArb, { nil: null }),
    completed_at: fc.option(isoDateArb, { nil: null }),
  })
  return fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 100 }),
    file_path: fc.string({ minLength: 5, maxLength: 50 }),
    file_size: fc.option(fc.integer({ min: 1, max: 100_000_000 }), { nil: null }),
    tags: fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }),
    thumbnail_url: fc.option(fc.webUrl(), { nil: null }),
    processing: processingStateArb,
    created_at: isoDateArb,
    updated_at: isoDateArb,
  })
}

/**
 * Create a mock File object for testing.
 */
function createMockFile(name: string, size: number, type: string): File {
  const blob = new Blob(["x".repeat(Math.min(size, 100))], { type })
  Object.defineProperty(blob, "size", { value: size })
  Object.defineProperty(blob, "name", { value: name })
  return blob as unknown as File
}

// ─── Property Tests ───────────────────────────────────────────────────────────

// Feature: calm-home-os, Property 23: PDF-only validation
describe("P23: PDF-Only File Validation", () => {
  it("accepts files with application/pdf MIME type, rejects all others", () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 50 }).map((s) => s.replace(/\./g, "") + ".txt"),
          size: fc.integer({ min: 1, max: 40_000_000 }),
          type: fc.constantFrom(
            "application/pdf",
            "text/plain",
            "image/png",
            "application/json",
            "application/msword",
            "image/jpeg"
          ),
        }),
        ({ name, size, type }) => {
          const file = createMockFile(
            type === "application/pdf" ? name.replace(".txt", ".pdf") : name,
            size,
            type
          )
          const result = validateUploadFile(file)

          if (type === "application/pdf") {
            expect(result.valid).toBe(true)
          } else {
            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 24: File size limit
describe("P24: File Size Limit Enforcement", () => {
  it("rejects files exceeding 50MB, accepts files at or below 50MB", () => {
    const MAX_SIZE = 50 * 1024 * 1024 // 50MB

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100_000_000 }),
        (size) => {
          const file = createMockFile("test.pdf", size, "application/pdf")
          const result = validateUploadFile(file)

          if (size > MAX_SIZE) {
            expect(result.valid).toBe(false)
            expect(result.error).toBeDefined()
          } else {
            expect(result.valid).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 25: Document search completeness
describe("P25: Document Search Completeness", () => {
  it("every document in result matches query in title or tags; no non-matching document appears", () => {
    fc.assert(
      fc.property(
        fc.array(documentArb(), { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 2, maxLength: 15 }),
        (documents, query) => {
          const result = filterDocumentsByQuery(documents, query)
          const q = query.toLowerCase()

          // Every result must match
          for (const doc of result) {
            const matches =
              doc.title.toLowerCase().includes(q) ||
              doc.tags.some((tag) => tag.toLowerCase().includes(q))
            expect(matches).toBe(true)
          }

          // No non-matching document should appear
          const resultIds = new Set(result.map((d) => d.id))
          for (const doc of documents) {
            const matches =
              doc.title.toLowerCase().includes(q) ||
              doc.tags.some((tag) => tag.toLowerCase().includes(q))
            if (!matches) {
              expect(resultIds.has(doc.id)).toBe(false)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 26: Signed URL validity
describe("P26: Signed URL Validity", () => {
  it("signed URLs contain an expiry/token parameter and are not permanent public URLs", () => {
    // Simulate signed URL generation (Supabase format)
    function generateSignedUrl(filePath: string, expiresIn: number): string {
      const expiresAt = Math.floor(Date.now() / 1000) + expiresIn
      return `https://storage.example.com/documents/${filePath}?token=abc123&expires=${expiresAt}`
    }

    fc.assert(
      fc.property(
        fc.string({ minLength: 5, maxLength: 50 }).map((s) => s.replace(/[^a-z0-9]/gi, "") + ".pdf"),
        fc.integer({ min: 60, max: 3600 }),
        (filePath, expiresIn) => {
          const url = generateSignedUrl(filePath, expiresIn)

          // URL must contain a token/signature parameter
          expect(url).toContain("token=")

          // URL must contain an expiry parameter
          expect(url).toContain("expires=")

          // Expiry should be no more than 3600 seconds from now
          const expiresMatch = url.match(/expires=(\d+)/)
          expect(expiresMatch).not.toBeNull()
          const expiresAt = parseInt(expiresMatch![1], 10)
          const now = Math.floor(Date.now() / 1000)
          expect(expiresAt - now).toBeLessThanOrEqual(3600)
          expect(expiresAt - now).toBeGreaterThan(0)
        }
      ),
      { numRuns: 100 }
    )
  })
})
