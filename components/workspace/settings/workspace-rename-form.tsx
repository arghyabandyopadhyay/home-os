"use client"

import { useState } from "react"
import { toast } from "sonner"
import { useUpdateWorkspace } from "@/hooks/queries/use-workspaces"

type WorkspaceRenameFormProps = {
  workspaceId: string
  currentName: string
}

export function WorkspaceRenameForm({ workspaceId, currentName }: WorkspaceRenameFormProps) {
  const [name, setName] = useState(currentName)
  const updateWorkspace = useUpdateWorkspace(workspaceId)

  const isValid = name.trim().length >= 1 && name.trim().length <= 50
  const hasChanged = name.trim() !== currentName

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!isValid || !hasChanged) return

    updateWorkspace.mutate(
      { name: name.trim() },
      {
        onSuccess: () => {
          toast.success("Workspace renamed successfully")
        },
        onError: () => {
          toast.error("Failed to rename workspace")
        },
      }
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card-app p-6">
      <h3 className="text-sm font-semibold text-app mb-3">Rename Workspace</h3>
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          className="input-app flex-1"
          placeholder="Workspace name"
          aria-label="Workspace name"
        />
        <button
          type="submit"
          disabled={!isValid || !hasChanged || updateWorkspace.isPending}
          className="btn-primary-app px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {updateWorkspace.isPending ? "Saving..." : "Save"}
        </button>
      </div>
      {name.trim().length === 0 && (
        <p className="text-xs text-red-500 mt-1">Name is required</p>
      )}
      {name.trim().length > 50 && (
        <p className="text-xs text-red-500 mt-1">Name must be 50 characters or less</p>
      )}
    </form>
  )
}
