"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Note } from "@/types/note"
import { toast } from "sonner"
import { DeleteNoteButton } from "./delete-note-button"
import { TagInput } from "./tag-input"
import { useRouter } from "next/navigation"
import { PinNoteButton } from "@/components/dashboard/pinned-notes"
import { NoteLinks } from "@/components/notes/note-links"
import ReactMarkdown from "react-markdown"
import { Eye, Pencil, History, Undo2, Redo2 } from "lucide-react"
import { useUpdateNote, useDeleteNote } from "@/hooks/queries/use-notes"
import { useApiErrorHandler } from "@/hooks/use-api-error-handler"
import type { ApiClientError } from "@/lib/api-client"
import { useVersionHistoryStore } from "@/hooks/use-version-history-store"
import { useAutoSaveRevision } from "@/hooks/use-auto-save-revision"
import { useSessionUndoRedo } from "@/hooks/use-session-undo-redo"
import { useRestoreRevision } from "@/hooks/queries/use-revisions"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import { getRevision } from "@/lib/revisions/api"
import { VersionHistoryPanel } from "@/components/notes/version-history-panel"
import { TimeTravelBanner } from "@/components/notes/time-travel-banner"
import { DiffView } from "@/components/notes/diff-view"
import { RestoreConfirmDialog } from "@/components/notes/restore-confirm-dialog"
import type { TimeTravelState } from "@/types/revision"
import type { Revision } from "@/types/revision"

