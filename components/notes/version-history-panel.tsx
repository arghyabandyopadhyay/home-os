"use client"

import { useCallback, useEffect, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useLowPerformance } from "@/hooks/use-low-performance"
import { useRevisions } from "@/hooks/queries/use-revisions"
import { useVersionHistoryStore } from "@/hooks/use-version-history-store"
import { groupRevisions } from "@/lib/revisions/grouping"
import { DURATION, EASING } from "@/lib/motion"
import type { Revision, RevisionGroup } from "@/types/revision"

// ─── Types ───────────────────────────────────────────────────────────────────

type VersionHistoryPanelProps = {
  noteId: string
  isOpen: boolean
  onClose: () => void
  onPreview: (revisionId: string) => void
  onCompare: (oldRevisionId: string, newRevisionId: string) => void
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function RevisionSkeleton() {
  return (
    <div className="flex flex-col gap-3 p-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-2">
          <div className="h-3 w-24 rounded bg-app-elevated" />
          <div className="h-4 w-40 rounded bg-app-elevated" />
        </div>
      ))}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function VersionHistoryPanel({
  noteId,
  isOpen,
  onClose,
  onPreview,
  onCompare,
}: VersionHistoryPanelProps) {
  const prefersReducedMotion = useReducedMotion()
  const isLowPerf = useLowPerformance()
  const panelRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const { compareMode, selectedRevisionIds, expandedGroups, toggleGroup, selectForCompare } =
    useVersionHistoryStore()

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRevisions(noteId)

  // Flatten paginated revisions
  const allRevisions = useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.revisions)
  }, [data])

  // Total count from first page response
  const totalCount = data?.pages?.[0]?.total ?? 0

  // Group revisions
  const groupedItems = useMemo(() => {
    return groupRevisions(allRevisions)
  }, [allRevisions])

  // Animation config
  const shouldAnimate = !prefersReducedMotion && !isLowPerf
  const duration = shouldAnimate ? DURATION.normal : 0

  // ─── Focus management ────────────────────────────────────────────────────

  // Capture the trigger element on open
  useEffect(() => {
    if (isOpen) {
      triggerRef.current = document.activeElement as HTMLElement
    }
  }, [isOpen])

  // Focus panel heading when opened
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const heading = panelRef.current.querySelector<HTMLElement>("[data-panel-heading]")
      if (heading) {
        // Small delay to allow animation to start
        requestAnimationFrame(() => {
          heading.focus()
        })
      }
    }
  }, [isOpen])

  // Return focus to trigger on close
  const handleClose = useCallback(() => {
    onClose()
    // Return focus after panel exit animation
    requestAnimationFrame(() => {
      triggerRef.current?.focus()
    })
  }, [onClose])

  // ─── Keyboard: Escape to close ───────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, handleClose])

  // ─── Prevent body scroll when open on mobile ─────────────────────────────

  useEffect(() => {
    if (!isOpen) return

    const isMobile = window.matchMedia("(max-width: 767px)").matches
    if (isMobile) {
      document.body.style.overflow = "hidden"
      return () => {
        document.body.style.overflow = ""
      }
    }
  }, [isOpen])

  // ─── Infinite scroll ─────────────────────────────────────────────────────

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || !isOpen) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight

      if (distanceFromBottom < 100 && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    }

    container.addEventListener("scroll", handleScroll, { passive: true })
    return () => container.removeEventListener("scroll", handleScroll)
  }, [isOpen, hasNextPage, isFetchingNextPage, fetchNextPage])

  // ─── Backdrop click to close ─────────────────────────────────────────────

  const handleBackdropClick = useCallback(() => {
    handleClose()
  }, [handleClose])

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration }}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.aside
            ref={panelRef}
            role="complementary"
            aria-label="Version history"
            id="version-history-panel"
            tabIndex={-1}
            className={`fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-app outline-none md:w-[320px] ${
              isLowPerf ? "bg-app-surface" : "bg-app-surface/95 backdrop-blur-sm"
            }`}
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{
              duration,
              ease: shouldAnimate ? EASING.entrance : undefined,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-app px-4 py-3">
              <h2
                data-panel-heading
                tabIndex={-1}
                className="text-sm font-semibold text-app outline-none"
              >
                {isLoading ? "Version history" : `${totalCount} versions`}
              </h2>
              <button
                onClick={handleClose}
                aria-label="Close version history"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted hover:bg-app-elevated hover:text-app transition-colors"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {/* Content */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto"
            >
              {isLoading ? (
                <RevisionSkeleton />
              ) : (
                <RevisionList
                  items={groupedItems}
                  compareMode={compareMode}
                  selectedForCompare={selectedRevisionIds}
                  expandedGroups={expandedGroups}
                  onSelect={onPreview}
                  onCompareSelect={selectForCompare}
                  onToggleGroup={toggleGroup}
                  onCompare={onCompare}
                />
              )}

              {isFetchingNextPage && (
                <div className="flex justify-center py-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-app-elevated border-t-app" />
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── RevisionList (inline until separate component is created) ──────────────

type RevisionListInternalProps = {
  items: (Revision | RevisionGroup)[]
  compareMode: boolean
  selectedForCompare: string[]
  expandedGroups: Set<string>
  onSelect: (revisionId: string) => void
  onCompareSelect: (revisionId: string) => void
  onToggleGroup: (groupId: string) => void
  onCompare: (oldRevisionId: string, newRevisionId: string) => void
}

function isRevisionGroup(item: Revision | RevisionGroup): item is RevisionGroup {
  return "revisions" in item && Array.isArray((item as RevisionGroup).revisions)
}

function RevisionList({
  items,
  compareMode,
  selectedForCompare,
  expandedGroups,
  onSelect,
  onCompareSelect,
  onToggleGroup,
}: RevisionListInternalProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
        <p className="text-sm text-app-muted">No versions yet</p>
      </div>
    )
  }

  return (
    <div
      role="listbox"
      aria-label="Note revisions"
      className="flex flex-col"
    >
      {items.map((item) => {
        if (isRevisionGroup(item)) {
          const isExpanded = expandedGroups.has(item.id)
          return (
            <div key={item.id}>
              <button
                aria-expanded={isExpanded}
                aria-label={`${item.count} edits group, ${isExpanded ? "collapse" : "expand"}`}
                onClick={() => onToggleGroup(item.id)}
                className="item-app flex w-full items-center gap-2 px-4 py-3 text-left"
              >
                <span className="text-xs text-app-muted">
                  {formatRelativeTime(item.startTime)} – {formatRelativeTime(item.endTime)}
                </span>
                <span className="ml-auto rounded-full bg-app-elevated px-2 py-0.5 text-xs text-app-muted">
                  {item.count} edits
                </span>
              </button>
              {isExpanded &&
                item.revisions.map((rev) => (
                  <RevisionItemInline
                    key={rev.id}
                    revision={rev}
                    compareMode={compareMode}
                    isChecked={selectedForCompare.includes(rev.id)}
                    onSelect={() => onSelect(rev.id)}
                    onCompareCheck={() => onCompareSelect(rev.id)}
                    indented
                  />
                ))}
            </div>
          )
        }

        return (
          <RevisionItemInline
            key={item.id}
            revision={item}
            compareMode={compareMode}
            isChecked={selectedForCompare.includes(item.id)}
            onSelect={() => onSelect(item.id)}
            onCompareCheck={() => onCompareSelect(item.id)}
            indented={false}
          />
        )
      })}
    </div>
  )
}

// ─── Inline RevisionItem (placeholder until separate component) ─────────────

type RevisionItemInlineProps = {
  revision: Revision
  compareMode: boolean
  isChecked: boolean
  onSelect: () => void
  onCompareCheck: () => void
  indented: boolean
}

function RevisionItemInline({
  revision,
  compareMode,
  isChecked,
  onSelect,
  onCompareCheck,
  indented,
}: RevisionItemInlineProps) {
  const labelText = getLabelText(revision.label)

  return (
    <div
      role="option"
      aria-selected={false}
      onClick={compareMode ? onCompareCheck : onSelect}
      className={`item-app flex cursor-pointer items-center gap-3 px-4 py-3 ${indented ? "pl-8" : ""}`}
    >
      {compareMode && (
        <input
          type="checkbox"
          checked={isChecked}
          onChange={onCompareCheck}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 rounded border-app"
          aria-label={`Select revision from ${formatRelativeTime(revision.createdAt)} for comparison`}
        />
      )}
      <div className="flex flex-1 flex-col gap-0.5">
        <span className="text-xs text-app-muted">
          {formatRelativeTime(revision.createdAt)}
        </span>
        <span className="text-sm text-app">
          {revision.authorName}
          <span className="ml-2 text-xs text-app-muted">{labelText}</span>
        </span>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLabelText(label: Revision["label"]): string {
  switch (label) {
    case "auto-saved":
      return "Auto-saved"
    case "manual-save":
      return "Manual save"
    case "restored":
      return "Restored"
    case "initial":
      return "Initial"
    default:
      return ""
  }
}

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
