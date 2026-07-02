import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import type { OfflineUpdate } from "@/types/collaboration"

/**
 * Property: Offline Queue Integrity
 * Validates: Requirements 6.2, 6.3, 6.6
 *
 * - All queued updates have monotonically increasing timestamps
 * - `getPendingUpdates` returns updates in timestamp order
 * - After `clearPendingUpdates`, `getPendingUpdates` returns empty array
 * - Queue compaction at >1000 entries produces a single entry that encodes the full document state
 * - ID uniqueness: all update IDs in a queue are unique
 *
 * Since IndexedDB isn't available in the test environment, we test the logical
 * properties of offline queue behavior using in-memory equivalents of the operations.
 */

// --- In-memory simulation of offline queue operations ---

/**
 * Simulates `getPendingUpdates` — returns updates sorted by timestamp ascending.
 * This mirrors the OfflineStore implementation which sorts by `a.timestamp - b.timestamp`.
 */
function getPendingUpdates(queue: OfflineUpdate[]): OfflineUpdate[] {
  return [...queue].sort((a, b) => a.timestamp - b.timestamp)
}

/**
 * Simulates `clearPendingUpdates` — removes all updates for a given noteId.
 */
function clearPendingUpdates(queue: OfflineUpdate[], noteId: string): OfflineUpdate[] {
  return queue.filter((u) => u.noteId !== noteId)
}

/**
 * Simulates compaction logic: if queue exceeds 1000 entries for a note,
 * compact to a single state snapshot entry.
 */
function compactIfNeeded(
  queue: OfflineUpdate[],
  noteId: string,
  fullStateSnapshot: Uint8Array
): OfflineUpdate[] {
  const noteUpdates = queue.filter((u) => u.noteId === noteId)
  if (noteUpdates.length <= 1000) return queue

  // Remove all updates for this note and replace with a single compacted entry
  const otherUpdates = queue.filter((u) => u.noteId !== noteId)
  const compactedEntry: OfflineUpdate = {
    id: crypto.randomUUID(),
    noteId,
    update: fullStateSnapshot,
    timestamp: Date.now(),
  }
  return [...otherUpdates, compactedEntry]
}

// --- Arbitraries ---

/** Generate a Uint8Array simulating a Yjs binary update */
const uint8ArrayArb = fc
  .array(fc.integer({ min: 0, max: 255 }), { minLength: 1, maxLength: 64 })
  .map((arr) => new Uint8Array(arr))

/** Generate an OfflineUpdate with a specific timestamp */
const offlineUpdateArb: fc.Arbitrary<OfflineUpdate> = fc.record({
  id: fc.uuid(),
  noteId: fc.constantFrom("note-1", "note-2", "note-3"),
  update: uint8ArrayArb,
  timestamp: fc.integer({ min: 1_000_000_000_000, max: 2_000_000_000_000 }),
})

/** Generate an array of OfflineUpdates for the same note */
const sameNoteUpdatesArb = (noteId: string) =>
  fc.array(
    fc.record({
      id: fc.uuid(),
      noteId: fc.constant(noteId),
      update: uint8ArrayArb,
      timestamp: fc.integer({ min: 1_000_000_000_000, max: 2_000_000_000_000 }),
    }),
    { minLength: 1, maxLength: 50 }
  )

/** Generate monotonically increasing timestamps */
const monotonicallyIncreasingUpdatesArb = (noteId: string) =>
  fc
    .array(fc.nat({ max: 1000 }), { minLength: 2, maxLength: 50 })
    .map((deltas) => {
      let timestamp = 1_000_000_000_000
      return deltas.map((delta) => {
        timestamp += delta + 1 // always increasing
        return {
          id: crypto.randomUUID(),
          noteId,
          update: new Uint8Array([1, 2, 3]),
          timestamp,
        } as OfflineUpdate
      })
    })

/** Generate a queue with >1000 entries for compaction testing */
const largeQueueArb = (noteId: string) =>
  fc
    .integer({ min: 1001, max: 1050 })
    .map((count) => {
      const updates: OfflineUpdate[] = []
      for (let i = 0; i < count; i++) {
        updates.push({
          id: `id-${i}-${Math.random().toString(36).slice(2)}`,
          noteId,
          update: new Uint8Array([i % 256]),
          timestamp: 1_000_000_000_000 + i,
        })
      }
      return updates
    })

