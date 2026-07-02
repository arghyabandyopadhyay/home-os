import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { groupRevisions } from "@/lib/revisions/grouping"
import type { Revision, RevisionGroup } from "@/types/revision"

/**
 * Property: Grouping Window Correctness
 * Validates: Requirements 1.4, 1.5
 *
 * For any list of revisions:
 * 1. All revisions within a returned group have the same authorId
 * 2. Adjacent revisions in a group have timestamps within windowMs of each other
 * 3. Single-revision groups are emitted as standalone Revision objects (not RevisionGroup)
 * 4. Total number of revisions across all groups/standalone items equals input length
 */

// --- Helpers ---

function isRevisionGroup(item: Revision | RevisionGroup): item is RevisionGroup {
  return "revisions" in item && Array.isArray((item as RevisionGroup).revisions)
}

// --- Arbitraries ---

const AUTHORS = ["author-1", "author-2", "author-3", "author-4", "author-5"]
const AUTHOR_NAMES = ["Alice", "Bob", "Charlie", "Diana", "Eve"]
const LABELS: Revision["label"][] = ["auto-saved", "manual-save", "restored", "initial"]

const authorIndexArb = fc.integer({ min: 0, max: AUTHORS.length - 1 })

// Generate a timestamp within a 24-hour range (milliseconds since epoch)
const BASE_TIME = new Date("2024-06-01T00:00:00.000Z").getTime()
const timestampArb = fc.integer({ min: 0, max: 86400000 }) // 0 to 24 hours in ms

const revisionArb = fc.tuple(
  fc.uuid(),
  authorIndexArb,
  timestampArb,
  fc.constantFrom(...LABELS)
).map(([id, authorIdx, tsOffset, label]): Revision => ({
  id,
  noteId: "note-1",
  content: `content-${id}`,
  contentHash: `hash-${id}`,
  label,
  authorId: AUTHORS[authorIdx],
  authorName: AUTHOR_NAMES[authorIdx],
  authorAvatarUrl: null,
  createdAt: new Date(BASE_TIME + tsOffset).toISOString(),
}))

// Generate a list of revisions sorted descending by createdAt (as the function expects)
const revisionListArb = fc.array(revisionArb, { minLength: 0, maxLength: 30 }).map(
  (revisions) => revisions.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
)

// Generate a window in a reasonable range (1 minute to 30 minutes)
const windowMsArb = fc.integer({ min: 60000, max: 1800000 })

// --- Tests ---

describe("Feature: note-event-sourcing-frontend, Property: Grouping Window Correctness", () => {
  it("all revisions within a group share the same authorId", () => {
    /**
     * Validates: Requirements 1.4
     */
    fc.assert(
      fc.property(revisionListArb, windowMsArb, (revisions, windowMs) => {
        const result = groupRevisions(revisions, windowMs)

        for (const item of result) {
          if (isRevisionGroup(item)) {
            const authorIds = new Set(item.revisions.map((r) => r.authorId))
            expect(
              authorIds.size,
              `Group ${item.id} has multiple authors: ${[...authorIds].join(", ")}`
            ).toBe(1)
          }
        }
      }),
      { numRuns: 200 }
    )
  })

  it("adjacent revisions in a group have timestamps within windowMs of each other", () => {
    /**
     * Validates: Requirements 1.4, 1.5
     */
    fc.assert(
      fc.property(revisionListArb, windowMsArb, (revisions, windowMs) => {
        const result = groupRevisions(revisions, windowMs)

        for (const item of result) {
          if (isRevisionGroup(item)) {
            for (let i = 1; i < item.revisions.length; i++) {
              const currTime = new Date(item.revisions[i].createdAt).getTime()
              const prevTime = new Date(item.revisions[i - 1].createdAt).getTime()
              const gap = Math.abs(currTime - prevTime)

              expect(
                gap,
                `Adjacent revisions ${item.revisions[i - 1].id} and ${item.revisions[i].id} have gap ${gap}ms > window ${windowMs}ms`
              ).toBeLessThanOrEqual(windowMs)
            }
          }
        }
      }),
      { numRuns: 200 }
    )
  })

  it("single-revision groups are emitted as standalone Revision objects", () => {
    /**
     * Validates: Requirements 1.5
     */
    fc.assert(
      fc.property(revisionListArb, windowMsArb, (revisions, windowMs) => {
        const result = groupRevisions(revisions, windowMs)

        for (const item of result) {
          if (isRevisionGroup(item)) {
            // A RevisionGroup must contain more than 1 revision
            expect(
              item.revisions.length,
              `Group ${item.id} has only ${item.revisions.length} revision(s) — should be standalone`
            ).toBeGreaterThan(1)
          }
        }
      }),
      { numRuns: 200 }
    )
  })

  it("total revision count across all output items equals input length", () => {
    /**
     * Validates: Requirements 1.4, 1.5
     */
    fc.assert(
      fc.property(revisionListArb, windowMsArb, (revisions, windowMs) => {
        const result = groupRevisions(revisions, windowMs)

        let totalCount = 0
        for (const item of result) {
          if (isRevisionGroup(item)) {
            totalCount += item.revisions.length
          } else {
            totalCount += 1
          }
        }

        expect(
          totalCount,
          `Output has ${totalCount} revisions but input had ${revisions.length}`
        ).toBe(revisions.length)
      }),
      { numRuns: 200 }
    )
  })

  it("no adjacent output items could be merged without violating the grouping constraint", () => {
    /**
     * Validates: Requirements 1.4, 1.5
     *
     * For any two adjacent items in the output, either:
     * - They have different authors, OR
     * - The gap between the last revision of the first item and the first revision
     *   of the second item exceeds windowMs
     *
     * This ensures the grouping is maximal — no further merging is possible.
     */
    fc.assert(
      fc.property(revisionListArb, windowMsArb, (revisions, windowMs) => {
        const result = groupRevisions(revisions, windowMs)

        for (let i = 0; i < result.length - 1; i++) {
          const current = result[i]
          const next = result[i + 1]

          // Get the last revision of the current item and first revision of the next item
          const lastRevOfCurrent = isRevisionGroup(current)
            ? current.revisions[current.revisions.length - 1]
            : current
          const firstRevOfNext = isRevisionGroup(next)
            ? next.revisions[0]
            : next

          const sameAuthor = lastRevOfCurrent.authorId === firstRevOfNext.authorId
          const gap = Math.abs(
            new Date(lastRevOfCurrent.createdAt).getTime() -
            new Date(firstRevOfNext.createdAt).getTime()
          )
          const withinWindow = gap <= windowMs

          // They should NOT both be same author AND within window
          // (otherwise they should have been grouped together)
          expect(
            sameAuthor && withinWindow,
            `Adjacent items at indices ${i} and ${i + 1} could be merged: ` +
            `sameAuthor=${sameAuthor}, gap=${gap}ms, window=${windowMs}ms`
          ).toBe(false)
        }
      }),
      { numRuns: 200 }
    )
  })
})
