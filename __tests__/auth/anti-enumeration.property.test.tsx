import { describe, it, expect, vi, beforeEach } from "vitest"
import * as fc from "fast-check"
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react"
import React from "react"

// Feature: forgot-password-and-disable-github-oauth, Property 2: Anti-enumeration response consistency

/**
 * Property 2: Anti-enumeration response consistency
 * Validates: Requirements 2.6
 *
 * For any valid email address submitted to the forgot password form, regardless of whether
 * that email exists in the system or whether Supabase returns success or a "user not found"
 * style error, the UI SHALL display the same confirmation message text.
 */

// --- Mocks ---

const mockResetPasswordForEmail = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      resetPasswordForEmail: mockResetPasswordForEmail,
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
      signUp: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}))

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
  Toaster: () => React.createElement("div", { "data-testid": "toaster" }),
}))

// Import the component after mocks are set up
import LoginPage from "@/app/login/page"

// --- Generators ---

/** Generate valid email addresses that will pass client-side validation */
const validEmailArb = fc
  .tuple(
    fc.stringMatching(/^[a-z][a-z0-9]{0,19}$/),
    fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/),
    fc.constantFrom("com", "org", "net", "io", "co.uk", "dev")
  )
  .map(([local, domain, tld]) => `${local}@${domain}.${tld}`)

/** Generate Supabase response scenarios: success or "user not found" error */
const supabaseResponseArb = fc.oneof(
  // Success response
  fc.constant({ data: {}, error: null }),
  // "User not found" style errors
  fc.constantFrom(
    { data: null, error: { message: "User not found", status: 404 } },
    { data: null, error: { message: "Email not registered", status: 400 } },
    { data: null, error: { message: "Unable to validate email address: user not found", status: 422 } }
  )
)

// --- Tests ---

describe("Feature: forgot-password-and-disable-github-oauth, Property 2: Anti-enumeration response consistency", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock window.location
    Object.defineProperty(window, "location", {
      value: { origin: "http://localhost:3000", search: "", href: "" },
      writable: true,
    })
    // Mock window.history.replaceState
    window.history.replaceState = vi.fn()
  })

  /**
   * Validates: Requirements 2.6
   */
  it("displays the same confirmation message regardless of Supabase response (success or user not found)", { timeout: 60000 }, async () => {
    // First, capture the reference message from a successful response
    cleanup()
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null })

    const { unmount: refUnmount } = render(React.createElement(LoginPage))
    const refForgotLink = screen.getByRole("button", { name: /reset your password/i })
    fireEvent.click(refForgotLink)
    const refEmailInput = screen.getByPlaceholderText("Email")
    fireEvent.change(refEmailInput, { target: { value: "reference@test.com" } })
    const refSendButton = screen.getByRole("button", { name: /send reset link/i })
    fireEvent.click(refSendButton)

    let referenceMessage = ""
    await waitFor(() => {
      const statusMessage = screen.getByRole("status")
      referenceMessage = statusMessage.textContent || ""
      expect(referenceMessage).toContain("If an account exists")
    })
    refUnmount()

    // Now run the property test: for any email and any Supabase response,
    // the displayed message must be identical to the reference message
    await fc.assert(
      fc.asyncProperty(validEmailArb, supabaseResponseArb, async (email, response) => {
        cleanup()
        mockResetPasswordForEmail.mockResolvedValue(response)

        const { unmount } = render(React.createElement(LoginPage))

        // Click "Forgot password?" to toggle to the reset form
        const forgotLink = screen.getByRole("button", { name: /reset your password/i })
        fireEvent.click(forgotLink)

        // Enter the email
        const emailInput = screen.getByPlaceholderText("Email")
        fireEvent.change(emailInput, { target: { value: email } })

        // Click "Send reset link"
        const sendButton = screen.getByRole("button", { name: /send reset link/i })
        fireEvent.click(sendButton)

        // Wait for the confirmation message to appear
        await waitFor(() => {
          const statusMessage = screen.getByRole("status")
          expect(statusMessage.textContent).toBe(referenceMessage)
        })

        unmount()
      }),
      { numRuns: 100 }
    )
  })
})
