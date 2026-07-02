import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query"
import {
  getRevisions,
  getRevision,
  createRevision,
  restoreRevision,
} from "@/lib/revisions/api"
import { noteKeys } from "@/hooks/queries/use-notes"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import type { RevisionListResponse, RevisionLabel } from "@/types/revision"

export const revisionKeys = {
  all: (noteId: string) => ["revisions", noteId] as const,
  detail: (noteId: string, revisionId: string) =>
    ["revisions", noteId, revisionId] as const,
}

export function useRevisions(noteId: string) {
  return useInfiniteQuery({
    queryKey: revisionKeys.all(noteId),
    queryFn: ({ pageParam = 1 }) => getRevisions(noteId, pageParam, 20),
    getNextPageParam: (lastPage: RevisionListResponse) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!noteId,
  })
}

export function useRevision(noteId: string, revisionId: string | null) {
  return useQuery({
    queryKey: revisionKeys.detail(noteId, revisionId ?? ""),
    queryFn: () => getRevision(noteId, revisionId!),
    enabled: !!revisionId,
  })
}

export function useCreateRevision(noteId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      content,
      label,
    }: {
      content: string
      label: RevisionLabel
    }) => createRevision(noteId, content, label),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: revisionKeys.all(noteId) })
    },
  })
}

export function useRestoreRevision(noteId: string) {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()

  return useMutation({
    mutationFn: (revisionId: string) => restoreRevision(noteId, revisionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: revisionKeys.all(noteId) })
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: noteKeys.detail(activeWorkspaceId, noteId) })
      }
    },
  })
}
