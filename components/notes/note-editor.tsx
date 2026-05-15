"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Note } from "@/types/note"
import { toast } from "sonner"
import { DeleteNoteButton } from "./delete-note-button"
import { useRouter } from "next/navigation"
import { PinNoteButton } from "@/components/dashboard/pinned-notes"
import { NoteLinks } from "@/components/notes/note-links"

export function NoteEditor({
  note,
}: {
  note: Note
}) {
  const supabase = createClient()
  const router = useRouter()

  const [title, setTitle] = useState(note.title)

  const [content, setContent] = useState(
    note.content || ""
  )

  const [saving, setSaving] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(
    null
  )

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

  async function save() {
    setSaving(true)

    const { error } = await supabase
      .from("notes")
      .update({
        title,
        content,
        updated_at: new Date().toISOString(),
      })
      .eq("id", note.id)

    setSaving(false)

    if (error) {
      toast.error("Failed to save")
      return
    }
  }

  useEffect(() => {
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
  }, [title, content])

  return (
    <div className="h-[calc(100vh-64px)] overflow-y-auto bg-app">
      <div className="mx-auto max-w-4xl p-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-app-muted">
            {saving ? "Saving..." : "Saved"}
          </div>
          <div className="flex items-center gap-2">
            <PinNoteButton noteId={note.id} />
            <DeleteNoteButton onDelete={deleteNote} />
          </div>
        </div>

        <NoteLinks note={note} />

        <input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="Untitled"
          className="mb-6 w-full bg-transparent text-5xl font-bold outline-none"
        />

        <textarea
          value={content}
          onChange={(e) =>
            setContent(e.target.value)
          }
          placeholder="Start writing..."
          className="min-h-[500px] w-full resize-none bg-transparent text-lg leading-8 text-app-muted outline-none"
        />
      </div>
    </div>
  )
}