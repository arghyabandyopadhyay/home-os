import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { migrateContent } from "@/lib/collaboration/content-migration"

/**
 * Property: Content Serialization Round-Trip
 * Validates: Requirements 7.4, 7.5
 *
 * - For any plain text string, `migrateContent(text)` produces valid ProseMirror JSON
 * - For any valid ProseMirror JSON string, `migrateContent(json)` returns it unchanged
 * - Null and empty string inputs produce a valid empty document
 */

// --- Generators ---

/** Generate arbitrary plain text strings that are NOT valid ProseMirror JSON with type: "doc" */
const plainTextArb = fc
  .string({ minLength: 1, maxLength: 500 })
  .filter((s) => {
    if (s.trim() === "") return false
    try {
      const parsed = JSON.parse(s)
      return !(parsed && typeof parsed === "object" && parsed.type === "doc")
    } catch {
      return true
    }
  })

/** Generate valid ProseMirror JSON document structures */
const proseMirrorDocArb = fc
  .array(
    fc.oneof(
      // Paragraph with text
      fc.string({ minLength: 0, maxLength: 100 }).map((text) =>
        text.length > 0
          ? { type: "paragraph", content: [{ type: "text", text }] }
          : { type: "paragraph" }
      ),
      // Heading with text
      fc.tuple(fc.integer({ min: 1, max: 3 }), fc.string({ minLength: 1, maxLength: 50 })).map(
        ([level, text]) => ({
          type: "heading",
          attrs: { level },
          content: [{ type: "text", text }],
        })
      ),
      // Empty paragraph
      fc.constant({ type: "paragraph" })
    ),
    { minLength: 1, maxLength: 10 }
  )
  .map((content) => ({ type: "doc", content }))

// --- Tests ---

describe("Feature: realtime-collaboration-frontend, Property: Content Serialization Round-Trip", () => {
  /**
   * Validates: Requirements 7.4, 7.5
   */
  it("plain text produces a valid ProseMirror document with type 'doc' and content array", () => {
    fc.assert(
      fc.property(plainTextArb, (text) => {
        const result = migrateContent(text)
        expect(result).toHaveProperty("type", "doc")
        expect(result).toHaveProperty("content")
        expect(Array.isArray((result as { content: unknown[] }).content)).toBe(true)
        expect((result as { content: unknown[] }).content.length).toBeGreaterThan(0)
      }),
      { numRuns: 200 }
    )
  })

  /**
   * Validates: Requirements 7.4, 7.5
   */
  it("valid ProseMirror JSON is returned unchanged (idempotent)", () => {
    fc.assert(
      fc.property(proseMirrorDocArb, (doc) => {
        const jsonStr = JSON.stringify(doc)
        const result = migrateContent(jsonStr)
        expect(result).toEqual(doc)
      }),
      { numRuns: 200 }
    )
  })

  /**
   * Validates: Requirements 7.4, 7.5
   */
  it("null and empty string inputs produce a valid empty document", () => {
    const emptyDoc = { type: "doc", content: [{ type: "paragraph" }] }

    expect(migrateContent(null)).toEqual(emptyDoc)
    expect(migrateContent("")).toEqual(emptyDoc)
    expect(migrateContent("  ")).toEqual(emptyDoc)
    expect(migrateContent("\t")).toEqual(emptyDoc)
    expect(migrateContent("\n")).toEqual(emptyDoc)
  })

  /**
   * Validates: Requirements 7.4, 7.5
   */
  it("output always has type 'doc' for any string input", () => {
    fc.assert(
      fc.property(fc.string({ maxLength: 500 }), (input) => {
        const result = migrateContent(input)
        expect(result).toHaveProperty("type", "doc")
      }),
      { numRuns: 200 }
    )
  })

  /**
   * Validates: Requirements 7.4, 7.5
   */
  it("text content is preserved for non-JSON strings", () => {
    fc.assert(
      fc.property(plainTextArb, (text) => {
        const result = migrateContent(text) as {
          content: Array<{ content?: Array<{ text?: string }> }>
        }
        expect(result.content[0].content?.[0].text).toBe(text)
      }),
      { numRuns: 200 }
    )
  })
})
