// ─── Error Code Types ────────────────────────────────────────────────────────

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "UNKNOWN"

// ─── Field Error Type ────────────────────────────────────────────────────────

export type FieldError = {
  field: string
  message: string
  code?: string
}

// ─── Discriminated Union Types ───────────────────────────────────────────────

export type ApiError = {
  type: "api"
  status: number
  code: ApiErrorCode
  message: string
  fields?: FieldError[]
  retryAfter?: number
}

export type NetworkError = {
  type: "network"
  message: string
  cause?: unknown
}

export type ApiClientError = ApiError | NetworkError

// ─── Type Guards ─────────────────────────────────────────────────────────────

export function isApiError(error: ApiClientError): error is ApiError {
  return error.type === "api"
}

export function isNetworkError(error: ApiClientError): error is NetworkError {
  return error.type === "network"
}

// ─── Constructor Helpers ─────────────────────────────────────────────────────

export function createApiError(params: {
  status: number
  code: ApiErrorCode
  message: string
  fields?: FieldError[]
  retryAfter?: number
}): ApiError {
  return {
    type: "api",
    status: params.status,
    code: params.code,
    message: params.message,
    ...(params.fields && { fields: params.fields }),
    ...(params.retryAfter !== undefined && { retryAfter: params.retryAfter }),
  }
}

export function createNetworkError(params: {
  message: string
  cause?: unknown
}): NetworkError {
  return {
    type: "network",
    message: params.message,
    ...(params.cause !== undefined && { cause: params.cause }),
  }
}
