"use client"

import type { WorkspaceType } from "@/types/workspace"

type WorkspaceTypeBadgeProps = {
  type: WorkspaceType
}

const typeLabels: Record<WorkspaceType, string> = {
  personal: "Personal",
  family: "Family",
  shared: "Shared",
}

export function WorkspaceTypeBadge({ type }: WorkspaceTypeBadgeProps) {
  return (
    <span className="text-xs text-app-muted bg-app-elevated rounded-md px-1.5 py-0.5">
      {typeLabels[type]}
    </span>
  )
}
