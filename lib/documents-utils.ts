import { Document } from "@/types/document"

// Pure functions for client-side filtering and validation.
// This file has no server-side imports and is safe to use in client components.

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024 // 50MB

export type FileValidationResult = {
  valid: boolean
  error?: string
}

export function validateUploadFile(file: File): FileValidationResult {
  if (file.type !== "application/pdf") {
    return { valid: false, error: "Only PDF files are accepted." }
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { valid: false, error: "File size exceeds the 50 MB limit." }
  }

  return { valid: true }
}

export function filterDocumentsByQuery(
  documents: Document[],
  query: string
): Document[] {
  if (!query || query.length < 2) return documents

  const lower = query.toLowerCase()

  return documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(lower) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(lower))
  )
}

export function filterDocumentsByTag(
  documents: Document[],
  tag: string
): Document[] {
  if (!tag) return documents

  return documents.filter((doc) =>
    doc.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  )
}
