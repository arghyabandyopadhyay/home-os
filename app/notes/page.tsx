import { getNotes } from "@/lib/notes";
import { NotesSidebar } from "@/components/notes/notes-sidebar";

export default async function NotesPage() {
  const notes = await getNotes();

  return (
    <div className="relative min-h-screen bg-[#09090b] text-white">
      <div className="flex h-[calc(100vh-64px)]">
        <NotesSidebar notes={notes} />

        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="rounded-3xl border border-white/10 bg-[#111118]/80 p-10 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
            <p className="text-zinc-300">Select or create a note</p>
          </div>
        </div>
      </div>
    </div>
  );
}
