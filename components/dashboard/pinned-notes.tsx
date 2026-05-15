"use client";

import Link from "next/link";
import { Pin, PinOff } from "lucide-react";
import { usePreferences } from "@/components/providers/user-preferences-provider";
import type { Note } from "@/types/note";

export function PinnedNotes({ notes }: { notes: Note[] }) {
  const { prefs, update } = usePreferences();
  const pinnedIds = prefs.pinnedNoteIds ?? [];
  const pinned = notes.filter((note) => pinnedIds.includes(note.id));

  if (pinned.length === 0) return null;

  async function unpin(noteId: string) {
    await update({
      pinnedNoteIds: pinnedIds.filter((id) => id !== noteId),
    });
  }

  return (
    <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-amber-600 dark:text-amber-200">
        <Pin className="h-4 w-4" />
        Pinned notes
      </h2>
      <div className="grid gap-2 md:grid-cols-2">
        {pinned.map((note) => (
          <Link
            key={note.id}
            href={`/notes/${note.id}`}
            className="group rounded-xl border border-app bg-app-elevated p-4 transition hover:border-amber-500/30"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium">{note.title}</p>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  unpin(note.id);
                }}
                className="text-app-muted opacity-0 transition hover:text-amber-500 group-hover:opacity-100 dark:hover:text-amber-300"
                aria-label="Unpin note"
              >
                <PinOff className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-app-muted">
              {note.content || "Empty note"}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function PinNoteButton({ noteId }: { noteId: string }) {
  const { prefs, update } = usePreferences();
  const pinnedIds = prefs.pinnedNoteIds ?? [];
  const pinned = pinnedIds.includes(noteId);

  async function toggle() {
    const next = pinned
      ? pinnedIds.filter((id) => id !== noteId)
      : [noteId, ...pinnedIds].slice(0, 5);
    await update({ pinnedNoteIds: next });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
        pinned
          ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-200"
          : "border-app text-app-muted hover:text-app"
      }`}
    >
      {pinned ? (
        <>
          <PinOff className="h-4 w-4" />
          Unpin
        </>
      ) : (
        <>
          <Pin className="h-4 w-4" />
          Pin to Today
        </>
      )}
    </button>
  );
}
