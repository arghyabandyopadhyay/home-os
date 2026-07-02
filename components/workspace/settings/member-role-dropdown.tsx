"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { useUpdateMemberRole } from "@/hooks/queries/use-workspaces"
import type { WorkspaceRole } from "@/types/workspace"

type MemberRoleDropdownProps = {
  memberId: string
  workspaceId: string
  currentRole: WorkspaceRole
}

const ASSIGNABLE_ROLES: { value: WorkspaceRole; label: string }[] = [
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
]

export function MemberRoleDropdown({
  memberId,
  workspaceId,
  currentRole,
}: MemberRoleDropdownProps) {
  const [optimisticRole, setOptimisticRole] = useState<WorkspaceRole>(currentRole)
  const updateRole = useUpdateMemberRole(workspaceId)

  async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newRole = e.target.value as WorkspaceRole
    if (newRole === optimisticRole) return

    const previousRole = optimisticRole

    // Optimistic update
    setOptimisticRole(newRole)

    try {
      await updateRole.mutateAsync({ memberId, role: newRole })
    } catch {
      // Revert on failure
      setOptimisticRole(previousRole)
      toast.error("Failed to update member role. Please try again.")
    }
  }

  return (
    <div className="relative inline-flex">
      <select
        value={optimisticRole}
        onChange={handleRoleChange}
        disabled={updateRole.isPending}
        className="input-app appearance-none pr-7 pl-3 py-1.5 text-xs rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Change member role"
      >
        {ASSIGNABLE_ROLES.map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-app-muted"
        aria-hidden="true"
      />
    </div>
  )
}
