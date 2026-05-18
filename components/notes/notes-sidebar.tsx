"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Plus, Search, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  truncatePreview,
  filterNotesByQuery,
  filterNotesByTag,
  sortNotesByPin,
} from "@/lib/notes-utils"
import { usePreferences } from "@/components/providers/user-preferences-provider"
import type { Note } from "@/types/note"

const ITEMS_PER_PAGE = 5

interface NotesSidebarProps {
  notes: Note[]
  activeNoteId?: string
}

export function NotesSidebar({
  notes,
  activeNoteId,
}: NotesSidebarProps) {
  const router = useRouter()
  const supabase = createClient()
  const { prefs } = usePreferences()
  const pinnedIds = prefs.pinnedNoteIds ?? []

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // 300ms debounce for search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery])

  // Collect all unique tags from notes
  const allTags = Array.from(
    new Set(notes.flatMap((n) => n.tags ?? []))
  ).sort()

  // Apply filters
  let filteredNotes = notes
  if (debouncedQuery.trim().length >= 2) {
    filteredNotes = filterNotesByQuery(filteredNotes, debouncedQuery)
  }
  if (activeTag) {
    filteredNotes = filterNotesByTag(filteredNotes, activeTag)
  }

  // Sort pinned to top
  filteredNotes = sortNotesByPin(filteredNotes, pinnedIds)

  async function handleCreate() {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        title: "Untitled",
        content: "",
      })
      .select()
      .single()

    if (error || !data) return

    router.push(`/notes/${data.id}`)
    router.refresh()
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between border-b border-app p-4">
        <h1 className="text-lg font-semibold">Notes</h1>
        <button
          onClick={handleCreate}
          className="rounded-lg bg-white p-2 text-black transition hover:opacity-90"
          aria-label="Create new note"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Search input */}
      <div className="border-b border-app p-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="input-app w-full pl-8 pr-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b border-app p-3">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() =>
                setActiveTag(activeTag === tag ? null : tag)
              }
              className={`rounded-lg px-2 py-0.5 text-xs transition ${
                activeTag === tag
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-200"
                  : "bg-app-elevated text-app-muted hover:text-app"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-2 overflow-y-auto p-3">
        {filteredNotes.length === 0 && (
          <div className="rounded-xl border border-dashed border-app p-6 text-center text-sm text-app-muted">
            {debouncedQuery.trim().length >= 2 || activeTag
              ? "No notes match your search"
              : "No notes yet"}
          </div>
        )}

        {(showAll ? filteredNotes : filteredNotes.slice(0, ITEMS_PER_PAGE)).map((note) => {
          const active = note.id === activeNoteId
          const isPinned = pinnedIds.includes(note.id)

          return (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className={`item-app block transition ${
                active
                  ? "border-white/20 bg-app-elevated"
                  : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <h2 className="truncate font-medium">
                  {note.title}
                </h2>
                {isPinned && (
                  <span className="text-xs text-amber-500">●</span>
                )}
              </div>

              <p className="mt-2 line-clamp-2 text-sm text-app-muted">
                {truncatePreview(note.content, 120) || "Empty note"}
              </p>

              <span className="mt-2 block text-xs text-app-muted">
                {new Date(note.updated_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>

              {(note.tags ?? []).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {(note.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-app-elevated px-1.5 py-0.5 text-xs text-app-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          )
        })}

        {!showAll && filteredNotes.length > ITEMS_PER_PAGE && (
          <button
            onClick={() => setShowAll(true)}
            className="link-muted w-full py-2 text-center text-sm"
          >
            Show all {filteredNotes.length} notes
          </button>
        )}

        {showAll && filteredNotes.length > ITEMS_PER_PAGE && (
          <button
            onClick={() => setShowAll(false)}
            className="link-muted w-full py-2 text-center text-sm"
          >
            Show less
          </button>
        )}
      </div>
    </div>
  )
}
