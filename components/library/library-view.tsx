"use client";

import { useState, useRef } from "react";
import { Plus, BookOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { Book } from "@/types/book";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import TextareaAutosize from "react-textarea-autosize";

import { RatingStars } from "./rating-stars";
import { ProgressBar } from "./progress-bar";
import { EmptyState } from "@/components/shared/empty-state";

import { type GoogleBookResult } from "@/lib/google-books";

const ITEMS_PER_SECTION = 5;

export function LibraryView({ books: initialBooks }: { books: Book[] }) {
  const supabase = createClient();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchCacheRef = useRef<Record<string, GoogleBookResult>>({});

  const [books, setBooks] = useState(initialBooks);
  const [search, setSearch] = useState("");
  const [showAllReading, setShowAllReading] = useState(false);
  const [showAllToRead, setShowAllToRead] = useState(false);
  const [showAllFinished, setShowAllFinished] = useState(false);

  async function createBook() {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("Failed to authenticate");
      return;
    }

    const optimisticBook = {
      id: uuid(),
      title: "",
      author: "",
      cover_url: "",
      status: "to_read",
      rating: 0,
      notes: "",
      progress: 0,
      isbn: "",
      published_year: "",
      description: "",
      preview_url: "",
      info_url: "",
      external_id: "",
      source: "",
      epub_url: "",
      pdf_url: "",
      file_path: "",
      file_type: "",
      created_at: new Date().toISOString(),
    };

    setBooks((prev) => [optimisticBook, ...prev]);

    const { data, error } = await supabase
      .from("books")
      .insert({
        user_id: user.id,
        title: "Untitled Book",
        author: "",
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add book");
      setBooks((prev) => prev.filter((book) => book.id !== optimisticBook.id));
      return;
    }

    setBooks((prev) =>
      prev.map((book) => (book.id === optimisticBook.id ? data : book)),
    );
  }

  async function autofillBook(id: string, title: string) {
    if (!title) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        if (searchCacheRef.current[title]) {
          const result = searchCacheRef.current[title];
          const updates = {
            title: result.title,
            author: result.author,
            cover_url: result.cover_url,
            description: result.description,
            published_year: result.published_year,
            preview_url: result.preview_url,
            info_url: result.info_url,
            external_id: result.external_id,
            source: "google_books",
          };

          setBooks((prev) =>
            prev.map((book) =>
              book.id === id ? { ...book, ...updates } : book,
            ),
          );

          await supabase.from("books").update(updates).eq("id", id);
          toast.success("Book details filled from cache");
          return;
        }

        const result = await fetch(
          `/api/search-books?q=${encodeURIComponent(title)}`,
        )
          .then((res) => res.json())
          .then((data) => data.data as GoogleBookResult | null);

        if (!result) {
          toast.error("Book not found on Google Books");
          return;
        }

        searchCacheRef.current[title] = result;

        const updates = {
          title: result.title,
          author: result.author,
          cover_url: result.cover_url,
          description: result.description,
          published_year: result.published_year,
          preview_url: result.preview_url,
          info_url: result.info_url,
          external_id: result.external_id,
          source: "google_books",
        };

        setBooks((prev) =>
          prev.map((book) =>
            book.id === id ? { ...book, ...updates } : book,
          ),
        );

        const { error } = await supabase
          .from("books")
          .update(updates)
          .eq("id", id);

        if (error) {
          toast.error("Failed to update book");
          console.error("Update error:", error);
          return;
        }

        toast.success("Book details filled automatically");
      } catch (error) {
        console.error("Autofill error:", error);
        if (error instanceof Error && error.message.includes("Rate limited")) {
          toast.error("Rate limited. Please wait before trying again");
        } else {
          toast.error("Error autofilling book details");
        }
      }
    }, 800);
  }

  async function updateBook(id: string, updates: Partial<Book>) {
    setBooks((prev) =>
      prev.map((book) =>
        book.id === id ? { ...book, ...updates } : book,
      ),
    );

    await supabase.from("books").update(updates).eq("id", id);
  }

  async function deleteBook(id: string) {
    setBooks((prev) => prev.filter((book) => book.id !== id));
    await supabase.from("books").delete().eq("id", id);
  }

  async function uploadBookFile(bookId: string, file?: File) {
    if (!file) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Not authenticated");
      return;
    }

    const extension = file.name.split(".").pop();
    const path = `${user.id}/${bookId}.${extension}`;

    const { error } = await supabase.storage.from("books").upload(path, file, {
      upsert: true,
    });

    if (error) {
      console.error(error);
      toast.error(error.message);
      return;
    }

    await supabase
      .from("books")
      .update({
        file_path: path,
        file_type: extension,
      })
      .eq("id", bookId);

    toast.success("Book uploaded");
  }

  // Filter books by search
  const filteredBooks = books.filter(
    (book) =>
      book.title.toLowerCase().includes(search.toLowerCase()) ||
      book.author?.toLowerCase().includes(search.toLowerCase()),
  );

  // Group books by status
  const readingBooks = filteredBooks.filter((b) => b.status === "reading");
  const toReadBooks = filteredBooks.filter((b) => b.status === "to_read");
  const finishedBooks = filteredBooks.filter((b) => b.status === "finished");

  // Limit displayed items per section
  const displayedReading = showAllReading
    ? readingBooks
    : readingBooks.slice(0, ITEMS_PER_SECTION);
  const displayedToRead = showAllToRead
    ? toReadBooks
    : toReadBooks.slice(0, ITEMS_PER_SECTION);
  const displayedFinished = showAllFinished
    ? finishedBooks
    : finishedBooks.slice(0, ITEMS_PER_SECTION);

  if (books.length === 0) {
    return (
      <EmptyState
        module="library"
        icon={BookOpen}
        heading="Start building your library"
        body="Add books you're reading, want to read, or have finished to track your reading journey."
        actionLabel="Add your first book"
        onAction={createBook}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search books..."
            className="input-app w-full px-4 py-3"
          />
        </div>
        <button
          onClick={createBook}
          className="btn-primary-app flex items-center gap-2 px-4 py-3"
        >
          <Plus size={18} />
          Add Book
        </button>
      </div>

      {/* Currently Reading Section */}
      {readingBooks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-medium tracking-tight">
            Currently Reading
          </h2>
          <div className="space-y-2">
            {displayedReading.map((book) => (
              <div key={book.id} className="item-app flex items-center gap-4">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-lg bg-app-elevated">
                  {book.cover_url ? (
                    <Image
                      src={book.cover_url}
                      alt={book.title}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <BookOpen size={16} className="text-app-muted" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{book.title || "Untitled"}</p>
                  <p className="truncate text-sm text-app-muted">
                    {book.author || "Unknown author"}
                  </p>
                  <ProgressBar value={book.progress} />
                </div>
                <div className="shrink-0 text-sm text-app-muted">
                  {book.progress}%
                </div>
              </div>
            ))}
          </div>
          {readingBooks.length > ITEMS_PER_SECTION && (
            <button
              onClick={() => setShowAllReading(!showAllReading)}
              className="text-sm text-app-muted transition hover:text-app"
            >
              {showAllReading
                ? "Show less"
                : `Show all ${readingBooks.length} books`}
            </button>
          )}
        </section>
      )}

      {/* To Read Section */}
      {toReadBooks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-medium tracking-tight">To Read</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedToRead.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onUpdate={updateBook}
                onDelete={deleteBook}
                onAutofill={autofillBook}
                onUpload={uploadBookFile}
              />
            ))}
          </div>
          {toReadBooks.length > ITEMS_PER_SECTION && (
            <button
              onClick={() => setShowAllToRead(!showAllToRead)}
              className="text-sm text-app-muted transition hover:text-app"
            >
              {showAllToRead
                ? "Show less"
                : `Show all ${toReadBooks.length} books`}
            </button>
          )}
        </section>
      )}

      {/* Finished Section */}
      {finishedBooks.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-medium tracking-tight">Finished</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {displayedFinished.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onUpdate={updateBook}
                onDelete={deleteBook}
                onAutofill={autofillBook}
                onUpload={uploadBookFile}
              />
            ))}
          </div>
          {finishedBooks.length > ITEMS_PER_SECTION && (
            <button
              onClick={() => setShowAllFinished(!showAllFinished)}
              className="text-sm text-app-muted transition hover:text-app"
            >
              {showAllFinished
                ? "Show less"
                : `Show all ${finishedBooks.length} books`}
            </button>
          )}
        </section>
      )}
    </div>
  );
}

