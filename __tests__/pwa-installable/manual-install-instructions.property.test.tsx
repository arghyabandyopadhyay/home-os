// Feature: pwa-installable, Property 5: Manual install instructions completeness

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render } from "@testing-library/react"
import * as fc from "fast-check"

/**
 * Property 5: Manual install instructions completeness
 *
 * For any platform where the beforeinstallprompt event is not supported and the
 * app is not running in standalone mode, the settings page SHALL display manual
 * installation instructions containing: the platform name (e.g., "iOS"), and at
 * minimum 2 numbered steps describing the installation process.
 *
 * **Validates: Requirements 6.7**
 */

// Mock the useInstallPrompt hook
vi.mock("@/hooks/use-install-prompt", () => ({
  useInstallPrompt: vi.fn(),
}))

describe("Feature: pwa-installable, Property 5: Manual install instructions completeness", () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("displays manual instructions with platform name and at least 2 numbered steps when beforeinstallprompt is not supported on iOS", async () => {
    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { InstallAppSection } = await import(
      "@/components/settings/install-app-section"
    )

    // Generate random isPrompting values to ensure instructions are shown
    // regardless of other state variations
    fc.assert(
      fc.property(fc.boolean(), (isPrompting) => {
        // Mock the hook to return iOS platform with no native install prompt
        // canInstall=false means beforeinstallprompt is not supported
        // isStandalone=false means app is not in standalone mode
        vi.mocked(useInstallPrompt).mockReturnValue({
          canInstall: false,
          isStandalone: false,
          isPrompting,
          promptInstall: vi.fn().mockResolvedValue(undefined),
          platform: "ios",
        })

        const { container, unmount } = render(<InstallAppSection />)

        // Verify the platform name "iOS" appears in the instructions
        const textContent = container.textContent ?? ""
        expect(textContent).toContain("iOS")

        // Verify at least 2 list items (numbered steps) are present
        const listItems = container.querySelectorAll("ol li")
        expect(listItems.length).toBeGreaterThanOrEqual(2)

        // Verify the instructions mention "Share" and "Add to Home Screen"
        expect(textContent).toContain("Share")
        expect(textContent).toContain("Add to Home Screen")

        unmount()
      }),
      { numRuns: 100 }
    )
  })

  it("instructions are always shown for iOS regardless of random isPrompting state variations", async () => {
    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { InstallAppSection } = await import(
      "@/components/settings/install-app-section"
    )

    // Generate random boolean combinations to verify robustness
    fc.assert(
      fc.property(fc.boolean(), fc.boolean(), (isPrompting, _randomBool) => {
        vi.mocked(useInstallPrompt).mockReturnValue({
          canInstall: false,
          isStandalone: false,
          isPrompting,
          promptInstall: vi.fn().mockResolvedValue(undefined),
          platform: "ios",
        })

        const { container, unmount } = render(<InstallAppSection />)

        // The component should render (not return null)
        expect(container.innerHTML).not.toBe("")

        // Ordered list with numbered steps must be present
        const orderedList = container.querySelector("ol")
        expect(orderedList).not.toBeNull()

        // At least 2 steps
        const steps = orderedList!.querySelectorAll("li")
        expect(steps.length).toBeGreaterThanOrEqual(2)

        // Platform name present
        const textContent = container.textContent ?? ""
        expect(textContent).toContain("iOS")

        unmount()
      }),
      { numRuns: 100 }
    )
  })
})
