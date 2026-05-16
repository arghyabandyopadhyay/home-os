import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import {
  capPinnedNotes,
  truncatePreview,
  sortNotesByPin,
  filterNotesByTag,
  filterNotesByQuery,
} from "@/lib/notes-utils"
import type { Note } from "@/types/note"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function noteArb(overrides?: Partial<Note>): fc.Arbitrary<Note> {
  const isoDateArb = fc.integer({ min: 1577836800000, max: 1924905600000 }).map(
    (ts) => new Date(ts).toISOString()
  )
  return fc.record({
    id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 200 }),
    content: fc.option(fc.string({ maxLength: 500 }), { nil: null }),
    created_at: isoDateArb,
    updated_at: isoDateArb,
    tags: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 5 }),
    linked_book_id: fc.constant(null),
    linked_contact_id: fc.constant(null),
    ...overrides,
  }) as fc.Arbitrary<Note>
}

// ─── Property Tests ───────────────────────────────────────────────────────────

// Feature: calm-home-os, Property 1: Pin cap
describe("P1: Pinned Notes Display Cap", () => {
  it("capPinnedNotes never returns more than max items", () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 0, maxLength: 30 }),
        fc.integer({ min: 0, max: 20 }),
        (ids, max) => {
          const result = capPinnedNotes(ids, max)
          expect(result.length).toBeLessThanOrEqual(max)
        }
      ),
      { numRuns: 100 }
    )
  })

  it("dashboard displays at most 6 pinned notes", () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 0, maxLength: 30 }),
        (ids) => {
          const result = capPinnedNotes(ids, 6)
          expect(result.length).toBeLessThanOrEqual(6)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 3: Note preview truncation
describe("P3: Note Preview Truncation", () => {
  it("preview is at most 120 characters long", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 0, maxLength: 1000 }), (content) => {
        const preview = truncatePreview(content, 120)
        expect(preview.length).toBeLessThanOrEqual(120 + 1) // +1 for ellipsis char
      }),
      { numRuns: 100 }
    )
  })

  it("if content is shorter than 120 chars, preview equals content exactly", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 119 }),
        (content) => {
          const preview = truncatePreview(content, 120)
          expect(preview).toBe(content)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 5: Pinned notes sort order
describe("P5: Pinned Notes Sort Order", () => {
  it("all pinned notes appear before any unpinned note", () => {
    fc.assert(
      fc.property(
        fc.array(noteArb(), { minLength: 1, maxLength: 20 }),
        fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }),
        (notes, pinnedIds) => {
          // Make some notes actually pinned by assigning pinnedIds from note ids
          const noteIds = notes.map((n) => n.id)
          const validPinnedIds = pinnedIds.filter((id) => noteIds.includes(id))
          const sorted = sortNotesByPin(notes, validPinnedIds)
          const pinnedSet = new Set(validPinnedIds)

          let seenUnpinned = false
          for (const note of sorted) {
            if (!pinnedSet.has(note.id)) {
              seenUnpinned = true
            } else if (seenUnpinned) {
              // A pinned note appeared after an unpinned note — violation
              expect(true).toBe(false)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it("pinned notes appear before unpinned notes (using note ids as pinned)", () => {
    fc.assert(
      fc.property(
        fc.array(noteArb(), { minLength: 2, maxLength: 15 }),
        (notes) => {
          // Pin the first half of notes
          const pinnedIds = notes.slice(0, Math.ceil(notes.length / 2)).map((n) => n.id)
          const sorted = sortNotesByPin(notes, pinnedIds)
          const pinnedSet = new Set(pinnedIds)

          const firstUnpinnedIdx = sorted.findIndex((n) => !pinnedSet.has(n.id))
          if (firstUnpinnedIdx === -1) return // all pinned, trivially true

          // All items after firstUnpinnedIdx should be unpinned
          for (let i = firstUnpinnedIdx; i < sorted.length; i++) {
            expect(pinnedSet.has(sorted[i].id)).toBe(false)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 6: Pin limit enforcement
describe("P6: Pin Limit Enforcement", () => {
  it("adding to a full pinnedIds array (length 10) does not exceed 10", () => {
    fc.assert(
      fc.property(
        fc.array(fc.uuid(), { minLength: 10, maxLength: 10 }),
        fc.uuid(),
        (existingIds, newId) => {
          const withNew = [...existingIds, newId]
          const capped = capPinnedNotes(withNew, 10)
          expect(capped.length).toBeLessThanOrEqual(10)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 7: Tag filter completeness
describe("P7: Tag Filter Completeness", () => {
  it("every item in filtered result contains the tag; no item without the tag appears", () => {
    fc.assert(
      fc.property(
        fc.array(noteArb(), { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 1, maxLength: 20 }),
        (notes, tag) => {
          // Ensure some notes have the tag
          const notesWithTag = notes.map((n, i) =>
            i % 2 === 0 ? { ...n, tags: [...n.tags, tag] } : n
          )
          const result = filterNotesByTag(notesWithTag, tag)

          // Every result must contain the tag
          for (const note of result) {
            expect(note.tags).toContain(tag)
          }

          // No note without the tag should appear
          const resultIds = new Set(result.map((n) => n.id))
          for (const note of notesWithTag) {
            if (!note.tags.includes(tag)) {
              expect(resultIds.has(note.id)).toBe(false)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 8: Notes search completeness
describe("P8: Notes Search Completeness", () => {
  it("every note in result contains query in title or content; no non-matching note appears", () => {
    fc.assert(
      fc.property(
        fc.array(noteArb(), { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 2, maxLength: 20 }),
        (notes, query) => {
          const result = filterNotesByQuery(notes, query)
          const q = query.toLowerCase().trim()

          if (q.length < 2) {
            // Should return all notes
            expect(result.length).toBe(notes.length)
            return
          }

          // Every result must match
          for (const note of result) {
            const matches =
              note.title.toLowerCase().includes(q) ||
              (note.content ?? "").toLowerCase().includes(q)
            expect(matches).toBe(true)
          }

          // No non-matching note should appear
          const resultIds = new Set(result.map((n) => n.id))
          for (const note of notes) {
            const matches =
              note.title.toLowerCase().includes(q) ||
              (note.content ?? "").toLowerCase().includes(q)
            if (!matches) {
              expect(resultIds.has(note.id)).toBe(false)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 9: Search clear round-trip
describe("P9: Search Clear Round-Trip", () => {
  it("applying search then clearing restores the full original collection", () => {
    fc.assert(
      fc.property(
        fc.array(noteArb(), { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 2, maxLength: 20 }),
        (notes, query) => {
          // Apply search
          const filtered = filterNotesByQuery(notes, query)
          // Clear search (empty query returns all)
          const restored = filterNotesByQuery(notes, "")

          expect(restored.length).toBe(notes.length)
          expect(restored.map((n) => n.id)).toEqual(notes.map((n) => n.id))
        }
      ),
      { numRuns: 100 }
    )
  })
})
