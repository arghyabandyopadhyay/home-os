import { useWorkspaceStore } from "@/hooks/use-workspace-store"

export function getWorkspaceHeaders(): Record<string, string> {
  const { activeWorkspaceId } = useWorkspaceStore.getState()
  if (!activeWorkspaceId) return {}
  return { "X-Workspace-Id": activeWorkspaceId }
}
