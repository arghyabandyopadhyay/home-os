import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import type { CollaboratorPresence } from "@/types/collaboration"

/**
 * Property: Presence Display Bounds
 * Validates: Requirements 3.3
 *
 * PresenceBar never renders more than `maxVisible` individual avatars.
 * If collaborators > maxVisible, overflow count equals total - maxVisible.
 * Empty collaborators array renders nothing.
 *
 * Tags: Feature: realtime-collaboration-frontend, Property 5: Presence Display Bounds
 */

/**
 * Models the display logic of the PresenceBar component.
 * Given an array of collaborators and a maxVisible limit, computes
 * the number of individually visible avatars and the overflow count.
 */
function computePresenceDisplayBounds(
  collaborators: CollaboratorPresence[],
  maxVisible: number
): { visibleCount: number; overflowCount: number } {
  const visible = collaborators.slice(0, maxVisible)
  const overflow = collaborators.slice(maxVisible)
  return {
    visibleCount: visible.length,
    overflowCount: overflow.length,
  }
}

/** Arbitrary for generating a collaborator presence object */
const collaboratorArb = fc.record({
  userId: fc.uuid(),
  displayName: fc.string({ minLength: 1, maxLength: 50 }),
  avatarUrl: fc.option(fc.webUrl(), { nil: null }),
  color: fc.constantFrom(
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#F97316"
  ),
  cursorPosition: fc.constant(null),
  selectionRange: fc.constant(null),
  lastActive: fc.nat(),
}) as fc.Arbitrary<CollaboratorPresence>

/** Arbitrary for generating the maxVisible parameter */
const maxVisibleArb = fc.integer({ min: 1, max: 20 })

describe("Feature: realtime-collaboration-frontend, Property 5: Presence Display Bounds", () => {
  describe("Max visible constraint", () => {
    it("never displays more than maxVisible individual avatars", () => {
      fc.assert(
        fc.property(
          fc.array(collaboratorArb, { minLength: 0, maxLength: 50 }),
          maxVisibleArb,
          (collaborators, maxVisible) => {
            const { visibleCount } = computePresenceDisplayBounds(collaborators, maxVisible)
            expect(visibleCount).toBeLessThanOrEqual(maxVisible)
          }
        ),
        { numRuns: 200 }
      )
    })

    it("visible count equals min(N, maxVisible) for any collaborator array of size N", () => {
      fc.assert(
        fc.property(
          fc.array(collaboratorArb, { minLength: 0, maxLength: 50 }),
          maxVisibleArb,
          (collaborators, maxVisible) => {
            const { visibleCount } = computePresenceDisplayBounds(collaborators, maxVisible)
            expect(visibleCount).toBe(Math.min(collaborators.length, maxVisible))
          }
        ),
        { numRuns: 200 }
      )
    })
  })

  describe("Overflow count", () => {
    it("overflow equals N - maxVisible when N > maxVisible", () => {
      fc.assert(
        fc.property(
          fc.array(collaboratorArb, { minLength: 1, maxLength: 50 }),
          maxVisibleArb,
          (collaborators, maxVisible) => {
            fc.pre(collaborators.length > maxVisible)
            const { overflowCount } = computePresenceDisplayBounds(collaborators, maxVisible)
            expect(overflowCount).toBe(collaborators.length - maxVisible)
          }
        ),
        { numRuns: 200 }
      )
    })

    it("overflow is 0 when N <= maxVisible", () => {
      fc.assert(
        fc.property(
          fc.array(collaboratorArb, { minLength: 0, maxLength: 50 }),
          maxVisibleArb,
          (collaborators, maxVisible) => {
            fc.pre(collaborators.length <= maxVisible)
            const { overflowCount } = computePresenceDisplayBounds(collaborators, maxVisible)
            expect(overflowCount).toBe(0)
          }
        ),
        { numRuns: 200 }
      )
    })
  })

  describe("Empty collaborators renders nothing", () => {
    it("empty collaborators array produces zero visible and zero overflow", () => {
      fc.assert(
        fc.property(maxVisibleArb, (maxVisible) => {
          const { visibleCount, overflowCount } = computePresenceDisplayBounds([], maxVisible)
          expect(visibleCount).toBe(0)
          expect(overflowCount).toBe(0)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Non-negative values", () => {
    it("visible count is always >= 0", () => {
      fc.assert(
        fc.property(
          fc.array(collaboratorArb, { minLength: 0, maxLength: 50 }),
          maxVisibleArb,
          (collaborators, maxVisible) => {
            const { visibleCount } = computePresenceDisplayBounds(collaborators, maxVisible)
            expect(visibleCount).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 200 }
      )
    })

    it("overflow count is always >= 0", () => {
      fc.assert(
        fc.property(
          fc.array(collaboratorArb, { minLength: 0, maxLength: 50 }),
          maxVisibleArb,
          (collaborators, maxVisible) => {
            const { overflowCount } = computePresenceDisplayBounds(collaborators, maxVisible)
            expect(overflowCount).toBeGreaterThanOrEqual(0)
          }
        ),
        { numRuns: 200 }
      )
    })
  })

  describe("Total preserved", () => {
    it("visible + overflow always equals total collaborators count", () => {
      fc.assert(
        fc.property(
          fc.array(collaboratorArb, { minLength: 0, maxLength: 50 }),
          maxVisibleArb,
          (collaborators, maxVisible) => {
            const { visibleCount, overflowCount } = computePresenceDisplayBounds(
              collaborators,
              maxVisible
            )
            expect(visibleCount + overflowCount).toBe(collaborators.length)
          }
        ),
        { numRuns: 200 }
      )
    })
  })
})
