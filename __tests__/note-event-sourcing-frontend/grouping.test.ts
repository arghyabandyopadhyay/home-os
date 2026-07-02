import { describe, it, expect } from "vitest"
import { groupRevisions, shouldGroup } from "@/lib/revisions/grouping"
import type { Revision, RevisionGroup } from "@/types/revision"

function makeRevision(overrides: Partial<Revision> = {}): Revision {
  return {
    id: "rev-1",
    noteId: "note-1",
    content: "content",
    contentHash: "hash",
    label: "auto-saved",
    authorId: "author-1",
    authorName: "Alice",
    authorAvatarUrl: null,
    createdAt: "2024-01-01T12:00:00.000Z",
    ...overrides,
  }
}

function isRevisionGroup(item: Revision | RevisionGroup): item is RevisionGroup {
  return "revisions" in item && Array.isArray((item as RevisionGroup).revisions)
}

describe("shouldGroup", () => {
  it("returns true for same author within window", () => {
    const prev = makeRevision({ createdAt: "2024-01-01T12:00:00.000Z" })
    const curr = makeRevision({ createdAt: "2024-01-01T12:04:00.000Z" })
    expect(shouldGroup(curr, prev, 300000)).toBe(true)
  })

  it("returns false for different authors within window", () => {
    const prev = makeRevision({ authorId: "author-1", createdAt: "2024-01-01T12:00:00.000Z" })
    const curr = makeRevision({ authorId: "author-2", createdAt: "2024-01-01T12:01:00.000Z" })
    expect(shouldGroup(curr, prev, 300000)).toBe(false)
  })

  it("returns false for same author outside window", () => {
    const prev = makeRevision({ createdAt: "2024-01-01T12:00:00.000Z" })
    const curr = makeRevision({ createdAt: "2024-01-01T12:06:00.000Z" })
    expect(shouldGroup(curr, prev, 300000)).toBe(false)
  })

  it("returns true for same author exactly at window boundary", () => {
    const prev = makeRevision({ createdAt: "2024-01-01T12:00:00.000Z" })
    const curr = makeRevision({ createdAt: "2024-01-01T12:05:00.000Z" })
    expect(shouldGroup(curr, prev, 300000)).toBe(true)
  })

  it("handles descending time order (current before previous chronologically)", () => {
    const prev = makeRevision({ createdAt: "2024-01-01T12:05:00.000Z" })
    const curr = makeRevision({ createdAt: "2024-01-01T12:03:00.000Z" })
    expect(shouldGroup(curr, prev, 300000)).toBe(true)
  })
})

