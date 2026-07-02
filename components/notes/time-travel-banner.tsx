"use client"

import { Loader2 } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type TimeTravelBannerProps = {
  timestamp: string
  onBackToCurrent: () => void
  onRestore: () => void
  restoring: boolean
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

export function TimeTravelBanner({
  timestamp,
  onBackToCurrent,
  onRestore,
  restoring,
}: TimeTravelBannerProps) {
  return (
    <div className="flex items-center justify-between border border-app bg-app-elevated rounded-xl px-4 py-3">
      <p className="text-sm text-app">
        Viewing version from{" "}
        <span className="font-semibold">{formatRelativeTime(timestamp)}</span>
      </p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onBackToCurrent}
          className="rounded-lg px-3 py-1.5 text-sm text-app-muted hover:bg-app-elevated hover:text-app transition-colors"
        >
          Back to current
        </button>

        <button
          type="button"
          onClick={onRestore}
          disabled={restoring}
          className="btn-primary-app flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {restoring && (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          )}
          Restore this version
        </button>
      </div>
    </div>
  )
}