function BookCard({
  book,
  onUpdate,
  onDelete,
  onAutofill,
  onUpload,
}: {
  book: Book;
  onUpdate: (id: string, updates: Partial<Book>) => void;
  onDelete: (id: string) => void;
  onAutofill: (id: string, title: string) => void;
  onUpload: (id: string, file?: File) => void;
}) {
  return (
    <div className="card-app p-4">
      <div className="relative mb-4 aspect-3/4 overflow-hidden rounded-xl bg-app-elevated">
        {book.cover_url ? (
          <Image
            src={book.cover_url}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-app-elevated text-center text-sm text-app-muted">
            <div className="px-4">{book.title || "Untitled"}</div>
          </div>
        )}
      </div>

      <input
        autoFocus={book.title === ""}
        value={book.title}
        placeholder="Book title"
        onChange={(e) => onUpdate(book.id, { title: e.target.value })}
        onBlur={() => onAutofill(book.id, book.title)}
        className="mb-2 w-full bg-transparent text-lg font-semibold outline-none"
      />

      <input
        value={book.author || ""}
        placeholder="Author"
        onChange={(e) => onUpdate(book.id, { author: e.target.value })}
        className="mb-4 w-full bg-transparent text-sm text-app-muted outline-none"
      />

      <select
        value={book.status}
        onChange={(e) => onUpdate(book.id, { status: e.target.value })}
        className={`mb-4 w-full rounded-xl border border-app p-2 text-sm ${
          book.status === "finished"
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : book.status === "reading"
              ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
              : "bg-app text-app-muted"
        }`}
      >
        <option value="to_read">To Read</option>
        <option value="reading">Reading</option>
        <option value="finished">Finished</option>
      </select>

      <div className="mb-4">
        <RatingStars
          value={book.rating}
          onChange={(rating) => onUpdate(book.id, { rating })}
        />
      </div>

      <div className="mb-4">
        <ProgressBar value={book.progress} />
        <input
          type="range"
          min={0}
          max={100}
          value={book.progress}
          onChange={(e) =>
            onUpdate(book.id, { progress: Number(e.target.value) })
          }
          className="mt-2 w-full"
        />
      </div>

      <TextareaAutosize
        minRows={3}
        value={book.notes || ""}
        placeholder="Notes..."
        onChange={(e) => onUpdate(book.id, { notes: e.target.value })}
        className="mt-4 w-full resize-none rounded-xl border border-app bg-app p-3 text-sm outline-none"
      />

      {book.description && (
        <p className="mt-4 line-clamp-2 text-sm text-app-muted">
          {book.description}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        {book.preview_url && (
          <a
            href={book.preview_url}
            target="_blank"
            rel="noreferrer"
            className="btn-primary-app px-3 py-2 text-sm"
          >
            Read Preview
          </a>
        )}
        {book.info_url && (
          <a
            href={book.info_url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-app px-3 py-2 text-sm"
          >
            Details
          </a>
        )}
      </div>

      <input
        type="file"
        accept=".epub,.pdf,application/epub+zip,application/pdf"
        onChange={(e) => onUpload(book.id, e.target.files?.[0])}
      />

      {book.file_path && (
        <Link
          href={`/reader/${book.id}`}
          className="btn-primary-app mt-4 inline-flex px-4 py-2 text-sm"
        >
          Open Reader
        </Link>
      )}

      <button
        onClick={() => onDelete(book.id)}
        className="mt-3 text-sm text-red-500 transition hover:text-red-600"
      >
        Delete
      </button>
    </div>
  );
}
