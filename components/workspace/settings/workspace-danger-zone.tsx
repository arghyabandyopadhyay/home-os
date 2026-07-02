"use client"

import { useState, useCallback } from "react"
import { Loader2, LogOut, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { AppModal } from "@/components/shared/app-modal"
import {
  useLeaveWorkspace,
  useDeleteWorkspace,
} from "@/hooks/queries/use-workspaces"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import type { Workspace } from "@/types/workspace"

type WorkspaceDangerZoneProps = {
  workspace: Workspace
  isOwner: boolean
}

export function WorkspaceDangerZone({ workspace, isOwner }: WorkspaceDangerZoneProps) {
  const isPersonal = workspace.type === "personal"

  // Neither action available on personal workspace
  if (isPersonal) return null

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-red-500">Danger zone</h3>
      <div className="space-y-3 rounded-xl border border-red-500/20 p-4">
        {/* Leave workspace — visible to member/viewer only */}
        {!isOwner && (
          <LeaveWorkspaceAction workspace={workspace} />
        )}

        {/* Delete workspace — visible to owner only */}
        {isOwner && (
          <DeleteWorkspaceAction workspace={workspace} />
        )}
      </div>
    </div>
  )
}

// ─── Leave Workspace ─────────────────────────────────────────────────────────

function LeaveWorkspaceAction({ workspace }: { workspace: Workspace }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const leaveWorkspace = useLeaveWorkspace(workspace.id)
  const { removeWorkspace } = useWorkspaceStore()

  const handleLeave = useCallback(async () => {
    try {
      await leaveWorkspace.mutateAsync()
      removeWorkspace(workspace.id)
      setShowConfirm(false)
      toast.success("You have left the workspace")
    } catch {
      toast.error("Failed to leave workspace. Please try again.")
    }
  }, [leaveWorkspace, removeWorkspace, workspace.id])

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-app">Leave workspace</p>
          <p className="text-xs text-app-muted">
            You will lose access to all data in this workspace.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
        >
          <LogOut size={14} aria-hidden="true" />
          Leave
        </button>
      </div>

      <AppModal open={showConfirm} onOpenChange={setShowConfirm} size="sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-app">Leave workspace</h2>
            <p className="text-sm text-app-muted mt-1">
              Are you sure you want to leave <strong>{workspace.name}</strong>? You will lose access
              to all shared data.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowConfirm(false)}
              disabled={leaveWorkspace.isPending}
              className="rounded-lg px-4 py-2 text-sm text-app-muted hover:bg-app-elevated hover:text-app transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLeave}
              disabled={leaveWorkspace.isPending}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {leaveWorkspace.isPending && (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              )}
              {leaveWorkspace.isPending ? "Leaving…" : "Leave workspace"}
            </button>
          </div>
        </div>
      </AppModal>
    </>
  )
}

// ─── Delete Workspace ────────────────────────────────────────────────────────

function DeleteWorkspaceAction({ workspace }: { workspace: Workspace }) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [nameInput, setNameInput] = useState("")
  const deleteWorkspace = useDeleteWorkspace(workspace.id)
  const { removeWorkspace } = useWorkspaceStore()

  const nameMatches = nameInput.trim() === workspace.name

  const handleDelete = useCallback(async () => {
    if (!nameMatches) return

    try {
      await deleteWorkspace.mutateAsync()
      removeWorkspace(workspace.id)
      setShowConfirm(false)
      toast.success("Workspace deleted")
    } catch {
      toast.error("Failed to delete workspace. Please try again.")
    }
  }, [deleteWorkspace, removeWorkspace, workspace.id, nameMatches])

  const handleOpenChange = useCallback((open: boolean) => {
    setShowConfirm(open)
    if (!open) setNameInput("")
  }, [])

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-app">Delete workspace</p>
          <p className="text-xs text-app-muted">
            Permanently delete this workspace and all its data.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-500 hover:bg-red-500/20 transition-colors"
        >
          <Trash2 size={14} aria-hidden="true" />
          Delete
        </button>
      </div>

      <AppModal open={showConfirm} onOpenChange={handleOpenChange} size="sm">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-red-500">Delete workspace</h2>
            <p className="text-sm text-app-muted mt-1">
              This action is <strong>permanent and irreversible</strong>. All data in{" "}
              <strong>{workspace.name}</strong> will be deleted for all members.
            </p>
          </div>

          <div>
            <label
              htmlFor="delete-confirm-name"
              className="block text-sm text-app mb-1.5"
            >
              Type <strong>{workspace.name}</strong> to confirm
            </label>
            <input
              id="delete-confirm-name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={workspace.name}
              className="input-app w-full"
              autoComplete="off"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={deleteWorkspace.isPending}
              className="rounded-lg px-4 py-2 text-sm text-app-muted hover:bg-app-elevated hover:text-app transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!nameMatches || deleteWorkspace.isPending}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteWorkspace.isPending && (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              )}
              {deleteWorkspace.isPending ? "Deleting…" : "Delete workspace"}
            </button>
          </div>
        </div>
      </AppModal>
    </>
  )
}
