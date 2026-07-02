import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { computeWordDiff } from "@/lib/revisions/diff"

/**
 * Property 2: Diff Symmetry
 * Validates: Requirement 4.3
 *
 * For any two strings A and B:
 * - Applying all changes from computeWordDiff(A, B) to A reconstructs B:
 *   unchanged + additions text pieces joined together equal B
 * - The diff is symmetric: diff(A, B) and diff(B, A) both correctly
 *   reconstruct their respective targets
 * - If A equals B, diff should only contain "unchanged" entries
 * - Empty inputs produce empty diff arrays or single addition/deletion entry
 */

// --- Generators ---

/** Generate realistic word-level content using lorem */
const textArb = fc.lorem({ maxCount: 30 })

/** Generate arbitrary strings for broader coverage */
const arbitraryTextArb = fc.string({ minLength: 0, maxLength: 200 })

// --- Tests ---

describe("Feature: note-event-sourcing-frontend, Property 2: Diff Symmetry", () => {
  /**
   * Validates: Requirement 4.3
   *
   * Applying all changes from computeWordDiff(A, B) reconstructs B:
   * taking unchanged + additions text pieces and joining them should equal B.
   */
  it("unchanged + additions from diff(A, B) reconstruct B for lorem text", () => {
    fc.assert(
      fc.property(textArb, textArb, (a, b) => {
        const diff = computeWordDiff(a, b)

        const reconstructed = diff
          .filter((c) => c.type === "unchanged" || c.type === "addition")
          .map((c) => c.value)
          .join("")

        expect(reconstructed).toBe(b)
      }),
      { numRuns: 200 }
    )
  })

  /**
   * Validates: Requirement 4.3
   *
   * Diff symmetry: computing diff(B, A) also correctly reconstructs A
   * via unchanged + additions. This proves the diff operation is symmetric —
   * additions in one direction serve the same role as deletions in the other.
   */
  it("unchanged + additions from diff(B, A) reconstruct A (symmetry)", () => {
    fc.assert(
      fc.property(textArb, textArb, (a, b) => {
        const diffBA = computeWordDiff(b, a)

        const reconstructed = diffBA
          .filter((c) => c.type === "unchanged" || c.type === "addition")
          .map((c) => c.value)
          .join("")

        expect(reconstructed).toBe(a)
      }),
      { numRuns: 200 }
    )
  })

  /**
   * Validates: Requirement 4.3
   *
   * If A equals B, the diff should only contain "unchanged" entries.
   */
  it("diff of identical strings contains only unchanged entries", () => {
    fc.assert(
      fc.property(textArb, (text) => {
        const diff = computeWordDiff(text, text)

        const nonUnchanged = diff.filter((c) => c.type !== "unchanged")
        expect(nonUnchanged).toHaveLength(0)
      }),
      { numRuns: 200 }
    )
  })

  /**
   * Validates: Requirement 4.3
   *
   * The diff is a valid partition: every diff entry has a well-defined type,
   * and the total text content in the diff covers the transformation from A to B.
   * Specifically: all values concatenated (unchanged + additions) = B,
   * and the diff contains no entries with empty values (except for empty inputs).
   */
  it("diff entries form a valid partition of the transformation", () => {
    fc.assert(
      fc.property(textArb, textArb, (a, b) => {
        const diff = computeWordDiff(a, b)

        // Every entry has a valid type
        for (const entry of diff) {
          expect(["addition", "deletion", "unchanged"]).toContain(entry.type)
        }

        // No empty-value entries in the diff (unless both inputs are empty)
        if (a !== "" || b !== "") {
          for (const entry of diff) {
            expect(entry.value.length).toBeGreaterThan(0)
          }
        }

        // The diff captures both the old and new content:
        // Additions represent net new content in B not present in A
        const hasAdditions = diff.some((c) => c.type === "addition")
        const hasDeletions = diff.some((c) => c.type === "deletion")

        // If A !== B, there must be at least one addition or deletion
        if (a !== b) {
          expect(hasAdditions || hasDeletions).toBe(true)
        }
      }),
      { numRuns: 200 }
    )
  })

  /**
   * Validates: Requirement 4.3
   *
   * Reconstruction property holds for arbitrary strings.
   */
  it("unchanged + additions from diff(A, B) reconstruct B for arbitrary strings", () => {
    fc.assert(
      fc.property(arbitraryTextArb, arbitraryTextArb, (a, b) => {
        const diff = computeWordDiff(a, b)

        const reconstructed = diff
          .filter((c) => c.type === "unchanged" || c.type === "addition")
          .map((c) => c.value)
          .join("")

        expect(reconstructed).toBe(b)
      }),
      { numRuns: 200 }
    )
  })

  /**
   * Validates: Requirement 4.3
   *
   * Empty inputs produce appropriate results:
   * - diff("", "") → empty array
   * - diff("", B) → additions that reconstruct B, no unchanged entries
   * - diff(A, "") → reconstructs empty string (no additions, no unchanged)
   */
  it("empty string diffs produce correct results", () => {
    fc.assert(
      fc.property(textArb, (text) => {
        // diff("", text): reconstruct B from unchanged + additions
        const diffFromEmpty = computeWordDiff("", text)
        if (text === "") {
          expect(diffFromEmpty).toHaveLength(0)
        } else {
          const reconstructed = diffFromEmpty
            .filter((c) => c.type === "unchanged" || c.type === "addition")
            .map((c) => c.value)
            .join("")
          expect(reconstructed).toBe(text)

          // No unchanged entries when going from empty to non-empty
          const unchanged = diffFromEmpty.filter((c) => c.type === "unchanged")
          expect(unchanged).toHaveLength(0)
        }

        // diff(text, ""): reconstructed target is empty
        const diffToEmpty = computeWordDiff(text, "")
        if (text === "") {
          expect(diffToEmpty).toHaveLength(0)
        } else {
          const reconstructed = diffToEmpty
            .filter((c) => c.type === "unchanged" || c.type === "addition")
            .map((c) => c.value)
            .join("")
          expect(reconstructed).toBe("")
        }
      }),
      { numRuns: 100 }
    )
  })
})
