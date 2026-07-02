import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { hashContent } from "@/lib/revisions/hash"

/**
 * Property 3: Content Hash Determinism
 *
 * For any content string, `hashContent(content)` always produces the same hash.
 * Two different content strings produce different hashes (collision resistance
 * for practical purposes). Hash output is always a 64-character hex string.
 *
 * **Validates: Requirement 6.2**
 */

describe("Feature: note-event-sourcing-frontend, Property 3: Hash Determinism", () => {
  it("hashContent is deterministic — same input always produces same output", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (content) => {
        const hash1 = await hashContent(content)
        const hash2 = await hashContent(content)
        expect(hash1).toBe(hash2)
      }),
      { numRuns: 100 }
    )
  })

  it("hash output is always a 64-character hex string", async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (content) => {
        const hash = await hashContent(content)
        expect(hash).toHaveLength(64)
        expect(hash).toMatch(/^[0-9a-f]{64}$/)
      }),
      { numRuns: 100 }
    )
  })

  it("two different non-empty strings produce different hashes (collision resistance)", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc
          .tuple(
            fc.string({ minLength: 1 }),
            fc.string({ minLength: 1 })
          )
          .filter(([a, b]) => a !== b),
        async ([contentA, contentB]) => {
          const hashA = await hashContent(contentA)
          const hashB = await hashContent(contentB)
          expect(hashA).not.toBe(hashB)
        }
      ),
      { numRuns: 100 }
    )
  })
})
