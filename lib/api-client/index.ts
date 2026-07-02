import { createApiClient } from "./core"
import { createClientTokenProvider } from "./client-token"
import type { ApiClient } from "./types"

/**
 * Creates an API client for client-side usage (Client Components).
 * Sync because the browser Supabase client is created synchronously.
 */
export function createClientApiClient(): ApiClient {
  const tokenProvider = createClientTokenProvider()
  return createApiClient(tokenProvider)
}

// Re-export types
export type {
  RequestOptions,
  MutationOptions,
  ApiClient,
  TokenProvider,
} from "./types"

// Re-export error types and helpers
export type {
  ApiErrorCode,
  FieldError,
  ApiError,
  NetworkError,
  ApiClientError,
} from "./errors"

export {
  isApiError,
  isNetworkError,
  createApiError,
  createNetworkError,
} from "./errors"
