"use client"

import { useState } from "react"
import { toast } from "sonner"
import type { WorkspaceMember } from "@/types/workspace"
import { useRemoveMember } from "@/hooks/queries/use-workspaces"
import { MemberRoleDropdown } from "@/components/workspace/settings/member-role-dropdown"

type MemberListProps = {
  members: WorkspaceMember[]
  workspaceId: string
  isOwner: boolean
}

export function MemberList({ members, workspaceId, isOwner }: MemberListProps) {
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const removeMember = useRemoveMember(workspaceId)

  function handleRemove(memberId: string) {
    removeMember.mutate(memberId, {
      onSuccess: () => {
        toast.success("Member removed")
        setConfirmRemoveId(null)
      },
      onError: () => {
        toast.error("Failed to remove member")
        setConfirmRemoveId(null)
      },
    })
  }

  return (
    <div className="card-app p-6">
      <h3 className="text-sm font-semibold text-app mb-4">Members</h3>
      {members.length === 0 ? (
        <p className="text-sm text-app-muted">No members yet</p>
      ) : (
        <ul className="space-y-3" role="list" aria-label="Workspace members">
          {members.map((member) => (
            <li key={member.id} className="item-app p-3 flex items-center gap-3">
              <MemberAvatar name={member.name} avatarUrl={member.avatarUrl} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-app truncate">{member.name}</p>
                <p className="text-xs text-app-muted truncate">{member.email}</p>
              </div>

              {isOwner && member.role !== "owner" ? (
                <div className="flex items-center gap-2">
                  <MemberRoleDropdown
                    workspaceId={workspaceId}
                    memberId={member.id}
                    currentRole={member.role}
                  />
                  {confirmRemoveId === member.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleRemove(member.id)}
                        disabled={removeMember.isPending}
                        className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded bg-red-500/10"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(null)}
                        className="text-xs text-app-muted hover:text-app px-2 py-1"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveId(member.id)}
                      className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-500/10"
                      aria-label={`Remove ${member.name}`}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-xs text-app-muted capitalize">{member.role}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function MemberAvatar({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="w-8 h-8 rounded-full object-cover shrink-0"
        aria-hidden="true"
      />
    )
  }

  return (
    <div
      className="w-8 h-8 rounded-full bg-app-elevated flex items-center justify-center shrink-0"
      aria-hidden="true"
    >
      <span className="text-xs font-semibold text-app-muted">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  )
}
