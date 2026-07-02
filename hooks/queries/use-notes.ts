import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import type { Note } from "@/types/note"

const api = createClientApiClient()

export const noteKeys = {
  all: (workspaceId: string) => ["notes", workspaceId] as const,
  detail: (workspaceId: string, id: string) => ["notes", workspaceId, id] as const,
}

export function useNotes() {
  const { activeWorkspaceId } = useWorkspaceStore()

  return useQuery({
    queryKey: noteKeys.all(activeWorkspaceId ?? ""),
    queryFn: () => api.get<Note[]>("/notes"),
    enabled: !!activeWorkspaceId,
  })
}

export function useNote(id: string) {
  const { activeWorkspaceId } = useWorkspaceStore()

  return useQuery({
    queryKey: noteKeys.detail(activeWorkspaceId ?? "", id),
    queryFn: () => api.get<Note>(`/notes/${id}`),
    enabled: !!activeWorkspaceId && !!id,
  })
}

export function useCreateNote() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()

  return useMutation({
    mutationFn: (input: { title: string; content?: string }) =>
      api.post<Note>("/notes", { body: input }),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: noteKeys.all(activeWorkspaceId) })
      }
    },
  })
}

export function useUpdateNote() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()

  return useMutation({
    mutationFn: ({
      id,
      ...updates
    }: {
      id: string
      title?: string
      content?: string | null
      tags?: string[]
      linked_book_id?: string | null
      linked_contact_id?: string | null
    }) => api.patch<Note>(`/notes/${id}`, { body: updates }),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: noteKeys.all(activeWorkspaceId) })
      }
    },
  })
}

export function useDeleteNote() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/notes/${id}`),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: noteKeys.all(activeWorkspaceId) })
      }
    },
  })
}
