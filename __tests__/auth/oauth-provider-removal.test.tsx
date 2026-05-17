import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import React from "react"
import { OAUTH_PROVIDERS } from "@/lib/auth/oauth-providers"

/**
 * Unit tests for OAuth provider removal (GitHub removed, Google only).
 * Validates: Requirements 5.1, 5.2, 5.3
 */

// Mock the Supabase client to prevent actual auth calls
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}))

// Import after mocks
import { OAuthButtonGroup } from "@/components/auth/oauth-button-group"

describe("OAuth provider removal", () => {
  describe("OAUTH_PROVIDERS configuration", () => {
    it("contains exactly one provider", () => {
      expect(OAUTH_PROVIDERS).toHaveLength(1)
    })

    it("contains only the Google provider with id 'google'", () => {
      expect(OAUTH_PROVIDERS[0].id).toBe("google")
      expect(OAUTH_PROVIDERS[0].name).toBe("Google")
      expect(OAUTH_PROVIDERS[0].label).toBe("Continue with Google")
    })

    it("does not contain a GitHub provider entry", () => {
      const githubProvider = OAUTH_PROVIDERS.find((p) => p.id === "github")
      expect(githubProvider).toBeUndefined()
    })
  })

  describe("OAuthButtonGroup rendering", () => {
    it("renders exactly one OAuth button with label 'Continue with Google'", () => {
      const { container } = render(
        React.createElement(OAuthButtonGroup, { onError: () => {} })
      )

      const buttons = container.querySelectorAll("button")
      expect(buttons).toHaveLength(1)
      expect(buttons[0].textContent).toContain("Continue with Google")
    })

    it("does not render a GitHub button in the DOM", () => {
      const { container } = render(
        React.createElement(OAuthButtonGroup, { onError: () => {} })
      )

      // No button with GitHub aria-label
      const githubButton = container.querySelector('[aria-label="Sign in with GitHub"]')
      expect(githubButton).toBeNull()

      // No button contains "GitHub" text
      const allButtons = container.querySelectorAll("button")
      allButtons.forEach((button) => {
        expect(button.textContent).not.toContain("GitHub")
      })
    })

    it("renders the Google button with correct aria-label", () => {
      const { container } = render(
        React.createElement(OAuthButtonGroup, { onError: () => {} })
      )

      const googleButton = container.querySelector('[aria-label="Sign in with Google"]')
      expect(googleButton).not.toBeNull()
    })
  })
})
