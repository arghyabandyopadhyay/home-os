"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { hashContent } from "@/lib/revisions/hash"
import { useCreateRevision } from "@/hooks/queries/use-revisions"
import type { RevisionLabel } from "@/types/revision"

export type UseAutoSaveRevisionOptions = {
  noteId: string
  enabled: boolean
  debounceMs?: number // default 2000
}

export type UseAutoSaveRevisionReturn = {
  /** Call when content changes. Resets debounce timer. */
  onContentChange: (content: string) => void
  /** Trigger an immediate manual save */
  saveNow: (label?: RevisionLabel) => Promise<void>
  /** Whether a save is currently in flight */
  saving: boolean
  /** Whether the last save failed (after retry) */
  error: boolean
  /** Last saved content hash (to detect no-change saves) */
  lastSavedHash: string | null
}

export function useAutoSaveRevision(
  options: UseAutoSaveRevisionOptions
): UseAutoSaveRevisionReturn {
  const { noteId, enabled, debounceMs = 2000 } = options

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(false)
  const [lastSavedHash, setLastSavedHash] = useState<string | null>(null)

  const lastSavedHashRef = useRef<string | null>(null)
  const latestContentRef = useRef<string | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const createRevisionMutation = useCreateRevision(noteId)

  const performSave = useCallback(
    async (content: string, label: RevisionLabel) => {
      const hash = await hashContent(content)

      if (hash === lastSavedHashRef.current) {
        return // no-op: content unchanged
      }

      setSaving(true)
      setError(false)

      try {
        await createRevisionMutation.mutateAsync({ content, label })
        lastSavedHashRef.current = hash
        setLastSavedHash(hash)
        setSaving(false)
      } catch {
        // First attempt failed — retry once after 3s
        setSaving(false)

        await new Promise<void>((resolve, reject) => {
          retryTimerRef.current = setTimeout(async () => {
            retryTimerRef.current = null
            try {
              setSaving(true)
              await createRevisionMutation.mutateAsync({ content, label })
              lastSavedHashRef.current = hash
              setLastSavedHash(hash)
              setSaving(false)
              resolve()
            } catch {
              setSaving(false)
              setError(true)
              reject()
            }
          }, 3000)
        }).catch(() => {
          // Error already set above
        })
      }
    },
    [createRevisionMutation]
  )

  const onContentChange = useCallback(
    (content: string) => {
      if (!enabled) return

      latestContentRef.current = content

      // Reset debounce timer on each call
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
      }

      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null
        if (latestContentRef.current !== null) {
          performSave(latestContentRef.current, "auto-saved")
        }
      }, debounceMs)
    },
    [enabled, debounceMs, performSave]
  )

  const saveNow = useCallback(
    async (label: RevisionLabel = "manual-save") => {
      // Clear debounce timer since we're saving immediately
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }

      const content = latestContentRef.current
      if (content === null) return

      await performSave(content, label)
    },
    [performSave]
  )

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== null) {
        clearTimeout(debounceTimerRef.current)
      }
      if (retryTimerRef.current !== null) {
        clearTimeout(retryTimerRef.current)
      }
    }
  }, [])

  return {
    onContentChange,
    saveNow,
    saving,
    error,
    lastSavedHash,
  }
}
