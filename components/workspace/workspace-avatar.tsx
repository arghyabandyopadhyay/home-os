"use client"

import { Home, Users } from "lucide-react"
import type { Workspace, WorkspaceType } from "@/types/workspace"

type WorkspaceAvatarProps = {
  workspace: Pick<Workspace, "id" | "name" | "type">
  size?: "sm" | "md" | "lg"
}

const sizeConfig = {
  sm: { container: 24, iconSize: 14, textClass: "text-xs" },
  md: { container: 32, iconSize: 16, textClass: "text-sm" },
  lg: { container: 40, iconSize: 20, textClass: "text-base" },
} as const

/**
 * Generates a deterministic numeric hash from a string using the djb2 algorithm.
 */
function hashString(str: string): number {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i)
  }
  return hash >>> 0 // Convert to unsigned 32-bit integer
}

/**
 * Generates a deterministic HSL color from a workspace ID.
 * Uses the workspace ID hash to produce a consistent hue value.
 */
export function generateWorkspaceColor(workspaceId: string): string {
  const hue = hashString(workspaceId) % 360
  return `hsl(${hue}, 60%, 45%)`
}

export function WorkspaceAvatar({ workspace, size = "md" }: WorkspaceAvatarProps) {
  const { container, iconSize, textClass } = sizeConfig[size]
  const backgroundColor = generateWorkspaceColor(workspace.id)

  return (
    <div
      className="rounded-full flex items-center justify-center shrink-0"
      style={{
        width: container,
        height: container,
        backgroundColor,
      }}
      aria-hidden="true"
    >
      <AvatarContent
        type={workspace.type}
        name={workspace.name}
        iconSize={iconSize}
        textClass={textClass}
      />
    </div>
  )
}

function AvatarContent({
  type,
  name,
  iconSize,
  textClass,
}: {
  type: WorkspaceType
  name: string
  iconSize: number
  textClass: string
}) {
  switch (type) {
    case "family":
      return <Home size={iconSize} className="text-white" aria-hidden="true" />
    case "shared":
      return <Users size={iconSize} className="text-white" aria-hidden="true" />
    case "personal":
    default:
      return (
        <span className={`font-semibold text-white leading-none ${textClass}`}>
          {name.charAt(0).toUpperCase()}
        </span>
      )
  }
}
