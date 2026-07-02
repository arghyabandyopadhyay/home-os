import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import type { UserPreferences } from "@/types/user-preferences"

const api = createClientApiClient()

export const preferencesKeys = {
  all: (workspaceId: string) => ["preferences", workspaceId] as const,
}

export function usePreferences() {
  const { activeWorkspaceId } = useWorkspaceStore()

  return useQuery({
    queryKey: preferencesKeys.all(activeWorkspaceId ?? ""),
    queryFn: () => api.get<UserPreferences>("/preferences"),
    enabled: !!activeWorkspaceId,
  })
}

export function useUpdatePreferences() {
  const { activeWorkspaceId } = useWorkspaceStore()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Partial<UserPreferences>) =>
      api.patch<UserPreferences>("/preferences", { body: updates }),
    onSuccess: () => {
      if (activeWorkspaceId) {
        queryClient.invalidateQueries({ queryKey: preferencesKeys.all(activeWorkspaceId) })
      }
    },
  })
}
