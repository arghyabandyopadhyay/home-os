"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"

import type { DiffChange, Revision } from "@/types/revision"
import { computeWordDiff, extractTextFromProseMirror } from "@/lib/revisions/diff"

// ─── Types ───────────────────────────────────────────────────────────────────

type DiffViewProps = {
  oldRevision: Revision
  newRevision: Revision
  onClose: () => void
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLLAPSE_THRESHOLD = 20

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

/**
 * Split diff changes into lines for collapse logic.
 * Each line group has a type and an array of DiffChange segments.
 */
type DiffLine = {
  type: "addition" | "deletion" | "unchanged"
  segments: DiffChange[]
}

function splitIntoLines(changes: DiffChange[]): DiffLine[] {
  const lines: DiffLine[] = []

  for (const change of changes) {
    const parts = change.value.split("\n")

    for (let i = 0; i < parts.length; i++) {
      const value = parts[i]

      // A newline split produces an empty string for the linebreak itself
      if (i > 0) {
        // Start a new line
        lines.push({ type: change.type, segments: [{ type: change.type, value }] })
      } else if (lines.length === 0) {
        lines.push({ type: change.type, segments: [{ type: change.type, value }] })
      } else {
        // Append to current line
        const currentLine = lines[lines.length - 1]
        currentLine.segments.push({ type: change.type, value })
        // If this line has mixed types, mark as unchanged (for collapse purposes we use most specific)
        if (currentLine.type === "unchanged" && change.type !== "unchanged") {
          currentLine.type = change.type
        } else if (currentLine.type !== change.type && change.type !== "unchanged") {
          currentLine.type = change.type
        }
      }
    }
  }

  return lines
}

type DiffSection = {
  type: "visible" | "collapsed"
  lines: DiffLine[]
  hiddenCount?: number
}

function buildSections(lines: DiffLine[]): DiffSection[] {
  const sections: DiffSection[] = []
  let unchangedBuffer: DiffLine[] = []

  const flushUnchanged = () => {
    if (unchangedBuffer.length > COLLAPSE_THRESHOLD) {
      sections.push({ type: "collapsed", lines: unchangedBuffer, hiddenCount: unchangedBuffer.length })
    } else if (unchangedBuffer.length > 0) {
      sections.push({ type: "visible", lines: unchangedBuffer })
    }
    unchangedBuffer = []
  }

  for (const line of lines) {
    if (line.type === "unchanged") {
      unchangedBuffer.push(line)
    } else {
      flushUnchanged()
      sections.push({ type: "visible", lines: [line] })
    }
  }

  flushUnchanged()
  return sections
}

// ─── DiffContent subcomponent ────────────────────────────────────────────────

function DiffContent({ changes, side }: { changes: DiffChange[]; side: "old" | "new" }) {
  const lines = useMemo(() => splitIntoLines(changes), [changes])
  const sections = useMemo(() => buildSections(lines), [lines])
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set())

  const toggleSection = useCallback((index: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }, [])

  return (
    <div className="text-sm font-mono leading-relaxed whitespace-pre-wrap break-words">
      {sections.map((section, sectionIdx) => {
        if (section.type === "collapsed" && !expandedSections.has(sectionIdx)) {
          return (
            <button
              key={sectionIdx}
              type="button"
              onClick={() => toggleSection(sectionIdx)}
              className="my-1 block w-full rounded-lg border border-app bg-app-elevated px-3 py-1.5 text-center text-xs text-app-muted hover:text-app transition-colors"
            >
              Show {section.hiddenCount} hidden lines
            </button>
          )
        }

        return (
          <span key={sectionIdx}>
            {section.lines.map((line, lineIdx) =>
              line.segments.map((segment, segIdx) => {
                const key = `${sectionIdx}-${lineIdx}-${segIdx}`

                if (segment.type === "addition" && side === "new") {
                  return (
                    <span
                      key={key}
                      style={{
                        background: "var(--home-diff-add)",
                        color: "var(--home-diff-add-text)",
                      }}
                    >
                      {segment.value}
                    </span>
                  )
                }

                if (segment.type === "deletion" && side === "old") {
                  return (
                    <span
                      key={key}
                      style={{
                        background: "var(--home-diff-delete)",
                        color: "var(--home-diff-delete-text)",
                      }}
                    >
                      {segment.value}
                    </span>
                  )
                }

                if (segment.type === "unchanged") {
                  return <span key={key}>{segment.value}</span>
                }

                // Additions on old side or deletions on new side: skip rendering
                return null
              })
            )}
          </span>
        )
      })}
    </div>
  )
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DiffView({ oldRevision, newRevision, onClose }: DiffViewProps) {
  // Compute word diff
  const changes = useMemo<DiffChange[]>(() => {
    const oldText = extractTextFromProseMirror(oldRevision.content)
    const newText = extractTextFromProseMirror(newRevision.content)
    return computeWordDiff(oldText, newText)
  }, [oldRevision.content, newRevision.content])

  // Escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  return (
    <div
      role="region"
      aria-label="Version comparison"
      className="flex flex-col h-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-app px-4 py-3">
        <h2 className="text-sm font-semibold text-app">
          Comparing versions
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close comparison"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-app-muted hover:bg-app-elevated hover:text-app transition-colors"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>

      {/* Diff content - side by side on desktop, stacked on mobile */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Older version (left / top on mobile) */}
        <div className="flex flex-col border-b md:border-b-0 md:border-r border-app">
          <div className="sticky top-0 z-10 border-b border-app bg-app-surface px-4 py-2">
            <span className="text-xs font-semibold text-app-muted" aria-label="Older version">
              Older version
            </span>
            <span className="ml-2 text-xs text-app-muted">
              {formatTimestamp(oldRevision.createdAt)}
            </span>
          </div>
          <div className="flex-1 p-4 overflow-x-auto">
            <DiffContent changes={changes} side="old" />
          </div>
        </div>

        {/* Newer version (right / bottom on mobile) */}
        <div className="flex flex-col">
          <div className="sticky top-0 z-10 border-b border-app bg-app-surface px-4 py-2">
            <span className="text-xs font-semibold text-app-muted" aria-label="Newer version">
              Newer version
            </span>
            <span className="ml-2 text-xs text-app-muted">
              {formatTimestamp(newRevision.createdAt)}
            </span>
          </div>
          <div className="flex-1 p-4 overflow-x-auto">
            <DiffContent changes={changes} side="new" />
          </div>
        </div>
      </div>
    </div>
  )
}
