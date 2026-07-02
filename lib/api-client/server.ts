import { createApiClient } from "./core"
import { createServerTokenProvider } from "./server-token"
import type { ApiClient } from "./types"

/**
 * Creates an API client for server-side usage (Server Components, Route Handlers).
 * Async because the server token provider requires awaiting the Supabase cookie client.
 *
 * Import from "@/lib/api-client/server" — NOT from "@/lib/api-client" — to avoid
 * pulling next/headers into client bundles.
 */
export async function createServerApiClient(): Promise<ApiClient> {
  const tokenProvider = await createServerTokenProvider()
  return createApiClient(tokenProvider)
}
