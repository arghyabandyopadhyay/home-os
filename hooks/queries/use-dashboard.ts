import { useQuery } from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import type { TodayData } from "@/lib/dashboard"

const api = createClientApiClient()

export const dashboardKeys = {
  all: (workspaceId: string) => ["dashboard", workspaceId] as const,
}

export function useDashboard() {
  const { activeWorkspaceId } = useWorkspaceStore()

  return useQuery({
    queryKey: dashboardKeys.all(activeWorkspaceId ?? ""),
    queryFn: () => api.get<TodayData>("/dashboard"),
    enabled: !!activeWorkspaceId,
  })
}
