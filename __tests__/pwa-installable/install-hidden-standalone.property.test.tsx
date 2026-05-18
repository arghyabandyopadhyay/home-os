// Feature: pwa-installable, Property 4: Install option hidden in standalone mode

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render } from "@testing-library/react"
import * as fc from "fast-check"

/**
 * Property 4: Install option hidden in standalone mode
 *
 * For any application state where the app is running in standalone display mode
 * (isStandalone is true), the "Install App" option SHALL NOT be visible in the
 * settings page, regardless of whether a deferred prompt is available.
 *
 * **Validates: Requirements 6.6**
 */

// Mock the useInstallPrompt hook
const mockUseInstallPrompt = vi.fn()

vi.mock("@/hooks/use-install-prompt", () => ({
  useInstallPrompt: () => mockUseInstallPrompt(),
}))

// --- Arbitraries for generating test inputs ---

/** Platform values the hook can return */
const platformArb = fc.constantFrom("ios" as const, "android" as const, "desktop" as const, "unknown" as const)

/** canInstall can be true or false — property must hold regardless */
const canInstallArb = fc.boolean()

/** isPrompting can be true or false */
const isPromptingArb = fc.boolean()

/**
 * Generate random hook states where isStandalone is always true.
 * The property asserts that the component renders nothing regardless
 * of the other state values.
 */
const standaloneStateArb = fc.record({
  canInstall: canInstallArb,
  isStandalone: fc.constant(true),
  isPrompting: isPromptingArb,
  promptInstall: fc.constant(async () => {}),
  platform: platformArb,
})

// --- Tests ---

describe("Feature: pwa-installable, Property 4: Install option hidden in standalone mode", () => {
  beforeEach(() => {
    mockUseInstallPrompt.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("for any state where isStandalone=true, the InstallAppSection renders nothing regardless of canInstall value", async () => {
    const { InstallAppSection } = await import(
      "@/components/settings/install-app-section"
    )

    fc.assert(
      fc.property(standaloneStateArb, (state) => {
        mockUseInstallPrompt.mockReturnValue(state)

        const { container } = render(<InstallAppSection />)

        // Component should return null — container should be empty
        expect(container.innerHTML).toBe("")
      }),
      { numRuns: 100 }
    )
  })

  it("for any platform in standalone mode, no 'Install App' text is rendered", async () => {
    const { InstallAppSection } = await import(
      "@/components/settings/install-app-section"
    )

    fc.assert(
      fc.property(standaloneStateArb, (state) => {
        mockUseInstallPrompt.mockReturnValue(state)

        const { container } = render(<InstallAppSection />)

        // No "Install App" text should appear anywhere
        expect(container.textContent).not.toContain("Install App")
      }),
      { numRuns: 100 }
    )
  })

  it("for any combination of canInstall and isPrompting in standalone mode, no button is rendered", async () => {
    const { InstallAppSection } = await import(
      "@/components/settings/install-app-section"
    )

    fc.assert(
      fc.property(canInstallArb, isPromptingArb, platformArb, (canInstall, isPrompting, platform) => {
        mockUseInstallPrompt.mockReturnValue({
          canInstall,
          isStandalone: true,
          isPrompting,
          promptInstall: async () => {},
          platform,
        })

        const { container } = render(<InstallAppSection />)

        // No button element should be present
        const buttons = container.querySelectorAll("button")
        expect(buttons.length).toBe(0)
      }),
      { numRuns: 100 }
    )
  })

  it("for any iOS platform state in standalone mode, no manual instructions are rendered", async () => {
    const { InstallAppSection } = await import(
      "@/components/settings/install-app-section"
    )

    fc.assert(
      fc.property(canInstallArb, isPromptingArb, (canInstall, isPrompting) => {
        // Specifically test iOS in standalone — manual instructions should NOT appear
        mockUseInstallPrompt.mockReturnValue({
          canInstall,
          isStandalone: true,
          isPrompting,
          promptInstall: async () => {},
          platform: "ios",
        })

        const { container } = render(<InstallAppSection />)

        // No ordered list (manual instructions) should be present
        const lists = container.querySelectorAll("ol")
        expect(lists.length).toBe(0)
      }),
      { numRuns: 100 }
    )
  })
})
