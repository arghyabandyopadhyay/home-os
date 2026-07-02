import { createClientApiClient } from "@/lib/api-client"
import type { Revision, RevisionLabel, RevisionListResponse } from "@/types/revision"

const api = createClientApiClient()

export async function getRevisions(
  noteId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<RevisionListResponse> {
  return api.get<RevisionListResponse>(
    `/notes/${noteId}/revisions?page=${page}&pageSize=${pageSize}`
  )
}

export async function getRevision(
  noteId: string,
  revisionId: string
): Promise<Revision> {
  return api.get<Revision>(`/notes/${noteId}/revisions/${revisionId}`)
}

export async function createRevision(
  noteId: string,
  content: string,
  label: RevisionLabel
): Promise<Revision> {
  return api.post<Revision>(`/notes/${noteId}/revisions`, {
    body: { content, label },
  })
}

export async function restoreRevision(
  noteId: string,
  revisionId: string
): Promise<Revision> {
  return api.post<Revision>(
    `/notes/${noteId}/revisions/${revisionId}/restore`
  )
}
