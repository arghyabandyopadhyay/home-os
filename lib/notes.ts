import { createClient } from "@/lib/supabase/server"

// Re-export pure functions from notes-utils (safe for client components)
export {
  truncatePreview,
  filterNotesByQuery,
  filterNotesByTag,
  sortNotesByPin,
  capPinnedNotes,
} from "@/lib/notes-utils"

// --- Server functions ---

export async function getNotes() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", {
      ascending: false,
    })

  if (error) {
    console.error(error)
    return []
  }

  return data
}

export async function createNote() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from("notes")
    .insert({
      user_id: user.id,
      title: "Untitled",
      content: "",
    })
    .select()
    .single()

  if (error) {
    console.error(error)
    return null
  }

  return data
}

export async function getNote(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    console.error(error)
    return null
  }

  return data
}

export async function deleteNote(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id)

  if (error) {
    console.error(error)
    return false
  }

  return true
}