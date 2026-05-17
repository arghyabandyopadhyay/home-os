import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react"
import React from "react"

/**
 * Unit tests for the Reset Password page.
 * Validates: Requirements 3.1, 3.3, 3.4, 3.5, 3.6, 3.7
 */

// --- Mocks ---

const mockReplace = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}))

const mockGetUser = vi.fn()
const mockGetAuthenticatorAssuranceLevel = vi.fn()
const mockUpdateUser = vi.fn()

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser,
      mfa: {
        getAuthenticatorAssuranceLevel: mockGetAuthenticatorAssuranceLevel,
      },
      updateUser: mockUpdateUser,
    },
  }),
}))

const mockToastSuccess = vi.fn()
const mockToastError = vi.fn()

vi.mock("sonner", () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
  Toaster: () => React.createElement("div", { "data-testid": "toaster" }),
}))

// Import after mocks
import ResetPasswordPage from "@/app/reset-password/page"

// Helper: set up mocks for a valid recovery session
function mockRecoverySession() {
  mockGetUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "test@example.com" } },
    error: null,
  })
  mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
    data: {
      currentAuthenticationMethods: [{ method: "recovery" }],
    },
  })
}

describe("Reset Password Page", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe("Rendering (Requirement 3.1)", () => {
    it('renders "New password" and "Confirm password" input fields', async () => {
      mockRecoverySession()

      await act(async () => {
        render(React.createElement(ResetPasswordPage))
      })

      const newPasswordInput = screen.getByLabelText("New password")
      const confirmPasswordInput = screen.getByLabelText("Confirm password")

      expect(newPasswordInput).toBeDefined()
      expect(newPasswordInput.getAttribute("type")).toBe("password")
      expect(confirmPasswordInput).toBeDefined()
      expect(confirmPasswordInput.getAttribute("type")).toBe("password")
    })

    it('renders the heading "Set new password"', async () => {
      mockRecoverySession()

      await act(async () => {
        render(React.createElement(ResetPasswordPage))
      })

      expect(screen.getByText("Set new password")).toBeDefined()
    })

    it('renders the subheading "Enter your new password below"', async () => {
      mockRecoverySession()

      await act(async () => {
        render(React.createElement(ResetPasswordPage))
      })

      expect(screen.getByText("Enter your new password below")).toBeDefined()
    })
  })

  describe("Validation errors (Requirements 3.4, 3.5, 3.6)", () => {
    it("displays error when passwords do not match", async () => {
      mockRecoverySession()
      mockUpdateUser.mockResolvedValue({ error: null })

      await act(async () => {
        render(React.createElement(ResetPasswordPage))
      })

      const newPasswordInput = screen.getByLabelText("New password")
      const confirmPasswordInput = screen.getByLabelText("Confirm password")

      fireEvent.change(newPasswordInput, { target: { value: "password123" } })
      fireEvent.change(confirmPasswordInput, { target: { value: "different456" } })

      const submitButton = screen.getByRole("button", { name: /update password/i })
      await act(async () => {
        fireEvent.click(submitButton)
      })

      expect(screen.getByText("Passwords do not match")).toBeDefined()
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })

    it("displays error when password is too short (fewer than 6 characters)", async () => {
      mockRecoverySession()

      await act(async () => {
        render(React.createElement(ResetPasswordPage))
      })

      const newPasswordInput = screen.getByLabelText("New password")
      const confirmPasswordInput = screen.getByLabelText("Confirm password")

      fireEvent.change(newPasswordInput, { target: { value: "abc" } })
      fireEvent.change(confirmPasswordInput, { target: { value: "abc" } })

      const submitButton = screen.getByRole("button", { name: /update password/i })
      await act(async () => {
        fireEvent.click(submitButton)
      })

      expect(screen.getByText("Password must be at least 6 characters")).toBeDefined()
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })

    it("displays error when password exceeds 128 characters", async () => {
      mockRecoverySession()

      await act(async () => {
        render(React.createElement(ResetPasswordPage))
      })

      const longPassword = "a".repeat(129)
      const newPasswordInput = screen.getByLabelText("New password")
      const confirmPasswordInput = screen.getByLabelText("Confirm password")

      fireEvent.change(newPasswordInput, { target: { value: longPassword } })
      fireEvent.change(confirmPasswordInput, { target: { value: longPassword } })

      const submitButton = screen.getByRole("button", { name: /update password/i })
      await act(async () => {
        fireEvent.click(submitButton)
      })

      expect(screen.getByText("Password must not exceed 128 characters")).toBeDefined()
      expect(mockUpdateUser).not.toHaveBeenCalled()
    })
  })

  describe("Successful password update (Requirement 3.3)", () => {
    it("shows success toast and redirects to /dashboard after update", async () => {
      mockRecoverySession()
      mockUpdateUser.mockResolvedValue({ error: null })

      await act(async () => {
        render(React.createElement(ResetPasswordPage))
      })

      const newPasswordInput = screen.getByLabelText("New password")
      const confirmPasswordInput = screen.getByLabelText("Confirm password")

      fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } })
      fireEvent.change(confirmPasswordInput, { target: { value: "newpassword123" } })

      const submitButton = screen.getByRole("button", { name: /update password/i })
      await act(async () => {
        fireEvent.click(submitButton)
      })

      expect(mockUpdateUser).toHaveBeenCalledWith({ password: "newpassword123" })
      expect(mockToastSuccess).toHaveBeenCalledWith("Password updated successfully!")

      // Advance timers to trigger the redirect
      await act(async () => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockReplace).toHaveBeenCalledWith("/dashboard")
    })
  })

  describe("Expired token error (Requirement 3.7)", () => {
    it("shows expired token message with link to login when token is expired", async () => {
      mockRecoverySession()
      mockUpdateUser.mockResolvedValue({
        error: { message: "Token has expired or is invalid" },
      })

      await act(async () => {
        render(React.createElement(ResetPasswordPage))
      })

      const newPasswordInput = screen.getByLabelText("New password")
      const confirmPasswordInput = screen.getByLabelText("Confirm password")

      fireEvent.change(newPasswordInput, { target: { value: "newpassword123" } })
      fireEvent.change(confirmPasswordInput, { target: { value: "newpassword123" } })

      const submitButton = screen.getByRole("button", { name: /update password/i })
      await act(async () => {
        fireEvent.click(submitButton)
      })

      expect(screen.getByText(/reset link has expired or is invalid/i)).toBeDefined()

      const link = screen.getByRole("link", { name: /request a new one/i })
      expect(link).toBeDefined()
      expect(link.getAttribute("href")).toBe("/login")
    })
  })

  describe("Session handling", () => {
    it("redirects to /login when no session exists", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: "No session" },
      })

      await act(async () => {
        render(React.createElement(ResetPasswordPage))
      })

      expect(mockReplace).toHaveBeenCalledWith("/login")
    })

    it("redirects to /dashboard when session is not a recovery session", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-1", email: "test@example.com" } },
        error: null,
      })
      mockGetAuthenticatorAssuranceLevel.mockResolvedValue({
        data: {
          currentAuthenticationMethods: [{ method: "password" }],
        },
      })

      await act(async () => {
        render(React.createElement(ResetPasswordPage))
      })

      expect(mockReplace).toHaveBeenCalledWith("/dashboard")
    })
  })
})
