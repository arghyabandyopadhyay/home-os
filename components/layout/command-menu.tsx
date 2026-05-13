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
} from "@/components/ui/command";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen,
  Users,
  LayoutDashboard,
  FileText,
  CheckSquare,
} from "lucide-react";
import type { Book } from "@/types/book";
import type { Contact } from "@/types/contact";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [books, setBooks] = React.useState<Book[]>([]);
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();
  const supabase = createClient();

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
      setSearch("");
      setBooks([]);
      setContacts([]);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) return;

        const query = search.toLowerCase();

        const [booksRes, contactsRes] = await Promise.all([
          supabase
            .from("books")
            .select("*")
            .eq("user_id", user.id)
            .or(`title.ilike.%${query}%,author.ilike.%${query}%`)
            .limit(5),
          supabase
            .from("contacts")
            .select("*")
            .eq("user_id", user.id)
            .or(
              `name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`,
            )
            .limit(5),
        ]);

        setBooks(booksRes.data || []);
        setContacts(contactsRes.data || []);
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

  const hasResults = books.length > 0 || contacts.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search books, contacts, or navigate..."
        value={search}
        onValueChange={setSearch}
      />

      <CommandList>
        <CommandEmpty>
          {loading ? "Searching..." : "No results found."}
        </CommandEmpty>

        {!search && (
          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => handleSelect("/dashboard")}
              className="cursor-pointer"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
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
              onSelect={() => handleSelect("/library")}
              className="cursor-pointer"
            >
              <BookOpen className="mr-2 h-4 w-4" />
              Library
            </CommandItem>
            <CommandItem
              onSelect={() => handleSelect("/contacts")}
              className="cursor-pointer"
            >
              <Users className="mr-2 h-4 w-4" />
              Contacts
            </CommandItem>
          </CommandGroup>
        )}

        {books.length > 0 && (
          <CommandGroup heading="Books">
            {books.map((book) => (
              <CommandItem
                key={book.id}
                onSelect={() => handleSelect(`/library`)}
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
                onSelect={() => handleSelect(`/contacts`)}
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
      </CommandList>
    </CommandDialog>
  );
}
