import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import type { Contact } from "@/types/contact"

const api = createClientApiClient()

export const contactKeys = {
  all: (workspaceId: string) => ["contacts", workspaceId] as const,
  detail: (workspaceId: string, id: string) => ["contacts", workspaceId, id] as const,
  googleConnection: (workspaceId: string) => ["contacts", workspaceId, "google-connection"] as const,
}

export function useContacts() {
  const { activeWorkspaceId } = useWorkspaceStore()

  return useQuery({
    queryKey: contactKeys.all(activeWorkspaceId ?? ""),
    queryFn: () => api.get<Contact[]>("/contacts"),
    enabled: !!activeWorkspaceId,
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()

  return useMutation({
    mutationFn: (input: Partial<Contact>) =>
      api.post<Contact>("/contacts", { body: input }),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: contactKeys.all(activeWorkspaceId) })
      }
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Contact>) =>
      api.patch<Contact>(`/contacts/${id}`, { body: updates }),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: contactKeys.all(activeWorkspaceId) })
      }
    },
  })
}

export function useDeleteContact() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/contacts/${id}`),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: contactKeys.all(activeWorkspaceId) })
      }
    },
  })
}

export function useConnectGoogleContacts() {
  return useMutation({
    mutationFn: () => api.post<{ url: string }>("/contacts/google/connect"),
  })
}

export function useSyncGoogleContacts() {
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()

  return useMutation({
    mutationFn: () =>
      api.post<{ imported?: number; updated?: number }>("/contacts/google/sync"),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: contactKeys.all(activeWorkspaceId) })
      }
    },
  })
}
