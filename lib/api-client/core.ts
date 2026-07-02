import type { ApiClient, TokenProvider, RequestOptions, MutationOptions } from "./types"
import { createApiError, createNetworkError } from "./errors"
import type { ApiErrorCode } from "./errors"
import { getWorkspaceHeaders } from "@/lib/api-client/workspace-header"

const DEFAULT_TIMEOUT_MS = 30_000

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_GATEWAY_URL
  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_API_GATEWAY_URL is not set. " +
        "Please configure the API Gateway URL in your environment variables."
    )
  }
  return url.replace(/\/+$/, "")
}

function buildUrl(
  baseUrl: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): string {
  const url = new URL(path, baseUrl)

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }
  }

  return url.toString()
}

function mapStatusToErrorCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return "VALIDATION_ERROR"
    case 401:
      return "UNAUTHORIZED"
    case 403:
      return "FORBIDDEN"
    case 404:
      return "NOT_FOUND"
    case 422:
      return "VALIDATION_ERROR"
    case 429:
      return "RATE_LIMITED"
    default:
      return status >= 500 ? "SERVER_ERROR" : "UNKNOWN"
  }
}

async function parseErrorResponse(response: Response) {
  const status = response.status
  const code = mapStatusToErrorCode(status)

  let message = response.statusText || "Request failed"
  let fields: { field: string; message: string; code?: string }[] | undefined
  let retryAfter: number | undefined

  // Parse retry-after header for 429 responses
  if (status === 429) {
    const retryAfterHeader = response.headers.get("Retry-After")
    if (retryAfterHeader) {
      const parsed = Number(retryAfterHeader)
      if (!Number.isNaN(parsed)) {
        retryAfter = parsed
      }
    }
  }

  try {
    const body = await response.json()

    if (body.message && typeof body.message === "string") {
      message = body.message
    }

    // Parse field-level errors for 422 responses
    if (status === 422 && Array.isArray(body.errors)) {
      fields = body.errors.map(
        (err: { field?: string; message?: string; code?: string }) => ({
          field: err.field ?? "unknown",
          message: err.message ?? "Validation failed",
          ...(err.code && { code: err.code }),
        })
      )
    }
  } catch {
    // Body not parseable as JSON — use defaults
  }

  return createApiError({ status, code, message, fields, retryAfter })
}

async function executeFetch(
  method: string,
  url: string,
  token: string | null,
  body: unknown | undefined,
  signal: AbortSignal | undefined,
  timeout: number
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  // If user passed an external signal, abort our controller when it fires
  if (signal) {
    if (signal.aborted) {
      controller.abort(signal.reason)
    } else {
      signal.addEventListener("abort", () => controller.abort(signal.reason), {
        once: true,
      })
    }
  }

  const headers: Record<string, string> = {}

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  if (body !== undefined) {
    headers["Content-Type"] = "application/json"
  }

  Object.assign(headers, getWorkspaceHeaders())

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

export function createApiClient(tokenProvider: TokenProvider): ApiClient {
  const baseUrl = getBaseUrl()

  async function request<T>(
    method: string,
    path: string,
    options?: RequestOptions | MutationOptions
  ): Promise<T> {
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT_MS
    const params = options?.params
    const signal = options?.signal
    const body = (options as MutationOptions)?.body

    const url = buildUrl(baseUrl, path, params)

    let token: string | null
    try {
      token = await tokenProvider.getToken()
    } catch {
      token = null
    }

    let response: Response
    try {
      response = await executeFetch(method, url, token, body, signal, timeout)
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw createNetworkError({
          message: "Request timeout",
          cause: error,
        })
      }
      throw createNetworkError({
        message: "Network unavailable",
        cause: error,
      })
    }

    // Handle 401 — attempt token refresh and retry once
    if (response.status === 401) {
      let newToken: string | null
      try {
        newToken = await tokenProvider.refreshToken()
      } catch {
        newToken = null
      }

      if (newToken) {
        let retryResponse: Response
        try {
          retryResponse = await executeFetch(
            method,
            url,
            newToken,
            body,
            signal,
            timeout
          )
        } catch (error: unknown) {
          if (error instanceof DOMException && error.name === "AbortError") {
            throw createNetworkError({
              message: "Request timeout",
              cause: error,
            })
          }
          throw createNetworkError({
            message: "Network unavailable",
            cause: error,
          })
        }

        if (retryResponse.ok) {
          const text = await retryResponse.text()
          return text ? (JSON.parse(text) as T) : (undefined as unknown as T)
        }

        // Retry also failed — throw the error from the retry
        throw await parseErrorResponse(retryResponse)
      }

      // No new token available — throw 401 error from original response
      throw await parseErrorResponse(response)
    }

    // Non-2xx (other than 401) → throw typed ApiError
    if (!response.ok) {
      throw await parseErrorResponse(response)
    }

    // Success — parse response body
    const text = await response.text()
    return text ? (JSON.parse(text) as T) : (undefined as unknown as T)
  }

  return {
    get: <T>(path: string, options?: RequestOptions) =>
      request<T>("GET", path, options),
    post: <T>(path: string, options?: MutationOptions) =>
      request<T>("POST", path, options),
    put: <T>(path: string, options?: MutationOptions) =>
      request<T>("PUT", path, options),
    patch: <T>(path: string, options?: MutationOptions) =>
      request<T>("PATCH", path, options),
    delete: <T>(path: string, options?: RequestOptions) =>
      request<T>("DELETE", path, options),
  }
}
