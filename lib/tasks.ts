import { createClient } from "@/lib/supabase/server"

export async function getTasks() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    })

  if (error) {
    console.error(error)
    return []
  }

  return data
}

export async function createTask() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: "",
    })
    .select()
    .single()

  if (error) {
    console.error(error)
    return null
  }

  return data
}