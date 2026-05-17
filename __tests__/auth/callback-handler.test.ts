import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Unit tests for Auth Callback Handler
 * Tests the GET handler at app/auth/callback/route.ts
 *
 * Validates: Requirements 4.3, 4.4, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
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

  describe("Recovery flow (type=recovery)", () => {
    /**
     * Validates: Requirement 4.3
     * WHEN the Auth_Callback_Handler receives a callback with type=recovery
     * and code exchange succeeds, it SHALL redirect to /reset-password
     */
    it("redirects to /reset-password when type=recovery and code exchange succeeds", async () => {
      mockExchangeCodeForSession.mockResolvedValue({ error: null })

      const request = new Request(
        "http://localhost:3000/auth/callback?code=recovery-code&type=recovery"
      )
      const response = await GET(request)

      expect(response.status).toBe(307)
      const redirectUrl = new URL(response.headers.get("location")!)
      expect(redirectUrl.pathname).toBe("/reset-password")
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith("recovery-code")
    })

    /**
     * Validates: Requirement 4.4
     * IF the Auth_Callback_Handler receives a type=recovery callback and the
     * code exchange fails, it SHALL redirect to /login with expired link error
     */
    it("redirects to /login with expired link error when type=recovery and code exchange fails", async () => {
      mockExchangeCodeForSession.mockResolvedValue({
        error: { message: "Invalid or expired code" },
      })

      const request = new Request(
        "http://localhost:3000/auth/callback?code=expired-code&type=recovery"
      )
      const response = await GET(request)

      expect(response.status).toBe(307)
      const redirectUrl = new URL(response.headers.get("location")!)
      expect(redirectUrl.pathname).toBe("/login")
      expect(redirectUrl.searchParams.get("error_description")).toBe(
        "Reset link has expired. Please request a new one."
      )
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith("expired-code")
    })

    /**
     * Validates: Requirement 4.4
     * IF the code exchange throws an exception during recovery,
     * it SHALL redirect to /login with expired link error
     */
    it("redirects to /login with expired link error when type=recovery and code exchange throws", async () => {
      mockExchangeCodeForSession.mockRejectedValue(
        new Error("Network error")
      )

      const request = new Request(
        "http://localhost:3000/auth/callback?code=throw-code&type=recovery"
      )
      const response = await GET(request)

      expect(response.status).toBe(307)
      const redirectUrl = new URL(response.headers.get("location")!)
      expect(redirectUrl.pathname).toBe("/login")
      expect(redirectUrl.searchParams.get("error_description")).toBe(
        "Reset link has expired. Please request a new one."
      )
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith("throw-code")
    })

    /**
     * Validates: Requirement 4.4
     * IF type=recovery and no code is provided, redirect to /login with expired link error
     */
    it("redirects to /login with expired link error when type=recovery and code is missing", async () => {
      const request = new Request(
        "http://localhost:3000/auth/callback?type=recovery"
      )
      const response = await GET(request)

      expect(response.status).toBe(307)
      const redirectUrl = new URL(response.headers.get("location")!)
      expect(redirectUrl.pathname).toBe("/login")
      expect(redirectUrl.searchParams.get("error_description")).toBe(
        "Reset link has expired. Please request a new one."
      )
      expect(mockExchangeCodeForSession).not.toHaveBeenCalled()
    })

    /**
     * Validates: Requirement 4.3 (non-recovery still goes to /dashboard)
     * Non-recovery callbacks with successful code exchange still redirect to /dashboard
     */
    it("non-recovery callbacks still redirect to /dashboard on success", async () => {
      mockExchangeCodeForSession.mockResolvedValue({ error: null })

      const request = new Request(
        "http://localhost:3000/auth/callback?code=oauth-code&type=signup"
      )
      const response = await GET(request)

      expect(response.status).toBe(307)
      const redirectUrl = new URL(response.headers.get("location")!)
      expect(redirectUrl.pathname).toBe("/dashboard")
      expect(mockExchangeCodeForSession).toHaveBeenCalledWith("oauth-code")
    })
  })
})
