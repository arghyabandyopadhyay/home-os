"use client"

import { FileText, CheckSquare, File, Users, BookOpen } from "lucide-react"
import type { SearchCategory } from "@/types/search"

type FilterBarProps = {
  activeFilters: SearchCategory[]
  onToggle: (category: SearchCategory) => void
}

const categories: { id: SearchCategory; label: string; icon: typeof FileText }[] = [
  { id: "notes", label: "Notes", icon: FileText },
  { id: "tasks", label: "Tasks", icon: CheckSquare },
  { id: "documents", label: "Documents", icon: File },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "books", label: "Books", icon: BookOpen },
]

export function FilterBar({ activeFilters, onToggle }: FilterBarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Filter by category"
      className="flex flex-row gap-2 overflow-x-auto md:overflow-x-visible"
    >
      {categories.map(({ id, label, icon: Icon }) => {
        const isActive = activeFilters.includes(id)

        return (
          <button
            key={id}
            type="button"
            aria-pressed={isActive}
            onClick={() => onToggle(id)}
            className={`rounded-xl px-3 py-1.5 text-sm flex items-center gap-1.5 whitespace-nowrap transition-colors border border-app hover:bg-app-elevated/50 ${
              isActive
                ? "bg-app-elevated text-app font-medium"
                : "bg-transparent text-app-muted"
            }`}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
