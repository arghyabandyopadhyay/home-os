"use client"

import { useWorkspaceStore } from "@/hooks/use-workspace-store"

export function useWorkspacePermissions() {
  const { activeRole } = useWorkspaceStore()

  return {
    canCreate: activeRole === "owner" || activeRole === "member",
    canEdit: activeRole === "owner" || activeRole === "member",
    canDelete: activeRole === "owner" || activeRole === "member",
    canManageMembers: activeRole === "owner",
    canManageWorkspace: activeRole === "owner",
    isReadOnly: activeRole === "viewer",
  }
}
