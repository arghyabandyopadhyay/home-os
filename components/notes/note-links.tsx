"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, User } from "lucide-react";
import type { Book } from "@/types/book";
import type { Contact } from "@/types/contact";
import type { Note } from "@/types/note";
import { useBooks } from "@/hooks/queries/use-books";
import { useContacts } from "@/hooks/queries/use-contacts";
import { useUpdateNote } from "@/hooks/queries/use-notes";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import type { ApiClientError } from "@/lib/api-client";

export function NoteLinks({ note }: { note: Note }) {
  const { data: books = [] } = useBooks();
  const { data: contacts = [] } = useContacts();
  const updateNoteMutation = useUpdateNote();
  const handleError = useApiErrorHandler();

  const [linkedBookId, setLinkedBookId] = useState(note.linked_book_id ?? "");
  const [linkedContactId, setLinkedContactId] = useState(
    note.linked_contact_id ?? "",
  );

  function saveLinks(bookId: string | null, contactId: string | null) {
    updateNoteMutation.mutate(
      {
        id: note.id,
        linked_book_id: bookId,
        linked_contact_id: contactId,
      },
      {
        onError: (error) => {
          handleError(error as unknown as ApiClientError);
        },
      },
    );
  }

  function onBookChange(value: string) {
    const id = value || null;
    setLinkedBookId(value);
    saveLinks(id, linkedContactId || null);
  }

  function onContactChange(value: string) {
    const id = value || null;
    setLinkedContactId(value);
    saveLinks(linkedBookId || null, id);
  }

  const linkedBook = books.find((b: Book) => b.id === linkedBookId);
  const linkedContact = contacts.find((c: Contact) => c.id === linkedContactId);

  return (
    <div className="mb-8 space-y-4 rounded-2xl border border-app bg-app-elevated p-4">
      <p className="text-xs font-medium uppercase tracking-wider text-app-muted">
        Linked to
      </p>

      

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm text-app-muted">
          <span className="mb-1 flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" /> Book
          </span>
          <select
            value={linkedBookId}
            onChange={(e) => onBookChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-app bg-app px-3 py-2 text-sm text-app"
          >
            <option value="">None</option>
            {books.map((b: Book) => (
              <option key={b.id} value={b.id}>
                {b.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm text-app-muted">
          <span className="mb-1 flex items-center gap-1">
            <User className="h-3.5 w-3.5" /> Contact
          </span>
          <select
            value={linkedContactId}
            onChange={(e) => onContactChange(e.target.value)}
            className="mt-1 w-full rounded-lg border border-app bg-app px-3 py-2 text-sm text-app"
          >
            <option value="">None</option>
            {contacts.map((c: Contact) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {(linkedBook || linkedContact) && (
        <div className="flex flex-wrap gap-2 text-sm">
          {linkedBook && (
            <Link
              href="/library"
              className="rounded-lg border border-app px-3 py-1.5 text-app-muted hover:text-app"
            >
              {linkedBook.title}
            </Link>
          )}
          {linkedContact && (
            <Link
              href="/contacts"
              className="rounded-lg border border-app px-3 py-1.5 text-app-muted hover:text-app"
            >
              {linkedContact.name}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
