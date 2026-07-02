export { hashContent } from "./hash"
export { groupRevisions, shouldGroup } from "./grouping"
export { computeWordDiff, extractTextFromProseMirror } from "./diff"
export { getRevisions, getRevision, createRevision, restoreRevision } from "./api"

// Re-export types
export type {
  Revision,
  RevisionLabel,
  RevisionGroup,
  RevisionListResponse,
  DiffChange,
  TimeTravelState,
  SessionUndoState,
} from "@/types/revision"
