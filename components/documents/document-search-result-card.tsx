"use client"

import Link from "next/link"
import { FileText } from "lucide-react"

import type { DocumentSearchResult } from "@/types/document"

type DocumentSearchResultCardProps = {
  result: DocumentSearchResult
}

function truncateSnippet(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trimEnd() + "…"
}

function renderHighlights(highlights: string[]) {
  return highlights.map((highlight, index) => {
    // Split on <mark>...</mark> tags and render them as actual mark elements
    const parts = highlight.split(/(<mark>.*?<\/mark>)/g)
    return (
      <span key={index}>
        {parts.map((part, i) => {
          const match = part.match(/^<mark>(.*?)<\/mark>$/)
          if (match) {
            return <mark key={i} className="bg-yellow-200/60 dark:bg-yellow-500/30 rounded-sm px-0.5">{match[1]}</mark>
          }
          return <span key={i}>{part}</span>
        })}
        {index < highlights.length - 1 && " "}
      </span>
    )
  })
}

export function DocumentSearchResultCard({ result }: DocumentSearchResultCardProps) {
  const { document: doc, matched_field, snippet, highlights } = result
  const isNotProcessed = doc.processing.status !== "ready"
  const showNotProcessedIndicator = isNotProcessed && (matched_field === "title" || matched_field === "tags")

  return (
    <div className="item-app rounded-xl px-4 py-3">
      <div className="flex items-start gap-3">
        <FileText size={18} className="mt-0.5 shrink-0 text-red-500" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/documents/${doc.id}`}
              className="truncate text-sm font-medium hover:text-blue-500"
            >
              {doc.title}
            </Link>
            <span className="shrink-0 rounded-md bg-app-elevated px-1.5 py-0.5 text-[10px] font-medium text-app-muted">
              {matched_field}
            </span>
            {showNotProcessedIndicator && (
              <span className="shrink-0 rounded-md bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400">
                Not yet processed
              </span>
            )}
          </div>

          {(highlights.length > 0 || snippet) && (
            <p className="mt-1 text-xs leading-relaxed text-app-muted">
              {highlights.length > 0
                ? renderHighlights(highlights)
                : snippet
                  ? truncateSnippet(snippet, 120)
                  : null}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
