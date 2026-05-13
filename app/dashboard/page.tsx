import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ensureProfile } from "@/lib/create-profile";
import { BookOpen, CheckSquare, FileText } from "lucide-react";

export default async function DashboardPage() {
  const user = await ensureProfile();
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  const [tasksRes, notesRes, booksRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("*")
      .eq("user_id", authUser?.id)
      .eq("completed", false)
      .limit(5)
      .order("created_at", { ascending: false }),
    supabase
      .from("notes")
      .select("*")
      .eq("user_id", authUser?.id)
      .limit(5)
      .order("updated_at", { ascending: false }),
    supabase
      .from("books")
      .select("*")
      .eq("user_id", authUser?.id)
      .eq("status", "reading")
      .limit(5)
      .order("updated_at", { ascending: false }),
  ]);

  const tasks = tasksRes.data || [];
  const notes = notesRes.data || [];
  const books = booksRes.data || [];

  return (
    <div className="relative min-h-screen bg-[#09090b] text-white">
      <div className="relative mx-auto max-w-6xl space-y-8 px-6 py-10">
        <div className="rounded-3xl border border-white/10 bg-[#111118]/80 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-5xl font-semibold tracking-tight text-white">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-zinc-300">{user?.email}</p>
            </div>
            <div className="flex items-center gap-3 rounded-3xl bg-linear-to-br from-blue-500 to-purple-500 px-4 py-3 text-white shadow-lg shadow-blue-500/10">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-2xl font-bold text-white">
                D
              </div>
              <div>
                <p className="text-sm font-medium">Dashboard overview</p>
                <p className="text-xs text-zinc-300">
                  Quick summary of your home OS
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Pending Tasks</h2>
              <CheckSquare className="h-5 w-5 text-blue-400" />
            </div>
            <p className="mb-4 text-3xl font-bold">{tasks.length}</p>
            <Link
              href="/tasks"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Recent Notes</h2>
              <FileText className="h-5 w-5 text-purple-400" />
            </div>
            <p className="mb-4 text-3xl font-bold">{notes.length}</p>
            <Link
              href="/notes"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              View all →
            </Link>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Reading Now</h2>
              <BookOpen className="h-5 w-5 text-orange-400" />
            </div>
            <p className="mb-4 text-3xl font-bold">{books.length}</p>
            <Link
              href="/library"
              className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              View all →
            </Link>
          </div>
        </div>

        {tasks.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Your Tasks</h2>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-3 rounded-lg border border-white/5 bg-zinc-800/50 p-3 hover:bg-zinc-800 transition-colors"
                >
                  <div className="mt-1 h-4 w-4 rounded border border-white/20" />
                  <div className="flex-1">
                    <p className="font-medium">{task.title}</p>
                    {task.description && (
                      <p className="text-sm text-zinc-400">
                        {task.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {notes.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">Recent Notes</h2>
            <div className="space-y-2">
              {notes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="block rounded-lg border border-white/5 bg-zinc-800/50 p-3 hover:bg-zinc-800 transition-colors"
                >
                  <p className="font-medium">{note.title}</p>
                  <p className="text-sm text-zinc-400 line-clamp-2">
                    {note.content}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {books.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-zinc-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">
              Books You&apos;re Reading
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {books.map((book) => (
                <Link
                  key={book.id}
                  href="/library"
                  className="flex gap-3 rounded-lg border border-white/5 bg-zinc-800/50 p-3 hover:bg-zinc-800 transition-colors"
                >
                  {book.cover_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={book.cover_url}
                      alt={book.title}
                      className="h-16 w-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium line-clamp-2">{book.title}</p>
                    <p className="text-sm text-zinc-400">{book.author}</p>
                    {book.progress > 0 && (
                      <div className="mt-2 h-1 w-full rounded-full bg-zinc-700">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{
                            width: `${book.progress}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
