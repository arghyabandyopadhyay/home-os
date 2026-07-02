"use client"

import type { Revision, RevisionLabel } from "@/types/revision"

type RevisionItemProps = {
  revision: Revision
  isSelected: boolean
  compareMode: boolean
  isChecked: boolean
  onSelect: () => void
  onCompareCheck: () => void
}

/**
 * Formats an ISO 8601 timestamp into a human-readable relative string.
 * e.g., "just now", "2 min ago", "3 hours ago", "Mar 5"
 */
function formatRelativeTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return "just now"
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? "hour" : "hours"} ago`
  if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? "day" : "days"} ago`

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

/**
 * Returns the display text and style class for a revision label badge.
 */
function getLabelBadge(label: RevisionLabel): { text: string; className: string } {
  switch (label) {
    case "auto-saved":
      return {
        text: "Auto-saved",
        className: "text-xs px-1.5 py-0.5 rounded-md bg-app-elevated text-app-muted",
      }
    case "manual-save":
      return {
        text: "Manual save",
        className: "text-xs px-1.5 py-0.5 rounded-md bg-app-elevated text-app",
      }
    case "restored":
      return {
        text: "Restored",
        className:
          "text-xs px-1.5 py-0.5 rounded-md bg-app-elevated text-app font-medium border border-app",
      }
    case "initial":
      return {
        text: "Initial",
        className: "text-xs px-1.5 py-0.5 rounded-md bg-app-elevated text-app-muted",
      }
  }
}

/**
 * Individual revision entry in the version history list.
 * Displays relative timestamp, author name, and label badge.
 * Supports compare mode with checkbox selection.
 */
export function RevisionItem({
  revision,
  isSelected,
  compareMode,
  isChecked,
  onSelect,
  onCompareCheck,
}: RevisionItemProps) {
  const badge = getLabelBadge(revision.label)
  const relativeTime = formatRelativeTime(revision.createdAt)

  const handleClick = () => {
    if (compareMode) {
      onCompareCheck()
    } else {
      onSelect()
    }
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    onCompareCheck()
  }

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === " " && compareMode) {
          e.preventDefault()
          onCompareCheck()
        }
      }}
      className={`item-app px-4 py-3 cursor-pointer ${isSelected ? "bg-app-elevated" : ""}`}
    >
      <div className="flex items-center gap-2">
        {compareMode && (
          <input
            type="checkbox"
            checked={isChecked}
            onChange={handleCheckboxChange}
            aria-label={`Select revision from ${relativeTime} for comparison`}
            className="h-4 w-4 shrink-0 rounded border-app accent-current"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-app truncate">{relativeTime}</span>
            <span className={badge.className}>{badge.text}</span>
          </div>
          <p className="text-xs text-app-muted mt-0.5 truncate">{revision.authorName}</p>
        </div>
      </div>
    </div>
  )
}
