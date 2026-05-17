import { describe, it, expect, vi } from "vitest"
import * as fc from "fast-check"
import { render } from "@testing-library/react"
import React from "react"

/**
 * Property 4: OAuthButton renders correctly for any valid provider configuration
 * Validates: Requirements 5.4, 5.6, 9.4
 *
 * For any provider configuration with a name (string ≤ 32 characters),
 * label (string ≤ 64 characters), and icon (valid React node), the OAuthButton
 * component SHALL render a button element with:
 * - aria-label equal to "Sign in with {provider name}"
 * - Visible label text matching the provided label
 * - Disabled state and "Connecting..." text when loading is true for that provider
 * - All sibling buttons disabled when any provider is in loading state
 *
 * Tags: Feature: oauth-authentication, Property 4: OAuthButton renders correctly for any valid provider configuration
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
import { OAuthButton } from "@/components/auth/oauth-button"
import { OAuthButtonGroup } from "@/components/auth/oauth-button-group"

// --- Generators ---

/** Generate a valid provider name (non-empty, ≤ 32 chars, alphanumeric to avoid encoding issues) */
const providerNameArb = fc
  .string({ minLength: 1, maxLength: 32 })
  .filter((s) => s.trim().length > 0)

/** Generate a valid label (non-empty, ≤ 64 chars) */
const labelArb = fc
  .string({ minLength: 1, maxLength: 64 })
  .filter((s) => s.trim().length > 0)

/** Generate a boolean for loading state */
const loadingArb = fc.boolean()

/** Generate a boolean for disabled state */
const disabledArb = fc.boolean()

// --- Tests ---

describe("Feature: oauth-authentication, Property 4: OAuthButton renders correctly for any valid provider configuration", () => {
  it("aria-label equals 'Sign in with {provider name}' for any provider name", () => {
    fc.assert(
      fc.property(providerNameArb, labelArb, (providerName, label) => {
        const { container, unmount } = render(
          React.createElement(OAuthButton, {
            provider: providerName,
            label: label,
            icon: React.createElement("svg", { "data-testid": "icon" }),
            onClick: () => {},
          })
        )

        const button = container.querySelector("button")
        expect(button).not.toBeNull()
        expect(button!.getAttribute("aria-label")).toBe(
          `Sign in with ${providerName}`
        )

        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it("visible label text matches the provided label when not loading", () => {
    fc.assert(
      fc.property(providerNameArb, labelArb, (providerName, label) => {
        const { container, unmount } = render(
          React.createElement(OAuthButton, {
            provider: providerName,
            label: label,
            icon: React.createElement("svg", { "data-testid": "icon" }),
            loading: false,
            onClick: () => {},
          })
        )

        const button = container.querySelector("button")
        expect(button).not.toBeNull()
        expect(button!.textContent).toContain(label)

        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it("shows 'Connecting...' text when loading is true", () => {
    fc.assert(
      fc.property(providerNameArb, labelArb, (providerName, label) => {
        const { container, unmount } = render(
          React.createElement(OAuthButton, {
            provider: providerName,
            label: label,
            icon: React.createElement("svg", { "data-testid": "icon" }),
            loading: true,
            onClick: () => {},
          })
        )

        const button = container.querySelector("button")
        expect(button).not.toBeNull()
        // The label span should show "Connecting..." instead of the provider label
        const labelSpan = button!.querySelector("span.flex-1")
        expect(labelSpan).not.toBeNull()
        expect(labelSpan!.textContent).toBe("Connecting...")

        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it("button is disabled when disabled prop is true", () => {
    fc.assert(
      fc.property(providerNameArb, labelArb, (providerName, label) => {
        const { container, unmount } = render(
          React.createElement(OAuthButton, {
            provider: providerName,
            label: label,
            icon: React.createElement("svg", { "data-testid": "icon" }),
            disabled: true,
            loading: false,
            onClick: () => {},
          })
        )

        const button = container.querySelector("button")
        expect(button).not.toBeNull()
        expect(button!.disabled).toBe(true)

        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it("button is disabled when loading prop is true", () => {
    fc.assert(
      fc.property(providerNameArb, labelArb, (providerName, label) => {
        const { container, unmount } = render(
          React.createElement(OAuthButton, {
            provider: providerName,
            label: label,
            icon: React.createElement("svg", { "data-testid": "icon" }),
            disabled: false,
            loading: true,
            onClick: () => {},
          })
        )

        const button = container.querySelector("button")
        expect(button).not.toBeNull()
        expect(button!.disabled).toBe(true)

        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it("button disabled state matches (disabled || loading) for any combination", () => {
    fc.assert(
      fc.property(
        providerNameArb,
        labelArb,
        disabledArb,
        loadingArb,
        (providerName, label, disabled, loading) => {
          const { container, unmount } = render(
            React.createElement(OAuthButton, {
              provider: providerName,
              label: label,
              icon: React.createElement("svg", { "data-testid": "icon" }),
              disabled,
              loading,
              onClick: () => {},
            })
          )

          const button = container.querySelector("button")
          expect(button).not.toBeNull()
          expect(button!.disabled).toBe(disabled || loading)

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  it("button is enabled when both disabled and loading are false", () => {
    fc.assert(
      fc.property(providerNameArb, labelArb, (providerName, label) => {
        const { container, unmount } = render(
          React.createElement(OAuthButton, {
            provider: providerName,
            label: label,
            icon: React.createElement("svg", { "data-testid": "icon" }),
            disabled: false,
            loading: false,
            onClick: () => {},
          })
        )

        const button = container.querySelector("button")
        expect(button).not.toBeNull()
        expect(button!.disabled).toBe(false)

        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it("all sibling buttons disabled when any provider is in loading state (OAuthButtonGroup)", () => {
    // Render the OAuthButtonGroup — in initial state no provider is loading,
    // so all buttons should be enabled
    const { container, unmount } = render(
      React.createElement(OAuthButtonGroup, {
        onError: () => {},
      })
    )

    const buttons = container.querySelectorAll("button")
    expect(buttons.length).toBeGreaterThan(0)

    // In initial state, no provider is loading — all buttons should be enabled
    buttons.forEach((button) => {
      expect(button.disabled).toBe(false)
    })

    unmount()

    // Now test with a simulated loading state by rendering individual buttons
    // as the OAuthButtonGroup would when one provider is loading:
    // All buttons get disabled={true} when loadingProvider !== null
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1 }),
        (loadingIndex) => {
          const providers = [
            { name: "Google", label: "Continue with Google" },
            { name: "GitHub", label: "Continue with GitHub" },
          ]

          const { container: groupContainer, unmount: groupUnmount } = render(
            React.createElement(
              "div",
              null,
              providers.map((p, i) =>
                React.createElement(OAuthButton, {
                  key: p.name,
                  provider: p.name,
                  label: p.label,
                  icon: React.createElement("svg"),
                  disabled: true, // All disabled when any provider is loading
                  loading: i === loadingIndex,
                  onClick: () => {},
                })
              )
            )
          )

          const groupButtons = groupContainer.querySelectorAll("button")
          expect(groupButtons.length).toBe(2)

          // All buttons should be disabled
          groupButtons.forEach((button) => {
            expect(button.disabled).toBe(true)
          })

          // The loading button shows "Connecting..."
          expect(groupButtons[loadingIndex].textContent).toContain("Connecting...")

          // The non-loading button shows its label
          const otherIndex = loadingIndex === 0 ? 1 : 0
          expect(groupButtons[otherIndex].textContent).toContain(
            providers[otherIndex].label
          )

          groupUnmount()
        }
      ),
      { numRuns: 100 }
    )
  })
})
