"use client"

import type { Workspace } from "@/types/workspace"
import { WorkspaceAvatar } from "@/components/workspace/workspace-avatar"
import { WorkspaceTypeBadge } from "@/components/workspace/workspace-type-badge"

type WorkspaceInfoProps = {
  workspace: Workspace
}

export function WorkspaceInfo({ workspace }: WorkspaceInfoProps) {
  const createdDate = new Date(workspace.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="card-app p-6 flex items-center gap-4">
      <WorkspaceAvatar workspace={workspace} size="lg" />
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-app">{workspace.name}</h2>
          <WorkspaceTypeBadge type={workspace.type} />
        </div>
        <p className="text-sm text-app-muted">Created {createdDate}</p>
      </div>
    </div>
  )
}
