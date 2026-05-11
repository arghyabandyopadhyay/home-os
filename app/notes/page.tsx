import { getNotes } from "@/lib/notes"
import { NotesSidebar } from "@/components/notes/notes-sidebar"

export default async function NotesPage() {
  const notes = await getNotes()

  return (
    <div className="flex h-[calc(100vh-64px)]">
      <NotesSidebar notes={notes} />

      <div className="flex flex-1 items-center justify-center">
        <p className="text-zinc-500">
          Select or create a note
        </p>
      </div>
    </div>
  )
}