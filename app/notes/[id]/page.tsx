import { getNote, getNotes } from "@/lib/notes"
import { NoteEditor } from "@/components/notes/note-editor"
import { NotesSidebar } from "@/components/notes/notes-sidebar"

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const [note, notes] = await Promise.all([
    getNote(id),
    getNotes(),
  ])

  if (!note) {
    return (
      <div className="p-10">
        Note not found
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <NotesSidebar
        notes={notes}
        activeNoteId={id}
      />

      <div className="flex-1">
        <NoteEditor note={note} />
      </div>
    </div>
  )
}