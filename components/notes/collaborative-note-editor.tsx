"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { Note } from "@/types/note"
import { DeleteNoteButton } from "./delete-note-button"
import { TagInput } from "./tag-input"
import { useRouter } from "next/navigation"
import { PinNoteButton } from "@/components/dashboard/pinned-notes"
import { NoteLinks } from "@/components/notes/note-links"
import { useUpdateNote, useDeleteNote } from "@/hooks/queries/use-notes"
import { useApiErrorHandler } from "@/hooks/use-api-error-handler"
import type { ApiClientError } from "@/lib/api-client"
import { useCollaboration } from "@/hooks/use-collaboration"
import { getCollaboratorColor } from "@/lib/collaboration"
import { createClient } from "@/lib/supabase/client"
import { TipTapEditor } from "./tiptap-editor"
import { FormattingToolbar } from "./formatting-toolbar"
import { PresenceBar } from "./presence-bar"
import { ConnectionStatusIndicator } from "./connection-status"
import type { Editor } from "@tiptap/react"
import "./cursor-styles.css"

type CollaborativeNoteEditorProps = {
  note: Note
  userId: string
  displayName: string
  avatarUrl: string | null
}

export function CollaborativeNoteEditor({
  note,
  userId,
  displayName,
  avatarUrl,
}: CollaborativeNoteEditorProps) {
  const router = useRouter()
  const updateNoteMutation = useUpdateNote()
  const deleteNoteMutation = useDeleteNote()
  const handleError = useApiErrorHandler()

  const [title, setTitle] = useState(note.title)
  const [tags, setTags] = useState<string[]>(note.tags ?? [])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [editor, setEditor] = useState<Editor | null>(null)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const titleTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dirtyRef = useRef(false)
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Track latest values for flush-on-navigation
  const latestRef = useRef({ title, tags })
  useEffect(() => {
    latestRef.current = { title, tags }
  }, [title, tags])

  // Get token for SignalR authentication
  const getToken = useCallback(async (): Promise<string> => {
    const supabase = createClient()
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? ""
  }, [])

  const color = getCollaboratorColor(userId)

  // Initialize collaboration
  const { ydoc, awareness, status, collaborators, synced, reconnect } = useCollaboration({
    noteId: note.id,
    userId,
    displayName,
    avatarUrl,
    token: "", // Token will be fetched lazily via onTokenRefresh
    onTokenRefresh: getToken,
  })

  const saveRef = useRef<(() => Promise<void>) | undefined>(undefined)

  const save = useCallback(
    async (contentJson?: string) => {
      setSaving(true)
      setSaveError(false)

      const payload: {
        id: string
        title?: string
        content?: string | null
        tags?: string[]
      } = {
        id: note.id,
        title: latestRef.current.title,
        tags: latestRef.current.tags,
      }

      // Include content if provided (from TipTap update)
      if (contentJson !== undefined) {
        payload.content = contentJson
      }

      updateNoteMutation.mutate(payload, {
        onSuccess: () => {
          setSaving(false)
          dirtyRef.current = false
        },
        onError: (error) => {
          setSaving(false)
          setSaveError(true)
          retryTimeoutRef.current = setTimeout(() => {
            saveRef.current?.()
          }, 3000)
          handleError(error as unknown as ApiClientError)
        },
      })
    },
    [note.id, updateNoteMutation, handleError],
  )

  useEffect(() => {
    saveRef.current = save
  }, [save])

  // Autosave title and tags with 800ms debounce
  useEffect(() => {
    dirtyRef.current = true

    if (titleTimeoutRef.current) {
      clearTimeout(titleTimeoutRef.current)
    }

    titleTimeoutRef.current = setTimeout(() => {
      save()
    }, 800)

    return () => {
      if (titleTimeoutRef.current) {
        clearTimeout(titleTimeoutRef.current)
      }
    }
  }, [title, tags, save])

  // Handle TipTap content updates with 800ms debounce
  const handleContentUpdate = useCallback(
    (contentJson: string) => {
      dirtyRef.current = true

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        save(contentJson)
      }, 800)
    },
    [save],
  )

  // Flush autosave on navigation (component unmount)
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (titleTimeoutRef.current) {
        clearTimeout(titleTimeoutRef.current)
      }
      if (dirtyRef.current) {
        const { title: t, tags: tg } = latestRef.current
        updateNoteMutation.mutate({
          id: note.id,
          title: t,
          tags: tg,
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id])

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
    save()
  }

  const handleEditorReady = useCallback((editorInstance: Editor | null) => {
    setEditor(editorInstance)
  }, [])

  // Show loading state until initial sync completes
  if (!synced) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-app">
        <div className="text-app-muted text-sm">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto bg-app">
      <div className="mx-auto max-w-4xl p-10">
        {/* Header: save status + actions */}
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
            ) : saving ? (
              "Saving..."
            ) : (
              "Saved"
            )}
          </div>
          <div className="flex items-center gap-2">
            <PresenceBar collaborators={collaborators} />
            <ConnectionStatusIndicator status={status} onReconnect={reconnect} />
            <PinNoteButton noteId={note.id} />
            <DeleteNoteButton onDelete={deleteNote} />
          </div>
        </div>

        <NoteLinks note={note} />

        {/* Tags */}
        <div className="mb-4 rounded-xl border border-app p-3">
          <TagInput tags={tags} onChange={setTags} />
        </div>

        {/* Title */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          className="mb-6 w-full bg-transparent text-5xl font-bold outline-none"
        />

        {/* Formatting toolbar */}
        <div className="mb-4">
          <FormattingToolbar editor={editor} />
        </div>

        {/* TipTap collaborative editor */}
        <TipTapEditor
          ydoc={ydoc}
          awareness={awareness}
          userId={userId}
          color={color}
          onUpdate={handleContentUpdate}
          onEditorReady={handleEditorReady}
        />
      </div>
    </div>
  )
}
