"use client"

import { Trash2 } from "lucide-react"
import { toast } from "sonner"

export function DeleteNoteButton({
  onDelete,
}: {
  onDelete: () => Promise<void>
}) {
  async function handleDelete() {
    const confirmed = confirm(
      "Delete this note?"
    )

    if (!confirmed) return

    await onDelete()

    toast.success("Note deleted")
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-lg border border-app p-2 text-app-muted transition hover:bg-app-elevated hover:text-app"
    >
      <Trash2 size={16} />
    </button>
  )
}