"use client"

import { Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { useCancelInvitation } from "@/hooks/queries/use-invitations"
import type { WorkspaceInvitee } from "@/types/workspace"

type PendingInviteeListProps = {
  invitees: WorkspaceInvitee[]
  workspaceId: string
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function capitalizeRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1)
}

export function PendingInviteeList({
  invitees,
  workspaceId,
}: PendingInviteeListProps) {
  const cancelInvitation = useCancelInvitation(workspaceId)

  const pendingInvitees = invitees.filter((inv) => inv.status === "pending")

  if (pendingInvitees.length === 0) {
    return null
  }

  function handleCancel(inviteeId: string) {
    cancelInvitation.mutate(inviteeId, {
      onSuccess: () => {
        toast.success("Invitation cancelled")
      },
      onError: () => {
        toast.error("Failed to cancel invitation")
      },
    })
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-app-muted">Pending invitations</h4>
      <ul className="space-y-2" aria-label="Pending invitations">
        {pendingInvitees.map((invitee) => (
          <li
            key={invitee.id}
            className="flex items-center justify-between px-4 py-3 rounded-xl bg-app-elevated"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm text-app truncate">{invitee.email}</p>
              <p className="text-xs text-app-muted">
                {capitalizeRole(invitee.role)} · Invited {formatDate(invitee.invitedAt)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleCancel(invitee.id)}
              disabled={cancelInvitation.isPending}
              className="shrink-0 ml-3 flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs text-app-muted hover:text-red-500 hover:bg-app-surface transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={`Cancel invitation for ${invitee.email}`}
            >
              {cancelInvitation.isPending ? (
                <Loader2 size={12} className="animate-spin" aria-hidden="true" />
              ) : (
                <X size={12} aria-hidden="true" />
              )}
              Cancel
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
