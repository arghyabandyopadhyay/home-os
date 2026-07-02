"use client"

import type { SearchHighlight } from "@/types/search"

type HighlightTextProps = {
  text: string
  highlights: SearchHighlight[]
}

function sanitizeFragment(fragment: string): string {
  // Strip all HTML tags except <em> and </em> to prevent XSS
  return fragment.replace(/<(?!\/?em>)[^>]*>/g, "")
}

type TextPart = {
  text: string
  highlighted: boolean
}

function parseFragment(fragment: string): TextPart[] {
  const sanitized = sanitizeFragment(fragment)
  const parts: TextPart[] = []
  const regex = /<em>(.*?)<\/em>/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(sanitized)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: sanitized.slice(lastIndex, match.index), highlighted: false })
    }
    parts.push({ text: match[1], highlighted: true })
    lastIndex = regex.lastIndex
  }

  if (lastIndex < sanitized.length) {
    parts.push({ text: sanitized.slice(lastIndex), highlighted: false })
  }

  return parts
}

export function HighlightText({ text, highlights }: HighlightTextProps) {
  if (!highlights.length || !highlights[0]?.fragments?.length) {
    return <span>{text}</span>
  }

  const fragment = highlights[0].fragments[0]
  const parts = parseFragment(fragment)

  if (!parts.length) {
    return <span>{text}</span>
  }

  return (
    <span>
      {parts.map((part, index) =>
        part.highlighted ? (
          <mark
            key={index}
            className="bg-yellow-200/30 dark:bg-yellow-400/20 rounded-sm px-0.5"
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  )
}
