"use client"

import { Loader2 } from "lucide-react"
import { AppModal } from "@/components/shared/app-modal"

// ─── Types ───────────────────────────────────────────────────────────────────

type RestoreConfirmDialogProps = {
  open: boolean
  timestamp: string
  onConfirm: () => void
  onCancel: () => void
  loading: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RestoreConfirmDialog({
  open,
  timestamp,
  onConfirm,
  onCancel,
  loading,
}: RestoreConfirmDialogProps) {
  return (
    <AppModal open={open} onOpenChange={(isOpen) => !isOpen && onCancel()} size="sm">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-app">Restore version</h2>

        <p className="text-sm text-app-muted leading-relaxed">
          Restore to version from{" "}
          <span className="font-semibold text-app">
            {formatRelativeTime(timestamp)}
          </span>
          ? This will create a new version with the restored content. Your current
          content will still be available in version history.
        </p>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm text-app-muted hover:bg-app-elevated hover:text-app transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn-primary-app flex items-center gap-2 rounded-lg px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && (
              <Loader2 size={14} className="animate-spin" aria-hidden="true" />
            )}
            Restore
          </button>
        </div>
      </div>
    </AppModal>
  )
}
