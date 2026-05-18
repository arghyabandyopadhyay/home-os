import { getNotes } from "@/lib/notes";
import { NotesSidebar } from "@/components/notes/notes-sidebar";
import { NotesEmptyState } from "@/components/notes/notes-empty-state";
import { PageShell } from "@/components/layout/page-shell";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <PageShell
      title="Notes"
      description="A quiet space for your thoughts"
      actions={
        <Link
          href="/notes"
          className="btn-primary-app inline-flex items-center gap-2 px-4 py-2 text-sm"
          aria-label="Create new note"
        >
          <Plus className="h-4 w-4" />
          New note
        </Link>
      }
    >
      {notes.length === 0 ? (
        <NotesEmptyState />
      ) : (
        <div className="flex gap-6">
          <div className="card-app w-80 shrink-0 overflow-hidden p-0">
            <NotesSidebar notes={notes} />
          </div>

          <div className="flex flex-1 items-center justify-center">
            <div className="card-app p-10 text-center">
              <p className="text-app-muted">
                Select a note from the sidebar or create a new one
              </p>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}