describe("groupRevisions", () => {
  it("returns empty array for empty input", () => {
    expect(groupRevisions([])).toEqual([])
  })

  it("returns single revision as standalone (not wrapped in group)", () => {
    const rev = makeRevision()
    const result = groupRevisions([rev])
    expect(result).toHaveLength(1)
    expect(result[0]).toBe(rev)
    expect(isRevisionGroup(result[0])).toBe(false)
  })

  it("groups consecutive revisions by same author within window", () => {
    const revisions = [
      makeRevision({ id: "r1", createdAt: "2024-01-01T12:04:00.000Z" }),
      makeRevision({ id: "r2", createdAt: "2024-01-01T12:02:00.000Z" }),
      makeRevision({ id: "r3", createdAt: "2024-01-01T12:00:00.000Z" }),
    ]
    const result = groupRevisions(revisions)
    expect(result).toHaveLength(1)
    expect(isRevisionGroup(result[0])).toBe(true)
    const group = result[0] as RevisionGroup
    expect(group.count).toBe(3)
    expect(group.revisions).toEqual(revisions)
    expect(group.authorName).toBe("Alice")
  })

  it("does not group revisions by different authors", () => {
    const revisions = [
      makeRevision({ id: "r1", authorId: "a1", authorName: "Alice", createdAt: "2024-01-01T12:02:00.000Z" }),
      makeRevision({ id: "r2", authorId: "a2", authorName: "Bob", createdAt: "2024-01-01T12:01:00.000Z" }),
      makeRevision({ id: "r3", authorId: "a1", authorName: "Alice", createdAt: "2024-01-01T12:00:00.000Z" }),
    ]
    const result = groupRevisions(revisions)
    expect(result).toHaveLength(3)
    result.forEach((item) => {
      expect(isRevisionGroup(item)).toBe(false)
    })
  })

  it("splits groups when time gap exceeds window", () => {
    const revisions = [
      makeRevision({ id: "r1", createdAt: "2024-01-01T12:30:00.000Z" }),
      makeRevision({ id: "r2", createdAt: "2024-01-01T12:28:00.000Z" }),
      makeRevision({ id: "r3", createdAt: "2024-01-01T12:00:00.000Z" }), // big gap from r2
      makeRevision({ id: "r4", createdAt: "2024-01-01T11:58:00.000Z" }),
    ]
    const result = groupRevisions(revisions)
    expect(result).toHaveLength(2)
    expect(isRevisionGroup(result[0])).toBe(true)
    expect(isRevisionGroup(result[1])).toBe(true)
    expect((result[0] as RevisionGroup).count).toBe(2)
    expect((result[1] as RevisionGroup).count).toBe(2)
  })

  it("uses custom window when provided", () => {
    const revisions = [
      makeRevision({ id: "r1", createdAt: "2024-01-01T12:02:00.000Z" }),
      makeRevision({ id: "r2", createdAt: "2024-01-01T12:00:00.000Z" }),
    ]
    // 1 minute window — gap is 2 minutes, so they should NOT group
    const result = groupRevisions(revisions, 60000)
    expect(result).toHaveLength(2)
    expect(isRevisionGroup(result[0])).toBe(false)
    expect(isRevisionGroup(result[1])).toBe(false)
  })

  it("sets correct startTime and endTime on groups", () => {
    const revisions = [
      makeRevision({ id: "r1", createdAt: "2024-01-01T12:04:00.000Z" }),
      makeRevision({ id: "r2", createdAt: "2024-01-01T12:02:00.000Z" }),
      makeRevision({ id: "r3", createdAt: "2024-01-01T12:00:00.000Z" }),
    ]
    const result = groupRevisions(revisions)
    const group = result[0] as RevisionGroup
    expect(group.startTime).toBe("2024-01-01T12:00:00.000Z")
    expect(group.endTime).toBe("2024-01-01T12:04:00.000Z")
  })

  it("sets group id from first revision in the group", () => {
    const revisions = [
      makeRevision({ id: "first-rev", createdAt: "2024-01-01T12:03:00.000Z" }),
      makeRevision({ id: "second-rev", createdAt: "2024-01-01T12:01:00.000Z" }),
    ]
    const result = groupRevisions(revisions)
    const group = result[0] as RevisionGroup
    expect(group.id).toBe("first-rev")
  })

  it("sets expanded to false on new groups", () => {
    const revisions = [
      makeRevision({ id: "r1", createdAt: "2024-01-01T12:03:00.000Z" }),
      makeRevision({ id: "r2", createdAt: "2024-01-01T12:01:00.000Z" }),
    ]
    const result = groupRevisions(revisions)
    const group = result[0] as RevisionGroup
    expect(group.expanded).toBe(false)
  })

  it("handles mixed grouping scenario", () => {
    const revisions = [
      makeRevision({ id: "r1", authorId: "a1", createdAt: "2024-01-01T13:00:00.000Z" }),
      makeRevision({ id: "r2", authorId: "a1", createdAt: "2024-01-01T12:58:00.000Z" }),
      makeRevision({ id: "r3", authorId: "a2", createdAt: "2024-01-01T12:57:00.000Z" }),
      makeRevision({ id: "r4", authorId: "a2", createdAt: "2024-01-01T12:55:00.000Z" }),
      makeRevision({ id: "r5", authorId: "a2", createdAt: "2024-01-01T12:54:00.000Z" }),
      makeRevision({ id: "r6", authorId: "a1", createdAt: "2024-01-01T12:00:00.000Z" }),
    ]
    const result = groupRevisions(revisions)
    // r1+r2 grouped (same author a1, within 5 min)
    // r3+r4+r5 grouped (same author a2, within 5 min)
    // r6 standalone (different author from r5, or big gap)
    expect(result).toHaveLength(3)
    expect(isRevisionGroup(result[0])).toBe(true)
    expect((result[0] as RevisionGroup).count).toBe(2)
    expect(isRevisionGroup(result[1])).toBe(true)
    expect((result[1] as RevisionGroup).count).toBe(3)
    expect(isRevisionGroup(result[2])).toBe(false)
  })
})
