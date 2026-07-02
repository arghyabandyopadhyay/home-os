"use client"

import { useQuery } from "@tanstack/react-query"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import { useWorkspaceMembers, workspaceKeys } from "@/hooks/queries/use-workspaces"
import { createClientApiClient } from "@/lib/api-client"
import type { WorkspaceInvitee } from "@/types/workspace"
import { WorkspaceInfo } from "@/components/workspace/settings/workspace-info"
import { WorkspaceRenameForm } from "@/components/workspace/settings/workspace-rename-form"
import { MemberList } from "@/components/workspace/settings/member-list"
import { InviteMemberForm } from "@/components/workspace/settings/invite-member-form"
import { PendingInviteeList } from "@/components/workspace/settings/pending-invitee-list"
import { WorkspaceDangerZone } from "@/components/workspace/settings/workspace-danger-zone"

const api = createClientApiClient()

export function WorkspaceSettingsView() {
  const { activeWorkspace } = useWorkspaceStore()
  const { canManageWorkspace } = useWorkspacePermissions()

  const workspaceId = activeWorkspace?.id ?? ""

  const { data: members = [] } = useWorkspaceMembers(workspaceId)

  const { data: invitees = [] } = useQuery({
    queryKey: workspaceKeys.invitees(workspaceId),
    queryFn: () =>
      api.get<WorkspaceInvitee[]>(`/workspaces/${workspaceId}/invitations`),
    enabled: !!workspaceId && canManageWorkspace,
  })

  if (!activeWorkspace) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <p className="text-app-muted">No active workspace selected.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-app">Workspace Settings</h1>

      <WorkspaceInfo workspace={activeWorkspace} />

      {canManageWorkspace && (
        <WorkspaceRenameForm
          workspaceId={activeWorkspace.id}
          currentName={activeWorkspace.name}
        />
      )}

      <MemberList
        members={members}
        workspaceId={activeWorkspace.id}
        isOwner={canManageWorkspace}
      />

      {canManageWorkspace && (
        <InviteMemberForm workspaceId={activeWorkspace.id} />
      )}

      {canManageWorkspace && (
        <PendingInviteeList
          workspaceId={activeWorkspace.id}
          invitees={invitees}
        />
      )}

      <WorkspaceDangerZone
        workspace={activeWorkspace}
        isOwner={canManageWorkspace}
      />
    </div>
  )
}
