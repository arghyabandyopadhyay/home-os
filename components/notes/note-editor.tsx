"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Note } from "@/types/note"
import { toast } from "sonner"
import { DeleteNoteButton } from "./delete-note-button"
import { TagInput } from "./tag-input"
import { useRouter } from "next/navigation"
import { PinNoteButton } from "@/components/dashboard/pinned-notes"
import { NoteLinks } from "@/components/notes/note-links"
import ReactMarkdown from "react-markdown"
import { Eye, Pencil } from "lucide-react"

export function NoteEditor({
  note,
}: {
  note: Note
}) {
  const supabase = createClient()
  const router = useRouter()

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

  const save = useCallback(async () => {
    setSaving(true)
    setSaveError(false)

    const { error } = await supabase
      .from("notes")
      .update({
        title: latestRef.current.title,
        content: latestRef.current.content,
        tags: latestRef.current.tags,
        updated_at: new Date().toISOString(),
      })
      .eq("id", note.id)

    setSaving(false)

    if (error) {
      setSaveError(true)
      retryCountRef.current += 1
      // Retry with 3s backoff
      retryTimeoutRef.current = setTimeout(() => {
        saveRef.current?.()
      }, 3000)
      return
    }

    dirtyRef.current = false
    retryCountRef.current = 0
  }, [note.id, supabase])

  // Keep saveRef in sync
  useEffect(() => {
    saveRef.current = save
  }, [save])

  // Autosave with 800ms debounce
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

  // Flush autosave on navigation (component unmount)
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (dirtyRef.current) {
        // Fire-and-forget save on unmount
        const { title: t, content: c, tags: tg } = latestRef.current
        supabase
          .from("notes")
          .update({
            title: t,
            content: c,
            tags: tg,
            updated_at: new Date().toISOString(),
          })
          .eq("id", note.id)
          .then(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note.id])

  async function deleteNote() {
    const { error } = await supabase
      .from("notes")
      .delete()
      .eq("id", note.id)

    if (error) {
      toast.error("Failed to delete")
      return
    }

    router.push("/notes")
    router.refresh()
  }

  function handleRetry() {
    setSaveError(false)
    retryCountRef.current = 0
    save()
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto bg-app">
      <div className="mx-auto max-w-4xl p-10">
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
            <button
              type="button"
              onClick={() => setPreviewMode(!previewMode)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition ${
                previewMode
                  ? "border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-200"
                  : "border-app text-app-muted hover:text-app"
              }`}
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
            <DeleteNoteButton onDelete={deleteNote} />
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
          className="mb-6 w-full bg-transparent text-5xl font-bold outline-none"
        />

        {previewMode ? (
          <div className="prose prose-neutral dark:prose-invert min-h-[500px] max-w-none text-lg leading-8">
            <ReactMarkdown>{content || "*Start writing...*"}</ReactMarkdown>
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing..."
            className="min-h-[500px] w-full resize-none bg-transparent text-lg leading-8 text-app-muted outline-none"
          />
        )}
      </div>
    </div>
  )
}
