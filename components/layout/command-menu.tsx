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
  Search,
  Mic,
} from "lucide-react";
import { toast } from "sonner";
import { useVoiceInput } from "@/hooks/use-voice-input";
import { useCreateNote } from "@/hooks/queries/use-notes";
import { useCreateTask } from "@/hooks/queries/use-tasks";
import { useApiErrorHandler } from "@/hooks/use-api-error-handler";
import { useSearch } from "@/hooks/queries/use-search";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useSearchStore } from "@/hooks/use-search-store";
import type { SearchCategory, SearchResultItem } from "@/types/search";
import type { ApiClientError } from "@/lib/api-client";

const CATEGORY_ICON: Record<SearchCategory, React.ElementType> = {
  tasks: CheckSquare,
  notes: FileText,
  books: BookOpen,
  contacts: Users,
  documents: File,
};

const CATEGORY_LABEL: Record<SearchCategory, string> = {
  tasks: "Tasks",
  notes: "Notes",
  books: "Books",
  contacts: "Contacts",
  documents: "Documents",
};

function getResultRoute(result: SearchResultItem): string {
  switch (result.category) {
    case "notes":
      return `/notes/${result.id}`;
    case "tasks":
      return "/tasks";
    case "documents":
      return `/documents/${result.id}`;
    case "contacts":
      return "/contacts";
    case "books":
      return result.metadata?.file_path ? `/reader/${result.id}` : "/library";
    default:
      return "/dashboard";
  }
}

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const router = useRouter();
  const createNoteMutation = useCreateNote();
  const createTaskMutation = useCreateTask();
  const handleError = useApiErrorHandler();
  const searchStore = useSearchStore();
  const { isSupported: voiceSupported, isListening, transcript, startListening, stopListening } = useVoiceInput();

  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, isLoading } = useSearch({
    query: open ? debouncedSearch : "",
    pageSize: 5,
  });

  // Group results by category
  const resultsByCategory = React.useMemo(() => {
    if (!data?.results) return new Map<SearchCategory, SearchResultItem[]>();
    const grouped = new Map<SearchCategory, SearchResultItem[]>();
    for (const result of data.results) {
      const existing = grouped.get(result.category) || [];
      existing.push(result);
      grouped.set(result.category, existing);
    }
    return grouped;
  }, [data?.results]);

  const hasSearchResults = resultsByCategory.size > 0;

  // When voice transcript updates while command menu is open, update search
  React.useEffect(() => {
    if (open && transcript) {
      setSearch(transcript);
    }
  }, [open, transcript]);

  const resetSearchState = React.useCallback(() => {
    setSearch("");
  }, []);

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
      if (!nextOpen) {
        resetSearchState();
        window.dispatchEvent(new Event("close-command-menu"));
      }
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
    const handleOpenEvent = (e: Event) => {
      setOpen(true);
      // If the event carries a voice transcript query, pre-fill the search
      const customEvent = e as CustomEvent<{ query?: string }>;
      if (customEvent.detail?.query) {
        setSearch(customEvent.detail.query);
      }
    };
    window.addEventListener("open-command-menu", handleOpenEvent);
    return () => window.removeEventListener("open-command-menu", handleOpenEvent);
  }, []);

  const handleSelect = (path: string) => {
    router.push(path);
    handleOpenChange(false);
  };

  function createNote() {
    setCreating(true);
    createNoteMutation.mutate(
      { title: "Untitled", content: "" },
      {
        onSuccess: (data) => {
          handleSelect(`/notes/${data.id}`);
          setCreating(false);
        },
        onError: (error) => {
          handleError(error as unknown as ApiClientError);
          setCreating(false);
        },
      },
    );
  }

  function createTask() {
    setCreating(true);
    createTaskMutation.mutate(
      { title: "New task" },
      {
        onSuccess: () => {
          handleSelect("/tasks");
          toast.success("Task created");
          setCreating(false);
        },
        onError: (error) => {
          handleError(error as unknown as ApiClientError);
          setCreating(false);
        },
      },
    );
  }

  function handleSeeAllResults() {
    searchStore.setQuery(search);
    router.push(`/search?q=${encodeURIComponent(search)}`);
    handleOpenChange(false);
  }

  return (
    <CommandDialog
      shouldFilter={false}
      open={open}
      onOpenChange={handleOpenChange}
      className="rounded-2xl border-white/10 bg-app-surface/90 shadow-2xl backdrop-blur-2xl data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:duration-200 data-closed:duration-200"
    >
      <div className="relative flex items-center">
        <div className="min-w-0 flex-1 [&_input]:pr-12">
          <CommandInput
            placeholder="Search or type a command…"
            value={search}
            onValueChange={setSearch}
          />
        </div>
        {voiceSupported && (
          <button
            type="button"
            aria-label={isListening ? "Stop voice input" : "Start voice input"}
            onClick={isListening ? stopListening : startListening}
            className={`absolute right-3 top-1/2 -translate-y-1/2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
              isListening
                ? "bg-red-500/10 text-red-400"
                : "text-app-muted hover:text-app"
            }`}
          >
            <Mic className={`h-4 w-4 ${isListening ? "animate-pulse" : ""}`} aria-hidden="true" />
          </button>
        )}
      </div>

      <CommandList>
        <CommandEmpty>
          {isLoading && search ? (
            "Searching…"
          ) : search ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Search className="h-8 w-8 text-app-muted" />
              <span>No results found for &ldquo;{search}&rdquo;</span>
            </div>
          ) : (
            "Type to search your home."
          )}
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
            {(["tasks", "notes", "books", "contacts", "documents"] as SearchCategory[]).map(
              (category) => {
                const items = resultsByCategory.get(category);
                if (!items || items.length === 0) return null;
                const Icon = CATEGORY_ICON[category];
                return (
                  <CommandGroup key={category} heading={CATEGORY_LABEL[category]}>
                    {items.map((result) => (
                      <CommandItem
                        key={result.id}
                        onSelect={() => handleSelect(getResultRoute(result))}
                        className="cursor-pointer"
                      >
                        <Icon className="mr-2 h-4 w-4" />
                        <div className="flex flex-col">
                          <span>{result.title}</span>
                          {result.snippet && (
                            <span className="text-xs text-app-muted">
                              {result.snippet.length > 80
                                ? result.snippet.slice(0, 80).replace(/\s+\S*$/, "") + "…"
                                : result.snippet}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              },
            )}

            <CommandSeparator />

            <CommandGroup>
              <CommandItem
                onSelect={handleSeeAllResults}
                className="cursor-pointer"
              >
                <Search className="mr-2 h-4 w-4" />
                See all results for &ldquo;{search}&rdquo;
              </CommandItem>
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
