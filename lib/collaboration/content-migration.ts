/**
 * Migrates note content from legacy plain text to ProseMirror JSON format.
 *
 * - If content is valid ProseMirror JSON (has type: "doc"), returns parsed object.
 * - If content is plain text or null/empty, wraps in a ProseMirror doc structure.
 */
export function migrateContent(content: string | null): object {
  if (!content || content.trim() === "") {
    return {
      type: "doc",
      content: [{ type: "paragraph" }],
    }
  }

  // Try to parse as JSON
  try {
    const parsed = JSON.parse(content)
    if (parsed && typeof parsed === "object" && parsed.type === "doc") {
      return parsed
    }
  } catch {
    // Not valid JSON — treat as plain text
  }

  // Wrap plain text in a ProseMirror document structure
  return {
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text: content }] }],
  }
}
