"use client"

import { ChevronRight } from "lucide-react"

import { useVersionHistoryStore } from "@/hooks/use-version-history-store"
import type { RevisionGroup } from "@/types/revision"

import { RevisionItem } from "@/components/notes/revision-item"

type RevisionGroupItemProps = {
  group: RevisionGroup
  isSelected: boolean
  compareMode: boolean
  selectedForCompare: string[]
  selectedId?: string | null
  onSelect: (revisionId: string) => void
  onCompareSelect: (revisionId: string) => void
  onToggleGroup: () => void
}

export function RevisionGroupItem({
  group,
  compareMode,
  selectedForCompare,
  onSelect,
  onCompareSelect,
  onToggleGroup,
}: RevisionGroupItemProps) {
  const expandedGroups = useVersionHistoryStore((state) => state.expandedGroups)
  const isExpanded = expandedGroups.has(group.id)

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault()
      onToggleGroup()
    }
    if (event.key === "ArrowRight" && isExpanded) {
      event.preventDefault()
      // Move focus to first child revision item
      const container = event.currentTarget.parentElement
      const firstChild = container?.querySelector<HTMLElement>("[data-group-child]")
      firstChild?.focus()
    }
  }

  return (
    <div>
      <button
        aria-expanded={isExpanded}
        aria-label={`${group.revisions.length} edits group, ${isExpanded ? "collapse" : "expand"}`}
        onClick={onToggleGroup}
        onKeyDown={handleKeyDown}
        className="item-app flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <ChevronRight
          className={`h-3.5 w-3.5 text-app-muted transition-transform duration-150 ${
            isExpanded ? "rotate-90" : ""
          }`}
          aria-hidden="true"
        />
        <span className="text-xs text-app-muted">
          {formatRelativeTime(group.startTime)} – {formatRelativeTime(group.endTime)}
        </span>
        <span className="text-sm text-app-muted">{group.authorName}</span>
        <span className="ml-auto rounded-full bg-app-elevated px-2 py-0.5 text-xs text-app-muted">
          {group.count} {group.count === 1 ? "edit" : "edits"}
        </span>
      </button>

      {isExpanded && (
        <div className="pl-6">
          {group.revisions.map((revision) => (
            <div key={revision.id} data-group-child tabIndex={-1}>
              <RevisionItem
                revision={revision}
                isSelected={false}
                compareMode={compareMode}
                isChecked={selectedForCompare.includes(revision.id)}
                onSelect={() => onSelect(revision.id)}
                onCompareCheck={() => onCompareSelect(revision.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return "just now"
  if (diffMinutes < 60) return `${diffMinutes} min ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}
