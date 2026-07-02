"use client"

import { FileText, CheckSquare, File, Users, BookOpen, Check, Circle } from "lucide-react"
import type { SearchResultItem, SearchCategory } from "@/types/search"
import { HighlightText } from "@/components/search/highlight-text"

type SearchResultCardProps = {
  result: SearchResultItem
  isSelected: boolean
  onSelect: () => void
}

const categoryIcons: Record<SearchCategory, typeof FileText> = {
  notes: FileText,
  tasks: CheckSquare,
  documents: File,
  contacts: Users,
  books: BookOpen,
}

function truncateAtWordBoundary(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(" ")
  if (lastSpace === -1) return truncated + "…"
  return truncated.slice(0, lastSpace) + "…"
}

function formatRelativeTimestamp(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then

  if (diffMs < 0) return "just now"

  const seconds = Math.floor(diffMs / 1000)
  if (seconds < 60) return "just now"

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`

  const years = Math.floor(days / 365)
  return `${years}y ago`
}

function TaskMetadata({ metadata }: { metadata: Record<string, unknown> }) {
  const completed = metadata.completed as boolean | undefined
  const priority = metadata.priority as string | undefined

  return (
    <div className="flex items-center gap-2 text-xs text-app-muted">
      {completed !== undefined && (
        <span className="flex items-center gap-1">
          {completed ? (
            <Check size={12} aria-hidden="true" />
          ) : (
            <Circle size={12} aria-hidden="true" />
          )}
          {completed ? "Done" : "Pending"}
        </span>
      )}
      {priority && (
        <span
          className={`rounded-md px-1.5 py-0.5 text-xs font-medium ${
            priority === "high"
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : priority === "medium"
                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
          }`}
        >
          {priority}
        </span>
      )}
    </div>
  )
}

function ContactMetadata({ metadata }: { metadata: Record<string, unknown> }) {
  const role = metadata.role as string | undefined
  const company = metadata.company as string | undefined

  if (!role && !company) return null

  return (
    <div className="text-xs text-app-muted">
      {role}
      {role && company && " · "}
      {company}
    </div>
  )
}

function BookMetadata({ metadata }: { metadata: Record<string, unknown> }) {
  const author = metadata.author as string | undefined
  if (!author) return null

  return <div className="text-xs text-app-muted">{author}</div>
}

function DocumentMetadata({ metadata }: { metadata: Record<string, unknown> }) {
  const fileType = metadata.fileType as string | undefined
  if (!fileType) return null

  return <div className="text-xs text-app-muted uppercase">{fileType}</div>
}

function ModuleMetadata({ category, metadata }: { category: SearchCategory; metadata: Record<string, unknown> }) {
  switch (category) {
    case "tasks":
      return <TaskMetadata metadata={metadata} />
    case "contacts":
      return <ContactMetadata metadata={metadata} />
    case "books":
      return <BookMetadata metadata={metadata} />
    case "documents":
      return <DocumentMetadata metadata={metadata} />
    default:
      return null
  }
}

export function SearchResultCard({ result, isSelected, onSelect }: SearchResultCardProps) {
  const Icon = categoryIcons[result.category]
  const snippetText = truncateAtWordBoundary(result.snippet, 150)

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={onSelect}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className={`item-app flex cursor-pointer gap-3 p-4 ${
        isSelected ? "ring-2 ring-offset-2 ring-blue-500" : ""
      }`}
    >
      <div className="mt-0.5 shrink-0">
        <Icon size={18} className="text-app-muted" aria-hidden="true" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-bold text-app">{result.title}</h3>
          <span className="shrink-0 text-xs text-app-muted" suppressHydrationWarning>
            {formatRelativeTimestamp(result.timestamp)}
          </span>
        </div>

        <p className="mt-1 text-sm text-app-muted">
          <HighlightText text={snippetText} highlights={result.highlights} />
        </p>

        <div className="mt-1.5">
          <ModuleMetadata category={result.category} metadata={result.metadata} />
        </div>
      </div>
    </div>
  )
}
