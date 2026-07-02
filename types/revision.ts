export type RevisionLabel = "auto-saved" | "manual-save" | "restored" | "initial"

export type Revision = {
  id: string
  noteId: string
  content: string
  contentHash: string
  label: RevisionLabel
  authorId: string
  authorName: string
  authorAvatarUrl: string | null
  createdAt: string // ISO 8601
}

export type RevisionGroup = {
  id: string // derived from first revision ID in group
  revisions: Revision[]
  startTime: string
  endTime: string
  authorName: string
  count: number
  expanded: boolean
}

export type RevisionListResponse = {
  revisions: Revision[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export type DiffChange = {
  type: "addition" | "deletion" | "unchanged"
  value: string
}

export type TimeTravelState = {
  active: boolean
  revisionId: string | null
  content: string | null
  timestamp: string | null
  loading: boolean
}

export type SessionUndoState = {
  currentIndex: number
  stack: string[] // revision IDs navigated
  canUndo: boolean
  canRedo: boolean
}
