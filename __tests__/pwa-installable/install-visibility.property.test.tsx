// Feature: pwa-installable, Property 3: Install option visibility when installable and not standalone

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import * as fc from "fast-check"

/**
 * Property 3: Install option visibility when installable and not standalone
 *
 * For any application state where the deferred install prompt is available
 * (canInstall is true) and the app is NOT running in standalone display mode
 * (isStandalone is false), the "Install App" option SHALL be visible in the
 * settings page.
 *
 * **Validates: Requirements 6.2**
 */

// Mock the useInstallPrompt hook
vi.mock("@/hooks/use-install-prompt", () => ({
  useInstallPrompt: vi.fn(),
}))

import { useInstallPrompt } from "@/hooks/use-install-prompt"
import { InstallAppSection } from "@/components/settings/install-app-section"

const mockedUseInstallPrompt = vi.mocked(useInstallPrompt)

/** Arbitrary for platform values */
const platformArb = fc.constantFrom("ios" as const, "android" as const, "desktop" as const, "unknown" as const)

/** Arbitrary for isPrompting boolean */
const isPromptingArb = fc.boolean()

describe("Feature: pwa-installable, Property 3: Install option visibility when installable and not standalone", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("for any state where canInstall=true and isStandalone=false, the 'Install App' option is visible", () => {
    fc.assert(
      fc.property(
        platformArb,
        isPromptingArb,
        (platform, isPrompting) => {
          mockedUseInstallPrompt.mockReturnValue({
            canInstall: true,
            isStandalone: false,
            isPrompting,
            promptInstall: vi.fn().mockResolvedValue(undefined),
            platform,
          })

          const { unmount } = render(<InstallAppSection />)

          // The "Install App" heading text should always be visible
          const heading = screen.getByText("Install App", { selector: "h2" })
          expect(heading).toBeDefined()

          // The install button should be visible (text varies based on isPrompting)
          const buttonText = isPrompting ? "Installing…" : "Install App"
          const button = screen.getByRole("button", { name: buttonText })
          expect(button).toBeDefined()

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  it("the install button is present regardless of platform when canInstall=true and isStandalone=false", () => {
    fc.assert(
      fc.property(
        platformArb,
        (platform) => {
          mockedUseInstallPrompt.mockReturnValue({
            canInstall: true,
            isStandalone: false,
            isPrompting: false,
            promptInstall: vi.fn().mockResolvedValue(undefined),
            platform,
          })

          const { unmount } = render(<InstallAppSection />)

          // The install button should be visible for all platforms when canInstall is true
          const button = screen.getByRole("button", { name: "Install App" })
          expect(button).toBeDefined()
          expect(button.getAttribute("disabled")).toBeNull()

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  it("the install button is disabled when isPrompting=true", () => {
    fc.assert(
      fc.property(
        platformArb,
        (platform) => {
          mockedUseInstallPrompt.mockReturnValue({
            canInstall: true,
            isStandalone: false,
            isPrompting: true,
            promptInstall: vi.fn().mockResolvedValue(undefined),
            platform,
          })

          const { unmount } = render(<InstallAppSection />)

          // The button should be disabled while prompting
          const button = screen.getByRole("button", { name: "Installing…" })
          expect(button).toBeDefined()
          expect(button.hasAttribute("disabled")).toBe(true)

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })
})