export function NoteEditor({
  note,
}: {
  note: Note
}) {
  const router = useRouter()
  const updateNoteMutation = useUpdateNote()
  const deleteNoteMutation = useDeleteNote()
  const handleError = useApiErrorHandler()
  const { isReadOnly } = useWorkspacePermissions()

  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content || "")
  const [tags, setTags] = useState<string[]>(note.tags ?? [])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dirtyRef = useRef(false)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Track latest values for flush-on-navigation
  const latestRef = useRef({ title, content, tags })
  useEffect(() => {
    latestRef.current = { title, content, tags }
  }, [title, content, tags])

  const saveRef = useRef<(() => Promise<void>) | undefined>(undefined)

  // ─── Version History Store ─────────────────────────────────────────────────
  const { isOpen: historyPanelOpen, open: openHistory, close: closeHistory } =
    useVersionHistoryStore()

  // ─── Time Travel State ─────────────────────────────────────────────────────
  const [timeTravel, setTimeTravel] = useState<TimeTravelState>({
    active: false,
    revisionId: null,
    content: null,
    timestamp: null,
    loading: false,
  })

  // ─── Diff View State ───────────────────────────────────────────────────────
  const [diffRevisions, setDiffRevisions] = useState<{
    old: Revision
    new: Revision
  } | null>(null)

  // ─── Restore Dialog State ──────────────────────────────────────────────────
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const restoreRevisionMutation = useRestoreRevision(note.id)

  // ─── Auto-Save Revision (parallel to existing 800ms content save) ──────────
  const {
    onContentChange: onRevisionContentChange,
    saveNow,
    saving: revisionSaving,
  } = useAutoSaveRevision({
    noteId: note.id,
    enabled: !timeTravel.active,
    debounceMs: 2000,
  })

  // ─── Session Undo/Redo ─────────────────────────────────────────────────────
  const handleContentRestore = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (restoredContent: string, _revisionTimestamp: string) => {
      setContent(restoredContent)
    },
    []
  )

  const {
    canUndo,
    canRedo,
    undo,
    redo,
    onNewEdit,
    transientLabel,
  } = useSessionUndoRedo({
    noteId: note.id,
    currentContent: content,
    onContentRestore: handleContentRestore,
    enabled: !timeTravel.active,
  })

  // ─── Existing save (content persistence with 800ms debounce) ───────────────
  const save = useCallback(async () => {
    setSaving(true)
    setSaveError(false)

    updateNoteMutation.mutate(
      {
        id: note.id,
        title: latestRef.current.title,
        content: latestRef.current.content,
        tags: latestRef.current.tags,
      },
      {
        onSuccess: () => {
          setSaving(false)
          dirtyRef.current = false
          retryCountRef.current = 0
        },
        onError: (error) => {
          setSaving(false)
          setSaveError(true)
          retryCountRef.current += 1
          retryTimeoutRef.current = setTimeout(() => {
            saveRef.current?.()
          }, 3000)
          handleError(error as unknown as ApiClientError)
        },
      },
    )
  }, [note.id, updateNoteMutation, handleError])

  useEffect(() => {
    saveRef.current = save
  }, [save])

  // Autosave with 800ms debounce (existing behavior — content persistence)
  useEffect(() => {
    dirtyRef.current = true

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      save()
    }, 800)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [title, content, tags, save])

  // ─── Feed content changes to auto-save revision (parallel concern) ─────────
  useEffect(() => {
    if (!timeTravel.active) {
      onRevisionContentChange(content)
    }
  }, [content, timeTravel.active, onRevisionContentChange])

  // Flush autosave on navigation (component unmount)
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (dirtyRef.current) {
        const { title: t, content: c, tags: tg } = latestRef.current
        updateNoteMutation.mutate({
          id: note.id,
          title: t,
          content: c,
          tags: tg,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id])

  // ─── Keyboard shortcuts: ⌘S for manual save, ⌘Z/⌘⇧Z for undo/redo ────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey

      // ⌘S / Ctrl+S → manual save revision
      if (isMeta && e.key === "s") {
        e.preventDefault()
        save()
        saveNow("manual-save")
        return
      }

      // ⌘Z / Ctrl+Z → session undo (when not in time travel)
      if (isMeta && !e.shiftKey && e.key === "z" && !timeTravel.active) {
        // Only intercept if we have revisions to undo to
        if (canUndo) {
          e.preventDefault()
          undo()
        }
        return
      }

      // ⌘⇧Z / Ctrl+Shift+Z / Ctrl+Y → session redo
      if (
        (isMeta && e.shiftKey && e.key === "z") ||
        (isMeta && e.key === "y")
      ) {
        if (canRedo && !timeTravel.active) {
          e.preventDefault()
          redo()
        }
        return
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [save, saveNow, canUndo, canRedo, undo, redo, timeTravel.active])

  // ─── Time Travel: Preview a revision ───────────────────────────────────────
  const handlePreviewRevision = useCallback(
    async (revisionId: string) => {
      setTimeTravel((prev) => ({ ...prev, active: true, loading: true, revisionId }))

      try {
        const revision = await getRevision(note.id, revisionId)
        setTimeTravel({
          active: true,
          revisionId: revision.id,
          content: revision.content,
          timestamp: revision.createdAt,
          loading: false,
        })
      } catch {
        setTimeTravel((prev) => ({ ...prev, loading: false }))
        toast.error("Could not load revision")
      }
    },
    [note.id]
  )

  // ─── Time Travel: Back to current ──────────────────────────────────────────
  const handleBackToCurrent = useCallback(() => {
    setTimeTravel({
      active: false,
      revisionId: null,
      content: null,
      timestamp: null,
      loading: false,
    })
  }, [])

  // ─── Diff: Compare two revisions ──────────────────────────────────────────
  const handleCompare = useCallback(
    async (oldRevisionId: string, newRevisionId: string) => {
      try {
        const [oldRev, newRev] = await Promise.all([
          getRevision(note.id, oldRevisionId),
          getRevision(note.id, newRevisionId),
        ])
        setDiffRevisions({ old: oldRev, new: newRev })
      } catch {
        toast.error("Could not load revisions for comparison")
      }
    },
    [note.id]
  )

  const handleCloseDiff = useCallback(() => {
    setDiffRevisions(null)
  }, [])

  // ─── Restore flow ─────────────────────────────────────────────────────────
  const handleRestoreClick = useCallback(() => {
    setRestoreDialogOpen(true)
  }, [])

  const handleRestoreConfirm = useCallback(async () => {
    if (!timeTravel.revisionId) return

    try {
      const restoredRevision = await restoreRevisionMutation.mutateAsync(
        timeTravel.revisionId
      )
      // Exit time travel, load restored content
      setTimeTravel({
        active: false,
        revisionId: null,
        content: null,
        timestamp: null,
        loading: false,
      })
      setContent(restoredRevision.content)
      setRestoreDialogOpen(false)
      toast.success("Version restored")
    } catch {
      toast.error("Could not restore version. Please try again.")
    }
  }, [timeTravel.revisionId, restoreRevisionMutation])

  const handleRestoreCancel = useCallback(() => {
    setRestoreDialogOpen(false)
  }, [])

  // ─── Content change handler (notify undo/redo of new edits) ────────────────
  const handleContentChange = useCallback(
    (newContent: string) => {
      setContent(newContent)
      onNewEdit()
    },
    [onNewEdit]
  )

  // ─── Delete note ───────────────────────────────────────────────────────────
  async function deleteNote() {
    try {
      await deleteNoteMutation.mutateAsync(note.id)
      router.push("/notes")
      router.refresh()
    } catch (error) {
      handleError(error as unknown as ApiClientError)
    }
  }

  function handleRetry() {
    setSaveError(false)
    retryCountRef.current = 0
    save()
  }

  // ─── Determine displayed content (time travel vs live) ─────────────────────
  const displayedContent = timeTravel.active && timeTravel.content !== null
    ? timeTravel.content
    : content

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto bg-app">
      <div className="mx-auto max-w-4xl p-10">
        {/* Toolbar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-app-muted">
            {saveError ? (
              <span className="flex items-center gap-2 text-red-500">
                Save failed
                <button
                  onClick={handleRetry}
                  className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs text-red-500 hover:bg-red-500/20"
                >
                  Retry
                </button>
              </span>
            ) : saving || revisionSaving ? (
              "Saving..."
            ) : (
              "Saved"
            )}
            {/* Transient undo/redo label */}
            {transientLabel && (
              <span className="text-xs text-app-muted animate-in fade-in">
                {transientLabel}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Undo button */}
            <button
              type="button"
              onClick={() => undo()}
              disabled={!canUndo || timeTravel.active}
              className="flex items-center justify-center rounded-lg border border-app px-2 py-2 text-sm text-app-muted transition hover:text-app disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Undo to previous revision"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            {/* Redo button */}
            <button
              type="button"
              onClick={() => redo()}
              disabled={!canRedo || timeTravel.active}
              className="flex items-center justify-center rounded-lg border border-app px-2 py-2 text-sm text-app-muted transition hover:text-app disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Redo to next revision"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            {/* Version History button */}
            <button
              type="button"
              onClick={() => (historyPanelOpen ? closeHistory() : openHistory())}
              aria-expanded={historyPanelOpen}
              aria-controls="version-history-panel"
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition ${
                historyPanelOpen
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-200"
                  : "border-app text-app-muted hover:text-app"
              }`}
              aria-label="Version History"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </button>
            {/* Preview toggle */}
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              disabled={timeTravel.active}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition ${
                previewMode
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-200"
                  : "border-app text-app-muted hover:text-app"
              } disabled:opacity-40 disabled:cursor-not-allowed`}
              aria-label={previewMode ? "Switch to edit mode" : "Switch to preview mode"}
            >
              {previewMode ? (
                <>
                  <Pencil className="h-4 w-4" />
                  Edit
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Preview
                </>
              )}
            </button>
            <PinNoteButton noteId={note.id} />
            {!isReadOnly && <DeleteNoteButton onDelete={deleteNote} />}
          </div>
        </div>

        <NoteLinks note={note} />

        {/* Tags */}
        <div className="mb-4 rounded-xl border border-app p-3">
          <TagInput tags={tags} onChange={setTags} />
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          disabled={timeTravel.active || isReadOnly}
          className="mb-6 w-full bg-transparent text-5xl font-bold outline-none disabled:opacity-60"
        />

        {/* Time Travel Banner */}
        {timeTravel.active && timeTravel.timestamp && (
          <div className="mb-4">
            <TimeTravelBanner
              timestamp={timeTravel.timestamp}
              onBackToCurrent={handleBackToCurrent}
              onRestore={handleRestoreClick}
              restoring={restoreRevisionMutation.isPending}
            />
          </div>
        )}

        {/* Editor content area */}
        {diffRevisions ? (
          <DiffView
            oldRevision={diffRevisions.old}
            newRevision={diffRevisions.new}
            onClose={handleCloseDiff}
          />
        ) : timeTravel.loading ? (
          <div className="min-h-[500px] animate-pulse space-y-4">
            <div className="h-4 w-3/4 rounded bg-app-elevated" />
            <div className="h-4 w-full rounded bg-app-elevated" />
            <div className="h-4 w-5/6 rounded bg-app-elevated" />
            <div className="h-4 w-2/3 rounded bg-app-elevated" />
          </div>
        ) : previewMode || timeTravel.active ? (
          <div className="prose prose-neutral dark:prose-invert min-h-[500px] max-w-none text-lg leading-8">
            <ReactMarkdown>{displayedContent || "*Start writing...*"}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing..."
            disabled={isReadOnly}
            className="min-h-[500px] w-full resize-none bg-transparent text-lg leading-8 text-app-muted outline-none disabled:opacity-60"
          />
        )}
      </div>

      {/* Version History Panel */}
      <VersionHistoryPanel
        noteId={note.id}
        isOpen={historyPanelOpen}
        onClose={closeHistory}
        onPreview={handlePreviewRevision}
        onCompare={handleCompare}
      />

      {/* Restore Confirmation Dialog */}
      <RestoreConfirmDialog
        open={restoreDialogOpen}
        timestamp={timeTravel.timestamp ?? ""}
        onConfirm={handleRestoreConfirm}
        onCancel={handleRestoreCancel}
        loading={restoreRevisionMutation.isPending}
      />
    </div>
  )
}
