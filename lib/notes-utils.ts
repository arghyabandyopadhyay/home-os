import type { Note } from "@/types/note"

/**
 * Truncate content to a maximum length, appending ellipsis if truncated.
 */
export function truncatePreview(
  content: string | null | undefined,
  max: number
): string {
  if (!content) return ""
  if (content.length <= max) return content
  return content.slice(0, max) + "…"
}

/**
 * Filter notes by a search query (case-insensitive match on title + content).
 */
export function filterNotesByQuery(
  notes: Note[],
  query: string
): Note[] {
  const q = query.toLowerCase().trim()
  if (q.length < 2) return notes
  return notes.filter(
    (note) =>
      note.title.toLowerCase().includes(q) ||
      (note.content ?? "").toLowerCase().includes(q)
  )
}

/**
 * Filter notes that contain a specific tag.
 */
export function filterNotesByTag(
  notes: Note[],
  tag: string
): Note[] {
  return notes.filter((note) => (note.tags ?? []).includes(tag))
}

/**
 * Sort notes so that pinned notes appear first, preserving relative order within each group.
 */
export function sortNotesByPin(
  notes: Note[],
  pinnedIds: string[]
): Note[] {
  const pinnedSet = new Set(pinnedIds)
  const pinned = notes.filter((n) => pinnedSet.has(n.id))
  const unpinned = notes.filter((n) => !pinnedSet.has(n.id))
  // Sort pinned notes in the order they appear in pinnedIds
  pinned.sort(
    (a, b) => pinnedIds.indexOf(a.id) - pinnedIds.indexOf(b.id)
  )
  return [...pinned, ...unpinned]
}

/**
 * Cap the pinned note IDs array to a maximum count.
 */
export function capPinnedNotes(
  ids: string[],
  max: number
): string[] {
  return ids.slice(0, max)
}
