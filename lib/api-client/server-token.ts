import { createClient } from "@/lib/supabase/server"
import type { TokenProvider } from "./types"

/**
 * Creates a token provider for server-side usage (Server Components, Route Handlers).
 * Extracts the JWT access token from Supabase's cookie-based session.
 */
export async function createServerTokenProvider(): Promise<TokenProvider> {
  const supabase = await createClient()

  return {
    getToken: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      return session?.access_token ?? null
    },
    refreshToken: async () => {
      const {
        data: { session },
      } = await supabase.auth.refreshSession()
      return session?.access_token ?? null
    },
  }
}
