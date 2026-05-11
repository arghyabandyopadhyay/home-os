import Link from "next/link"
import { redirect } from "next/navigation"
import { Plus } from "lucide-react"
import { createNote } from "@/lib/notes"
import type { Note } from "@/types/note"

interface NotesSidebarProps {
  notes: Note[]
  activeNoteId?: string
}

export async function NotesSidebar({
  notes,
  activeNoteId,
}: NotesSidebarProps) {
  async function create() {
    "use server"

    const note = await createNote()

    if (!note) return

    redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/notes/${note.id}`)
  }

  return (
    <div className="w-80 border-r border-white/10 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <h1 className="text-lg font-semibold">
          Notes
        </h1>

        <form action={create}>
          <button className="rounded-lg bg-white p-2 text-black transition hover:opacity-90">
            <Plus size={16} />
          </button>
        </form>
      </div>

      <div className="space-y-2 p-3">
        {notes.length === 0 && (
          <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-zinc-500">
            No notes yet
          </div>
        )}

        {notes.map((note) => {
          const active =
            note.id === activeNoteId

          return (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className={`block rounded-xl border p-4 transition ${
                active
                  ? "border-white/20 bg-zinc-800"
                  : "border-white/5 bg-zinc-900 hover:border-white/10 hover:bg-zinc-800"
              }`}
            >
              <h2 className="truncate font-medium">
                {note.title}
              </h2>

              <p className="mt-2 line-clamp-2 text-sm text-zinc-400">
                {note.content || "Empty note"}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}