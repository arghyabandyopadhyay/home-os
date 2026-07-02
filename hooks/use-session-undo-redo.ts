"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRevisions } from "@/hooks/queries/use-revisions"
import { getRevision } from "@/lib/revisions/api"
import type { Revision } from "@/types/revision"

export type UseSessionUndoRedoOptions = {
  noteId: string
  currentContent: string
  onContentRestore: (content: string, revisionTimestamp: string) => void
  enabled: boolean
}

export type UseSessionUndoRedoReturn = {
  canUndo: boolean
  canRedo: boolean
  undo: () => Promise<void>
  redo: () => Promise<void>
  onNewEdit: () => void
  transientLabel: string | null
}

export function useSessionUndoRedo(
  options: UseSessionUndoRedoOptions
): UseSessionUndoRedoReturn {
  const { noteId, currentContent, onContentRestore, enabled } = options

  // Fetch revision list
  const { data } = useRevisions(noteId)

  // Flatten all pages into a single revision array (newest first)
  const revisions: Revision[] = useMemo(
    () => data?.pages.flatMap((page) => page.revisions) ?? [],
    [data]
  )

  // Internal pointer: -1 means "live content" (no undo active)
  // 0 = most recent revision, 1 = second most recent, etc.
  const [pointer, setPointer] = useState<number>(-1)

  // Navigation stack tracks revision IDs we've visited
  const navigationStackRef = useRef<string[]>([])

  // Transient label state
  const [transientLabel, setTransientLabel] = useState<string | null>(null)
  const labelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (labelTimeoutRef.current) {
        clearTimeout(labelTimeoutRef.current)
      }
    }
  }, [])

  const showTransientLabel = useCallback((timestamp: string) => {
    const formatted = new Date(timestamp).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    })
    setTransientLabel(`Reverted to ${formatted}`)

    if (labelTimeoutRef.current) {
      clearTimeout(labelTimeoutRef.current)
    }
    labelTimeoutRef.current = setTimeout(() => {
      setTransientLabel(null)
      labelTimeoutRef.current = null
    }, 2000)
  }, [])

  const undo = useCallback(async () => {
    if (!enabled || revisions.length === 0) return

    const nextPointer = pointer + 1

    // Can't undo past the last available revision
    if (nextPointer >= revisions.length) return

    const targetRevision = revisions[nextPointer]

    try {
      // Fetch the full revision content
      const fullRevision = await getRevision(noteId, targetRevision.id)

      // Move pointer back
      setPointer(nextPointer)
      navigationStackRef.current[nextPointer] = targetRevision.id

      // Restore content
      onContentRestore(fullRevision.content, fullRevision.createdAt)

      // Show transient label
      showTransientLabel(fullRevision.createdAt)
    } catch {
      // Silently fail — session undo is ephemeral
    }
  }, [enabled, revisions, pointer, noteId, onContentRestore, showTransientLabel])

  const redo = useCallback(async () => {
    if (!enabled) return

    // Can't redo if we're already at live content
    if (pointer <= -1) return

    const nextPointer = pointer - 1

    if (nextPointer === -1) {
      // Moving back to live content
      setPointer(-1)
      onContentRestore(currentContent, new Date().toISOString())

      if (labelTimeoutRef.current) {
        clearTimeout(labelTimeoutRef.current)
      }
      setTransientLabel("Back to current")
      labelTimeoutRef.current = setTimeout(() => {
        setTransientLabel(null)
        labelTimeoutRef.current = null
      }, 2000)
      return
    }

    const targetRevision = revisions[nextPointer]
    if (!targetRevision) return

    try {
      const fullRevision = await getRevision(noteId, targetRevision.id)

      // Move pointer forward
      setPointer(nextPointer)

      // Restore content
      onContentRestore(fullRevision.content, fullRevision.createdAt)

      // Show transient label
      showTransientLabel(fullRevision.createdAt)
    } catch {
      // Silently fail
    }
  }, [enabled, pointer, revisions, noteId, currentContent, onContentRestore, showTransientLabel])

  const onNewEdit = useCallback(() => {
    // Reset pointer to live content and discard redo stack
    setPointer(-1)
    navigationStackRef.current = []
  }, [])

  // Compute canUndo: there's a previous revision available (pointer can go further back)
  const canUndo = enabled && revisions.length > 0 && pointer < revisions.length - 1

  // Compute canRedo: pointer is not at -1 (can move forward toward live content)
  const canRedo = enabled && pointer > -1

  return {
    canUndo,
    canRedo,
    undo,
    redo,
    onNewEdit,
    transientLabel,
  }
}
