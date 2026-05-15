import { createClient } from "@/lib/supabase/server"

export async function ensureProfile() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!existing) {
    await supabase.from("profiles").insert({
      id: user.id,
      email: user.email,
      preferences: {},
    })
  }

  return user
}