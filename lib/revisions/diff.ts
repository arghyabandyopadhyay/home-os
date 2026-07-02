import { diffWords } from "diff"

import type { DiffChange } from "@/types/revision"

const MAX_CONTENT_LENGTH = 50000

/**
 * Compute word-level diff between two strings.
 * Returns an array of changes (addition, deletion, unchanged).
 * Uses the `diff` package's `diffWords`.
 * Truncates inputs at 50000 characters for very long documents.
 */
export function computeWordDiff(
  oldText: string,
  newText: string
): DiffChange[] {
  const truncatedOld = oldText.slice(0, MAX_CONTENT_LENGTH)
  const truncatedNew = newText.slice(0, MAX_CONTENT_LENGTH)

  const changes = diffWords(truncatedOld, truncatedNew)

  return changes.map((change) => {
    if (change.added) {
      return { type: "addition", value: change.value }
    }
    if (change.removed) {
      return { type: "deletion", value: change.value }
    }
    return { type: "unchanged", value: change.value }
  })
}

type ProseMirrorNode = {
  type: string
  text?: string
  content?: ProseMirrorNode[]
}

/**
 * Extracts plain text from ProseMirror JSON for diffing.
 * Preserves paragraph boundaries as newlines.
 * Handles invalid JSON gracefully (returns the raw string).
 * Truncates at 50000 characters for very long documents.
 */
export function extractTextFromProseMirror(json: string): string {
  if (!json) {
    return ""
  }

  let doc: ProseMirrorNode
  try {
    doc = JSON.parse(json)
  } catch {
    // Invalid JSON — return raw string, truncated
    return json.slice(0, MAX_CONTENT_LENGTH)
  }

  const text = extractText(doc)
  return text.slice(0, MAX_CONTENT_LENGTH)
}

function extractText(node: ProseMirrorNode): string {
  if (node.type === "text") {
    return node.text ?? ""
  }

  if (!node.content || node.content.length === 0) {
    return ""
  }

  const childTexts = node.content.map((child) => extractText(child))

  // Block-level nodes (paragraph, heading, etc.) are separated by newlines
  const blockTypes = new Set([
    "paragraph",
    "heading",
    "blockquote",
    "codeBlock",
    "bulletList",
    "orderedList",
    "listItem",
    "horizontalRule",
    "taskList",
    "taskItem",
  ])

  if (blockTypes.has(node.type)) {
    return childTexts.join("")
  }

  // For the doc node, join child blocks with newlines
  if (node.type === "doc") {
    return childTexts.filter((t) => t !== "").join("\n")
  }

  // For other nodes (marks, inline), concatenate children directly
  return childTexts.join("")
}
