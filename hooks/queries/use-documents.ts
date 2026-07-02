import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import type { Document } from "@/types/document"

const api = createClientApiClient()

export const documentKeys = {
  all: (workspaceId: string) => ["documents", workspaceId] as const,
  detail: (workspaceId: string, id: string) => ["documents", workspaceId, id] as const,
}

export function useDocuments() {
  const { activeWorkspaceId } = useWorkspaceStore()

  return useQuery({
    queryKey: documentKeys.all(activeWorkspaceId ?? ""),
    queryFn: () => api.get<Document[]>("/documents"),
    enabled: !!activeWorkspaceId,
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()

  return useMutation({
    mutationFn: (input: { title: string; filePath: string; fileSize: number | null }) =>
      api.post<Document>("/documents", { body: input, timeout: 120_000 }),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: documentKeys.all(activeWorkspaceId) })
      }
    },
  })
}

export function useUpdateDocument() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string; title?: string; tags?: string[] }) =>
      api.patch<Document>(`/documents/${id}`, { body: updates }),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: documentKeys.all(activeWorkspaceId) })
      }
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/documents/${id}`),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: documentKeys.all(activeWorkspaceId) })
      }
    },
  })
}

export function useRetryDocumentProcessing() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()

  return useMutation({
    mutationFn: (id: string) =>
      api.post<Document>(`/documents/${id}/retry`),
    onMutate: async (id) => {
      const queryKey = documentKeys.all(activeWorkspaceId ?? "")
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<Document[]>(queryKey)

      queryClient.setQueryData<Document[]>(queryKey, (old) =>
        old?.map((doc) =>
          doc.id === id
            ? { ...doc, processing: { ...doc.processing, status: "pending" as const, failed_stage: null, error_message: null } }
            : doc
        ) ?? []
      )

      return { previous }
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(documentKeys.all(activeWorkspaceId ?? ""), context.previous)
      }
    },
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: documentKeys.all(activeWorkspaceId) })
      }
    },
  })
}
