import { createClient } from "@/lib/supabase/client"
import type { TokenProvider } from "./types"

/**
 * Creates a token provider for client-side usage (Client Components).
 * Extracts the JWT access token from Supabase's browser-based session.
 */
export function createClientTokenProvider(): TokenProvider {
  const supabase = createClient()

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
