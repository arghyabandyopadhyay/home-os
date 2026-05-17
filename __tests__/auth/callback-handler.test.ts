import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Unit tests for Auth Callback Handler
 * Tests the GET handler at app/auth/callback/route.ts
 *
 * Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

// Mock the Supabase server client
const mockExchangeCodeForSession = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      exchangeCodeForSession: (...args: unknown[]) =>
        mockExchangeCodeForSession(...args),
    },
  }),
}))

// Mock next/headers cookies (required by createClient internally)
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}))

import { GET } from "@/app/auth/callback/route"

describe("Auth Callback Handler", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("redirects to /dashboard on successful code exchange", async () => {
    mockExchangeCodeForSession.mockResolvedValue({ error: null })

    const request = new Request(
      "http://localhost:3000/auth/callback?code=valid-code"
    )
    const response = await GET(request)

    expect(response.status).toBe(307)
    const redirectUrl = new URL(response.headers.get("location")!)
    expect(redirectUrl.pathname).toBe("/dashboard")
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("valid-code")
  })

  it("redirects to /login with error when code param is missing", async () => {
    const request = new Request("http://localhost:3000/auth/callback")
    const response = await GET(request)

    expect(response.status).toBe(307)
    const redirectUrl = new URL(response.headers.get("location")!)
    expect(redirectUrl.pathname).toBe("/login")
    expect(redirectUrl.searchParams.get("error_description")).toBe(
      "Authorization code missing"
    )
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
  })

  it("redirects to /login with provider error_description when error param is present", async () => {
    const request = new Request(
      "http://localhost:3000/auth/callback?error=access_denied&error_description=User+denied"
    )
    const response = await GET(request)

    expect(response.status).toBe(307)
    const redirectUrl = new URL(response.headers.get("location")!)
    expect(redirectUrl.pathname).toBe("/login")
    expect(redirectUrl.searchParams.get("error_description")).toBe(
      "User denied"
    )
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
  })

  it("redirects to /login with default message when error param is present but no error_description", async () => {
    const request = new Request(
      "http://localhost:3000/auth/callback?error=access_denied"
    )
    const response = await GET(request)

    expect(response.status).toBe(307)
    const redirectUrl = new URL(response.headers.get("location")!)
    expect(redirectUrl.pathname).toBe("/login")
    expect(redirectUrl.searchParams.get("error_description")).toBe(
      "Authentication was denied"
    )
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
  })

  it("redirects to /login with generic error when code exchange returns an error", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: "Invalid code" },
    })

    const request = new Request(
      "http://localhost:3000/auth/callback?code=bad-code"
    )
    const response = await GET(request)

    expect(response.status).toBe(307)
    const redirectUrl = new URL(response.headers.get("location")!)
    expect(redirectUrl.pathname).toBe("/login")
    expect(redirectUrl.searchParams.get("error_description")).toBe(
      "Authentication failed"
    )
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("bad-code")
  })

  it("redirects to /login with generic error when code exchange throws an exception", async () => {
    mockExchangeCodeForSession.mockRejectedValue(
      new Error("Network timeout")
    )

    const request = new Request(
      "http://localhost:3000/auth/callback?code=crash-code"
    )
    const response = await GET(request)

    expect(response.status).toBe(307)
    const redirectUrl = new URL(response.headers.get("location")!)
    expect(redirectUrl.pathname).toBe("/login")
    expect(redirectUrl.searchParams.get("error_description")).toBe(
      "Authentication failed"
    )
    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("crash-code")
  })
})
