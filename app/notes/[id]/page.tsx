import { getNote, getNotes } from "@/lib/notes";
import { NoteEditor } from "@/components/notes/note-editor";
import { NotesSidebar } from "@/components/notes/notes-sidebar";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [note, notes] = await Promise.all([getNote(id), getNotes()]);

  if (!note) {
    return (
      <div className="relative min-h-screen bg-app text-app flex items-center justify-center p-10">
        <div className="rounded-3xl border border-app panel-app p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          Note not found
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-app text-app">
      <div className="flex h-[calc(100vh-64px)]">
        <NotesSidebar notes={notes} activeNoteId={id} />

        <div className="flex-1 px-6 py-10">
          <div className="rounded-3xl border border-app panel-app p-8 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <NoteEditor note={note} />
          </div>
        </div>
      </div>
    </div>
  );
}