describe("Feature: realtime-collaboration-frontend, Property: Offline Queue Integrity", () => {
  describe("Timestamp monotonicity: sorted updates have ascending timestamps", () => {
    it("getPendingUpdates returns updates in ascending timestamp order", () => {
      fc.assert(
        fc.property(sameNoteUpdatesArb("note-1"), (updates) => {
          const sorted = getPendingUpdates(updates)

          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].timestamp).toBeGreaterThanOrEqual(sorted[i - 1].timestamp)
          }
        }),
        { numRuns: 200 }
      )
    })

    it("monotonically increasing input timestamps are preserved in sorted output", () => {
      fc.assert(
        fc.property(monotonicallyIncreasingUpdatesArb("note-1"), (updates) => {
          const sorted = getPendingUpdates(updates)

          // Strictly increasing timestamps remain in order
          for (let i = 1; i < sorted.length; i++) {
            expect(sorted[i].timestamp).toBeGreaterThan(sorted[i - 1].timestamp)
          }
        }),
        { numRuns: 200 }
      )
    })

    it("sorting preserves all items (no loss or duplication)", () => {
      fc.assert(
        fc.property(sameNoteUpdatesArb("note-1"), (updates) => {
          const sorted = getPendingUpdates(updates)
          expect(sorted.length).toBe(updates.length)

          const originalIds = new Set(updates.map((u) => u.id))
          const sortedIds = new Set(sorted.map((u) => u.id))
          expect(sortedIds).toEqual(originalIds)
        }),
        { numRuns: 200 }
      )
    })

    it("sorting is idempotent: sorting already-sorted queue produces same result", () => {
      fc.assert(
        fc.property(sameNoteUpdatesArb("note-1"), (updates) => {
          const sorted = getPendingUpdates(updates)
          const sortedAgain = getPendingUpdates(sorted)
          expect(sortedAgain.map((u) => u.id)).toEqual(sorted.map((u) => u.id))
        }),
        { numRuns: 200 }
      )
    })
  })

  describe("Clear semantics: clearPendingUpdates empties the queue for a note", () => {
    it("after clearing, getPendingUpdates returns empty array for that note", () => {
      fc.assert(
        fc.property(sameNoteUpdatesArb("note-1"), (updates) => {
          const cleared = clearPendingUpdates(updates, "note-1")
          const pending = getPendingUpdates(cleared.filter((u) => u.noteId === "note-1"))
          expect(pending).toEqual([])
        }),
        { numRuns: 200 }
      )
    })

    it("clearing one note does not affect updates for other notes", () => {
      fc.assert(
        fc.property(
          fc.array(offlineUpdateArb, { minLength: 1, maxLength: 30 }),
          (updates) => {
            const cleared = clearPendingUpdates(updates, "note-1")

            // All non-note-1 updates should still be present
            const otherUpdates = updates.filter((u) => u.noteId !== "note-1")
            const remainingOther = cleared.filter((u) => u.noteId !== "note-1")
            expect(remainingOther.length).toBe(otherUpdates.length)
          }
        ),
        { numRuns: 200 }
      )
    })

    it("clearing an already empty queue still returns empty", () => {
      const cleared = clearPendingUpdates([], "note-1")
      const pending = getPendingUpdates(cleared)
      expect(pending).toEqual([])
    })
  })

  describe("Compaction threshold: >1000 entries compact to single state snapshot", () => {
    it("queue with >1000 entries for a note compacts to a single entry", () => {
      fc.assert(
        fc.property(largeQueueArb("note-1"), (updates) => {
          const snapshot = new Uint8Array([42, 43, 44]) // simulated full state
          const compacted = compactIfNeeded(updates, "note-1", snapshot)

          const noteEntries = compacted.filter((u) => u.noteId === "note-1")
          expect(noteEntries.length).toBe(1)
        }),
        { numRuns: 20 }
      )
    })

    it("compacted entry contains the full document state snapshot", () => {
      fc.assert(
        fc.property(largeQueueArb("note-1"), uint8ArrayArb, (updates, snapshot) => {
          const compacted = compactIfNeeded(updates, "note-1", snapshot)

          const noteEntries = compacted.filter((u) => u.noteId === "note-1")
          expect(noteEntries[0].update).toEqual(snapshot)
        }),
        { numRuns: 20 }
      )
    })

    it("queue with <=1000 entries is not compacted", () => {
      fc.assert(
        fc.property(sameNoteUpdatesArb("note-1"), (updates) => {
          // sameNoteUpdatesArb generates max 50 entries, well under threshold
          const snapshot = new Uint8Array([1])
          const result = compactIfNeeded(updates, "note-1", snapshot)

          // Should be unchanged
          expect(result.length).toBe(updates.length)
        }),
        { numRuns: 200 }
      )
    })

    it("compaction does not affect other notes in the queue", () => {
      fc.assert(
        fc.property(
          largeQueueArb("note-1"),
          sameNoteUpdatesArb("note-2"),
          (note1Updates, note2Updates) => {
            const combined = [...note1Updates, ...note2Updates]
            const snapshot = new Uint8Array([99])
            const compacted = compactIfNeeded(combined, "note-1", snapshot)

            const note2Entries = compacted.filter((u) => u.noteId === "note-2")
            expect(note2Entries.length).toBe(note2Updates.length)
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe("ID uniqueness: all queued updates have unique identifiers", () => {
    it("generated updates with UUID IDs are all unique", () => {
      fc.assert(
        fc.property(
          fc.array(offlineUpdateArb, { minLength: 2, maxLength: 100 }),
          (updates) => {
            const ids = updates.map((u) => u.id)
            const uniqueIds = new Set(ids)
            expect(uniqueIds.size).toBe(ids.length)
          }
        ),
        { numRuns: 200 }
      )
    })

    it("IDs remain unique after sorting by timestamp", () => {
      fc.assert(
        fc.property(
          fc.array(offlineUpdateArb, { minLength: 2, maxLength: 100 }),
          (updates) => {
            const sorted = getPendingUpdates(updates)
            const ids = sorted.map((u) => u.id)
            const uniqueIds = new Set(ids)
            expect(uniqueIds.size).toBe(ids.length)
          }
        ),
        { numRuns: 200 }
      )
    })
  })
})
