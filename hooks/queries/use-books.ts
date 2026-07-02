import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import type { Book } from "@/types/book"
import type { GoogleBookResult } from "@/lib/google-books"

const api = createClientApiClient()

export const bookKeys = {
  all: (workspaceId: string) => ["books", workspaceId] as const,
  detail: (workspaceId: string, id: string) =>
    [...bookKeys.all(workspaceId), id] as const,
  search: (workspaceId: string, query: string) =>
    [...bookKeys.all(workspaceId), "search", query] as const,
}

export function useBooks() {
  const { activeWorkspaceId } = useWorkspaceStore()

  return useQuery({
    queryKey: bookKeys.all(activeWorkspaceId ?? ""),
    queryFn: () => api.get<Book[]>("/library"),
    enabled: !!activeWorkspaceId,
  })
}

export function useBook(id: string) {
  const { activeWorkspaceId } = useWorkspaceStore()

  return useQuery({
    queryKey: bookKeys.detail(activeWorkspaceId ?? "", id),
    queryFn: () => api.get<Book>(`/library/${id}`),
    enabled: !!activeWorkspaceId && !!id,
  })
}

export function useAddBook() {
  const { activeWorkspaceId } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: Partial<Book>) =>
      api.post<Book>("/library", { body: input }),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: bookKeys.all(activeWorkspaceId) })
      }
    },
  })
}

export function useUpdateBook() {
  const { activeWorkspaceId } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Book>) =>
      api.patch<Book>(`/library/${id}`, { body: updates }),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: bookKeys.all(activeWorkspaceId) })
      }
    },
  })
}

export function useRemoveBook() {
  const { activeWorkspaceId } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/library/${id}`),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: bookKeys.all(activeWorkspaceId) })
      }
    },
  })
}

export function useSearchBooks(query: string) {
  const { activeWorkspaceId } = useWorkspaceStore()

  return useQuery({
    queryKey: bookKeys.search(activeWorkspaceId ?? "", query),
    queryFn: () =>
      api.get<GoogleBookResult | null>("/library/search", {
        params: { q: query },
      }),
    enabled: !!activeWorkspaceId && query.length > 0,
  })
}
