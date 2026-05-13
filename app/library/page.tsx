import { getBooks } from "@/lib/books";
import { LibraryView } from "@/components/library/library-view";

export default async function LibraryPage() {
  const books = await getBooks();

  return (
    <div className="relative min-h-screen bg-[#09090b] text-white">
      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="rounded-3xl border border-white/10 bg-[#111118]/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold">Library</h1>
            <p className="mt-2 text-zinc-300">Your personal reading space</p>
          </div>

          <LibraryView books={books} />
        </div>
      </div>
    </div>
  );
}
