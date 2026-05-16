"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
  CommandGroup,
  CommandSeparator,
} from "@/components/ui/command";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen,
  Users,
  LayoutDashboard,
  FileText,
  CheckSquare,
  CalendarDays,
  Plus,
  Settings,
  File,
} from "lucide-react";
import { toast } from "sonner";
import type { Book } from "@/types/book";
import type { CalendarEvent } from "@/types/calendar";
import type { Contact } from "@/types/contact";
import type { Document } from "@/types/document";
import type { Note } from "@/types/note";
import type { Task } from "@/types/task";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [books, setBooks] = React.useState<Book[]>([]);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [events, setEvents] = React.useState<CalendarEvent[]>([]);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [tasks, setTasks] = React.useState<Task[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const router = useRouter();
  const supabase = createClient();

  const resetSearchState = React.useCallback(() => {
    setSearch("");
    setBooks([]);
    setContacts([]);
    setDocuments([]);
    setEvents([]);
    setNotes([]);
    setTasks([]);
  }, []);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) resetSearchState();
    },
    [resetSearchState],
  );

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  React.useEffect(() => {
    if (!open) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const q = search.trim();
        if (!q) {
          setBooks([]);
          setContacts([]);
          setDocuments([]);
          setEvents([]);
          setNotes([]);
          setTasks([]);
          return;
        }

        const pattern = `%${q}%`;

        const [booksRes, contactsRes, documentsRes, eventsRes, notesRes, tasksRes] = await Promise.all([
          supabase
            .from("books")
            .select("*")
            .eq("user_id", user.id)
            .or(`title.ilike.${pattern},author.ilike.${pattern}`)
            .limit(5),
          supabase
            .from("contacts")
            .select("*")
            .eq("user_id", user.id)
            .or(
              `name.ilike.${pattern},email.ilike.${pattern},company.ilike.${pattern}`,
            )
            .limit(5),
          supabase
            .from("documents")
            .select("*")
            .eq("user_id", user.id)
            .ilike("title", pattern)
            .limit(5),
          supabase
            .from("calendar_events")
            .select("*")
            .eq("user_id", user.id)
            .ilike("title", pattern)
            .limit(5),
          supabase
            .from("notes")
            .select("*")
            .eq("user_id", user.id)
            .or(`title.ilike.${pattern},content.ilike.${pattern}`)
            .limit(5),
          supabase
            .from("tasks")
            .select("*")
            .eq("user_id", user.id)
            .ilike("title", pattern)
            .limit(5),
        ]);

        setBooks(booksRes.data || []);
        setContacts(contactsRes.data || []);
        setDocuments(documentsRes.data || []);
        setEvents(eventsRes.data || []);
        setNotes(notesRes.data || []);
        setTasks(tasksRes.data || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [search, open, supabase]);

  const handleSelect = (path: string) => {
    router.push(path);
    setOpen(false);
  };

  async function createNote() {
    setCreating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("notes")
        .insert({ user_id: user.id, title: "Untitled", content: "" })
        .select("id")
        .single();

      if (error) throw error;
      handleSelect(`/notes/${data.id}`);
    } catch {
      toast.error("Could not create note");
    } finally {
      setCreating(false);
    }
  }

  async function createTask() {
    setCreating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("tasks")
        .insert({ user_id: user.id, title: "New task", completed: false })
        .select("id")
        .single();

      if (error) throw error;
      handleSelect("/tasks");
      toast.success("Task created");
    } catch {
      toast.error("Could not create task");
    } finally {
      setCreating(false);
    }
  }

  const hasSearchResults =
    books.length > 0 ||
    contacts.length > 0 ||
    documents.length > 0 ||
    events.length > 0 ||
    notes.length > 0 ||
    tasks.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder="Search or type a command…"
        value={search}
        onValueChange={setSearch}
      />

      <CommandList>
        <CommandEmpty>
          {loading ? "Searching…" : search ? "No results." : "Type to search your home."}
        </CommandEmpty>

        {!search && (
          <>
            <CommandGroup heading="Quick actions">
              <CommandItem
                onSelect={() => createNote()}
                disabled={creating}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                New note
              </CommandItem>
              <CommandItem
                onSelect={() => createTask()}
                disabled={creating}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4" />
                New task
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Go to">
              <CommandItem
                onSelect={() => handleSelect("/dashboard")}
                className="cursor-pointer"
              >
                <LayoutDashboard className="mr-2 h-4 w-4" />
                Today
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect("/notes")}
                className="cursor-pointer"
              >
                <FileText className="mr-2 h-4 w-4" />
                Notes
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect("/tasks")}
                className="cursor-pointer"
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                Tasks
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect("/calendar")}
                className="cursor-pointer"
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                Calendar
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect("/library")}
                className="cursor-pointer"
              >
                <BookOpen className="mr-2 h-4 w-4" />
                Library
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect("/documents")}
                className="cursor-pointer"
              >
                <File className="mr-2 h-4 w-4" />
                Documents
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect("/contacts")}
                className="cursor-pointer"
              >
                <Users className="mr-2 h-4 w-4" />
                Contacts
              </CommandItem>
              <CommandItem
                onSelect={() => handleSelect("/settings")}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </CommandItem>
            </CommandGroup>
          </>
        )}

        {search && hasSearchResults && (
          <>
            {tasks.length > 0 && (
              <CommandGroup heading="Tasks">
                {tasks.map((task) => (
                  <CommandItem
                    key={task.id}
                    onSelect={() => handleSelect("/tasks")}
                    className="cursor-pointer"
                  >
                    <CheckSquare className="mr-2 h-4 w-4" />
                    {task.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {notes.length > 0 && (
              <CommandGroup heading="Notes">
                {notes.map((note) => (
                  <CommandItem
                    key={note.id}
                    onSelect={() => handleSelect(`/notes/${note.id}`)}
                    className="cursor-pointer"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {note.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {books.length > 0 && (
              <CommandGroup heading="Books">
                {books.map((book) => (
                  <CommandItem
                    key={book.id}
                    onSelect={() =>
                      handleSelect(
                        book.file_path ? `/reader/${book.id}` : "/library",
                      )
                    }
                    className="cursor-pointer"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{book.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {book.author}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {contacts.length > 0 && (
              <CommandGroup heading="Contacts">
                {contacts.map((contact) => (
                  <CommandItem
                    key={contact.id}
                    onSelect={() => handleSelect("/contacts")}
                    className="cursor-pointer"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{contact.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {contact.email || contact.company}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {events.length > 0 && (
              <CommandGroup heading="Events">
                {events.map((event) => (
                  <CommandItem
                    key={event.id}
                    onSelect={() => handleSelect("/calendar")}
                    className="cursor-pointer"
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{event.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.starts_at).toLocaleDateString()}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {documents.length > 0 && (
              <CommandGroup heading="Documents">
                {documents.map((doc) => (
                  <CommandItem
                    key={doc.id}
                    onSelect={() => handleSelect(`/documents/${doc.id}`)}
                    className="cursor-pointer"
                  >
                    <File className="mr-2 h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{doc.title}</span>
                      {doc.tags.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {doc.tags.join(", ")}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
