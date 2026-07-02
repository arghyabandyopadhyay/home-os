import type { Revision, RevisionGroup } from "@/types/revision"

const DEFAULT_WINDOW_MS = 300000 // 5 minutes

/**
 * Determines if a revision should be grouped with the previous one.
 * Same author + within time window = grouped.
 */
export function shouldGroup(
  current: Revision,
  previous: Revision,
  windowMs: number
): boolean {
  if (current.authorId !== previous.authorId) {
    return false
  }

  const currentTime = new Date(current.createdAt).getTime()
  const previousTime = new Date(previous.createdAt).getTime()
  const gap = Math.abs(currentTime - previousTime)

  return gap <= windowMs
}

/**
 * Groups revisions made within `windowMs` by the same author into clusters.
 * Default window: 5 minutes (300000ms).
 *
 * Input: revisions sorted by createdAt descending.
 *
 * For each revision:
 *   If same author as previous AND time gap ≤ window:
 *     Add to current group
 *   Else:
 *     Start new group (or emit as standalone if group has 1 item)
 */
export function groupRevisions(
  revisions: Revision[],
  windowMs: number = DEFAULT_WINDOW_MS
): (Revision | RevisionGroup)[] {
  if (revisions.length === 0) {
    return []
  }

  const result: (Revision | RevisionGroup)[] = []
  let currentGroup: Revision[] = [revisions[0]]

  for (let i = 1; i < revisions.length; i++) {
    const current = revisions[i]
    const previous = revisions[i - 1]

    if (shouldGroup(current, previous, windowMs)) {
      currentGroup.push(current)
    } else {
      result.push(emitGroup(currentGroup))
      currentGroup = [current]
    }
  }

  // Emit the last group
  result.push(emitGroup(currentGroup))

  return result
}

/**
 * Emits a group of revisions as either a standalone Revision (if single item)
 * or a RevisionGroup (if multiple items).
 */
function emitGroup(group: Revision[]): Revision | RevisionGroup {
  if (group.length === 1) {
    return group[0]
  }

  // Group contains multiple revisions — timestamps are descending order from input
  const timestamps = group.map((r) => new Date(r.createdAt).getTime())
  const startTime = new Date(Math.min(...timestamps)).toISOString()
  const endTime = new Date(Math.max(...timestamps)).toISOString()

  return {
    id: group[0].id,
    revisions: group,
    startTime,
    endTime,
    authorName: group[0].authorName,
    count: group.length,
    expanded: false,
  }
}
