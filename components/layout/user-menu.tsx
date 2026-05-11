"use client"

import { createClient } from "@/lib/supabase/client"

export function UserMenu() {
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()

    window.location.href = "/login"
  }

  return (
    <button
      onClick={logout}
      className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
    >
      Logout
    </button>
  )
}