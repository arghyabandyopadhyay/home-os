import { createServerApiClient } from "@/lib/api-client/server"
import type { Document } from "@/types/document"

// Re-export pure helpers so existing imports still work
export {
  validateUploadFile,
  filterDocumentsByQuery,
  filterDocumentsByTag,
} from "@/lib/documents-utils"
export type { FileValidationResult } from "@/lib/documents-utils"

// ─── Server data access ───────────────────────────────────────────────────────

export async function getDocuments(): Promise<Document[]> {
  try {
    const api = await createServerApiClient()
    return await api.get<Document[]>("/documents")
  } catch {
    return []
  }
}

export async function getDocument(id: string): Promise<Document | null> {
  try {
    const api = await createServerApiClient()
    return await api.get<Document>(`/documents/${id}`)
  } catch {
    return null
  }
}

export async function uploadDocument(input: {
  title: string
  filePath: string
  fileSize: number | null
}): Promise<Document | null> {
  try {
    const api = await createServerApiClient()
    return await api.post<Document>("/documents", {
      body: input,
      timeout: 120_000,
    })
  } catch {
    return null
  }
}

export async function updateDocument(
  id: string,
  updates: { title?: string; tags?: string[] }
): Promise<Document | null> {
  try {
    const api = await createServerApiClient()
    return await api.patch<Document>(`/documents/${id}`, { body: updates })
  } catch {
    return null
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  try {
    const api = await createServerApiClient()
    await api.delete(`/documents/${id}`)
    return true
  } catch {
    return false
  }
}
