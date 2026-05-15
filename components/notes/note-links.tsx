"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Book } from "@/types/book";
import type { Contact } from "@/types/contact";
import type { Note } from "@/types/note";

export function NoteLinks({ note }: { note: Note }) {
  const supabase = createClient();
  const [books, setBooks] = useState<Book[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [linkedBookId, setLinkedBookId] = useState(note.linked_book_id ?? "");
  const [linkedContactId, setLinkedContactId] = useState(
    note.linked_contact_id ?? "",
  );

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [booksRes, contactsRes] = await Promise.all([
        supabase
          .from("books")
          .select("id, title, author")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(50),
        supabase
          .from("contacts")
          .select("id, name")
          .eq("user_id", user.id)
          .order("name", { ascending: true })
          .limit(50),
      ]);

      setBooks((booksRes.data as Book[]) || []);
      setContacts((contactsRes.data as Contact[]) || []);
    }
    load();
  }, [supabase]);

  async function saveLinks(bookId: string | null, contactId: string | null) {
    const { error } = await supabase
      .from("notes")
      .update({
        linked_book_id: bookId,
        linked_contact_id: contactId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", note.id);

    if (error) {
      if (error.code === "42703") {
        toast.error("Run the v2 database migration to enable links");
        return;
      }
      toast.error("Failed to save links");
    }
  }

  async function onBookChange(value: string) {
    const id = value || null;
    setLinkedBookId(value);
    await saveLinks(id, linkedContactId || null);
  }

  async function onContactChange(value: string) {
    const id = value || null;
    setLinkedContactId(value);
    await saveLinks(linkedBookId || null, id);
  }

  const linkedBook = books.find((b) => b.id === linkedBookId);
  const linkedContact = contacts.find((c) => c.id === linkedContactId);

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
            {books.map((b) => (
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
            {contacts.map((c) => (
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
