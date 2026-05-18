import Link from "next/link";
import { redirect } from "next/navigation";
import {
  BookOpen,
  CheckSquare,
  FileText,
  Users,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { getTodayData } from "@/lib/dashboard";
import { greetingForHour, formatDueLabel, isOverdue } from "@/lib/date";
import { QuickCapture } from "@/components/dashboard/quick-capture";
import { PinnedNotes } from "@/components/dashboard/pinned-notes";
import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog";
import { TodayTaskToggle } from "@/components/dashboard/today-task-toggle";
import { PageShell } from "@/components/layout/page-shell";

export default async function DashboardPage() {
  const data = await getTodayData();

  if (!data) {
    redirect("/login");
  }

  const hour = new Date().getHours();
  const greeting = greetingForHour(hour);
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const subtitle =
    "Your calm view across mind, tasks, people, and media — everything that matters today in one place.";

  return (
    <PageShell
      title={`${greeting}, ${data.userName}`}
      description={`${dateLabel} · ${subtitle}`}
    >
      <OnboardingDialog />

      <div className="space-y-8">
        {/* Quick Capture at top of content area */}
        <QuickCapture />

        {/* Pinned Notes */}
        <PinnedNotes notes={data.pinnedNotes} />

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Open tasks", value: data.counts.openTasks, href: "/tasks" },
            { label: "Notes", value: data.counts.notes, href: "/notes" },
            { label: "Reading", value: data.counts.reading, href: "/library" },
            { label: "Contacts", value: data.counts.contacts, href: "/contacts" },
          ].map((stat) => (
            <Link
              key={stat.href}
              href={stat.href}
              className="stat-card p-4 transition hover:border-blue-500/30"
            >
              <p className="stat-value">{stat.value}</p>
              <p className="stat-label">{stat.label}</p>
            </Link>
          ))}
        </div>

        {/* Main activity grid: tasks (2/3) + reading (1/3) */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Focus Tasks — max 8, ordered by due_date ascending, overdue first */}
          <section className="card-app p-6 lg:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <CheckSquare className="h-5 w-5 text-blue-500" />
                Focus today
              </h2>
              <Link
                href="/tasks"
                className="link-muted flex items-center gap-1"
              >
                All tasks
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {data.focusTasks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-app py-8 text-center text-sm text-app-muted">
                Nothing on your plate — capture a task above or head to{" "}
                <Link href="/tasks" className="text-blue-500 hover:underline">
                  Tasks
                </Link>{" "}
                to plan your day.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.focusTasks.map((task) => (
                  <li
                    key={task.id}
                    className="item-app flex items-center gap-3 px-4 py-3"
                  >
                    <TodayTaskToggle
                      taskId={task.id}
                      completed={task.completed}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{task.title}</p>
                      {task.due_date && (
                        <p
                          className={`mt-0.5 flex items-center gap-1 text-xs ${
                            isOverdue(task.due_date)
                              ? "text-red-500"
                              : "text-app-muted"
                          }`}
                        >
                          <Calendar className="h-3 w-3" />
                          {formatDueLabel(task.due_date)}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Currently Reading — max 3, ordered by updated_at descending */}
          <section className="card-app p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <BookOpen className="h-5 w-5 text-orange-500" />
                Reading now
              </h2>
              <Link href="/library" className="link-muted flex items-center gap-1">
                Library
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {data.readingBooks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-app py-8 text-center text-sm text-app-muted">
                No books in progress.{" "}
                <Link
                  href="/library"
                  className="text-blue-500 hover:underline"
                >
                  Browse your library
                </Link>{" "}
                to start reading.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.readingBooks.map((book) => (
                  <li key={book.id}>
                    <Link
                      href={book.file_path ? `/reader/${book.id}` : "/library"}
                      className="item-app flex gap-3 p-3"
                    >
                      {book.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.cover_url}
                          alt=""
                          className="h-14 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-10 items-center justify-center rounded bg-app-elevated text-xs text-app-muted">
                          ?
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium">
                          {book.title}
                        </p>
                        <p className="text-xs text-app-muted">{book.author}</p>
                        {book.progress > 0 && (
                          <div className="mt-2 h-1 w-full rounded-full bg-app-elevated">
                            <div
                              className="h-full rounded-full bg-orange-500"
                              style={{ width: `${book.progress}%` }}
                            />
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Secondary grid: notes + contacts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Notes — max 6, ordered by updated_at descending */}
          <section className="card-app p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <FileText className="h-5 w-5 text-purple-500" />
                Recent notes
              </h2>
              <Link href="/notes" className="link-muted flex items-center gap-1">
                All notes
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {data.recentNotes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-app py-8 text-center text-sm text-app-muted">
                Your notes will appear here.{" "}
                <Link href="/notes" className="text-blue-500 hover:underline">
                  Write your first note
                </Link>{" "}
                to get started.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.recentNotes.slice(0, 6).map((note) => (
                  <li key={note.id}>
                    <Link
                      href={`/notes/${note.id}`}
                      className="item-app block p-3"
                    >
                      <p className="font-medium">{note.title}</p>
                      <p className="mt-1 line-clamp-1 text-sm text-app-muted">
                        {note.content || "Empty note"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Favorite Contacts — max 4 */}
          <section className="card-app p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Users className="h-5 w-5 text-green-500" />
                Favorite people
              </h2>
              <Link
                href="/contacts"
                className="link-muted flex items-center gap-1"
              >
                Contacts
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {data.favoriteContacts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-app py-8 text-center text-sm text-app-muted">
                Star contacts to see them here.{" "}
                <Link
                  href="/contacts"
                  className="text-blue-500 hover:underline"
                >
                  Visit Contacts
                </Link>{" "}
                to mark your favorites.
              </p>
            ) : (
              <ul className="space-y-2">
                {data.favoriteContacts.map((contact) => (
                  <li key={contact.id}>
                    <Link
                      href="/contacts"
                      className="item-app flex items-center justify-between px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">{contact.name}</p>
                        <p className="text-xs text-app-muted">
                          {contact.role || contact.company || contact.email}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </PageShell>
  );
}
