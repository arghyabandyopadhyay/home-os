import { createClient } from "@/lib/supabase/server"
import { Document } from "@/types/document"

export async function getDocuments(): Promise<Document[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    console.error(error)
    return []
  }

  return data as Document[]
}

export async function getDocument(id: string): Promise<Document | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error(error)
    return null
  }

  return data as Document
}

export async function createDocument(params: {
  userId: string
  title: string
  filePath: string
  fileSize: number | null
}): Promise<Document | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("documents")
    .insert({
      user_id: params.userId,
      title: params.title,
      file_path: params.filePath,
      file_size: params.fileSize,
    })
    .select()
    .single()

  if (error) {
    console.error(error)
    return null
  }

  return data as Document
}

export async function updateDocument(
  id: string,
  updates: { title?: string; tags?: string[] }
): Promise<Document | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("documents")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(error)
    return null
  }

  return data as Document
}

export async function deleteDocument(id: string, filePath: string): Promise<boolean> {
  const supabase = await createClient()

  // Delete from storage first
  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([filePath])

  if (storageError) {
    console.error("Storage delete error:", storageError)
    // Continue with DB delete even if storage fails
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)

  if (dbError) {
    console.error("DB delete error:", dbError)
    return false
  }

  return true
}

// Re-export pure functions for convenience in server contexts
export {
  validateUploadFile,
  filterDocumentsByQuery,
  filterDocumentsByTag,
} from "@/lib/documents-utils"
export type { FileValidationResult } from "@/lib/documents-utils"
