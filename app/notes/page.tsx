import { getNotes } from "@/lib/notes";
import { NotesSidebar } from "@/components/notes/notes-sidebar";

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <div className="relative min-h-screen bg-app text-app">
      <div className="flex h-[calc(100vh-64px)]">
        <NotesSidebar notes={notes} />

        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="panel-app p-10">
            <p className="text-app-muted">Select or create a note</p>
          </div>
        </div>
      </div>
    </div>
  );
}
