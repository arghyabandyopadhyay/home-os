/**
 * Shared request/response types for the API client.
 * Used by both server and client token providers.
 */

export type RequestOptions = {
  token?: string
  params?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
  timeout?: number
}

export type MutationOptions = RequestOptions & {
  body?: unknown
}

export type ApiClient = {
  get: <T>(path: string, options?: RequestOptions) => Promise<T>
  post: <T>(path: string, options?: MutationOptions) => Promise<T>
  put: <T>(path: string, options?: MutationOptions) => Promise<T>
  patch: <T>(path: string, options?: MutationOptions) => Promise<T>
  delete: <T>(path: string, options?: RequestOptions) => Promise<T>
}

export type TokenProvider = {
  getToken: () => Promise<string | null>
  refreshToken: () => Promise<string | null>
}
