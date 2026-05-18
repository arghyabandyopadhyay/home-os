import { getNote, getNotes } from "@/lib/notes";
import { NoteEditor } from "@/components/notes/note-editor";
import { NotesSidebar } from "@/components/notes/notes-sidebar";
import { PageShell } from "@/components/layout/page-shell";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [note, notes] = await Promise.all([getNote(id), getNotes()]);

  if (!note) {
    return (
      <PageShell title="Notes" description="A quiet space for your thoughts">
        <div className="flex items-center justify-center py-20">
          <div className="card-app p-10 text-center">
            <p className="text-app-muted">
              This note could not be found. It may have been deleted.
            </p>
            <Link
              href="/notes"
              className="btn-primary-app mt-4 inline-block px-4 py-2 text-sm"
            >
              Back to notes
            </Link>
          </div>
        </div>
      </PageShell>
    );
  }

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
      <div className="flex gap-6">
        <div className="hidden w-80 shrink-0 md:block">
          <div className="card-app overflow-hidden p-0">
            <NotesSidebar notes={notes} activeNoteId={id} />
          </div>
        </div>

        <div className="min-w-0 flex-1 lg:w-[70%]">
          <div className="card-app overflow-hidden p-0">
            <NoteEditor note={note} />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
