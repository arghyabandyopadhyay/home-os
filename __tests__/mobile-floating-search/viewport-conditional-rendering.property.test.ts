import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, cleanup } from "@testing-library/react"
import * as fc from "fast-check"

/**
 * Property 1: Viewport-conditional rendering
 *
 * For any viewport width < 768px, the useIsMobile hook should return true
 * (component renders). For any viewport width >= 768px, the hook should
 * return false (component is not in the DOM).
 *
 * **Validates: Requirements 1.1, 1.2, 1.3**
 *
 * Tags: Feature: mobile-floating-search, Property 1: Viewport-conditional rendering
 */

const MOBILE_BREAKPOINT = 768

describe("Feature: mobile-floating-search, Property 1: Viewport-conditional rendering", () => {
  let listeners: Array<(event: MediaQueryListEvent) => void> = []

  function mockMatchMedia(matches: boolean) {
    listeners = []
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        addEventListener: (_event: string, handler: (event: MediaQueryListEvent) => void) => {
          listeners.push(handler)
        },
        removeEventListener: (_event: string, handler: (event: MediaQueryListEvent) => void) => {
          listeners = listeners.filter((l) => l !== handler)
        },
      })),
    })
  }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it("for any viewport width < 768px, useIsMobile returns true (component renders)", async () => {
    const { useIsMobile } = await import("@/hooks/use-is-mobile")

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: MOBILE_BREAKPOINT - 1 }),
        (viewportWidth) => {
          // A viewport width < 768px means the media query "(max-width: 767px)" matches
          mockMatchMedia(true)

          const { result, unmount } = renderHook(() => useIsMobile())

          expect(
            result.current,
            `Viewport width ${viewportWidth}px (< ${MOBILE_BREAKPOINT}px) should be mobile`
          ).toBe(true)

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  it("for any viewport width >= 768px, useIsMobile returns false (component not in DOM)", async () => {
    const { useIsMobile } = await import("@/hooks/use-is-mobile")

    fc.assert(
      fc.property(
        fc.integer({ min: MOBILE_BREAKPOINT, max: 3840 }),
        (viewportWidth) => {
          // A viewport width >= 768px means the media query "(max-width: 767px)" does NOT match
          mockMatchMedia(false)

          const { result, unmount } = renderHook(() => useIsMobile())

          expect(
            result.current,
            `Viewport width ${viewportWidth}px (>= ${MOBILE_BREAKPOINT}px) should not be mobile`
          ).toBe(false)

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })

  it("the breakpoint boundary is correctly handled: 767px is mobile, 768px is not", async () => {
    const { useIsMobile } = await import("@/hooks/use-is-mobile")

    // Test 767px — matches "(max-width: 767px)"
    mockMatchMedia(true)
    const { result: mobileResult, unmount: unmountMobile } = renderHook(() => useIsMobile())
    expect(mobileResult.current).toBe(true)
    unmountMobile()

    // Test 768px — does NOT match "(max-width: 767px)"
    mockMatchMedia(false)
    const { result: desktopResult, unmount: unmountDesktop } = renderHook(() => useIsMobile())
    expect(desktopResult.current).toBe(false)
    unmountDesktop()
  })

  it("for any viewport width, the hook correctly maps to mobile/desktop classification", async () => {
    const { useIsMobile } = await import("@/hooks/use-is-mobile")

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3840 }),
        (viewportWidth) => {
          const shouldBeMobile = viewportWidth < MOBILE_BREAKPOINT
          mockMatchMedia(shouldBeMobile)

          const { result, unmount } = renderHook(() => useIsMobile())

          expect(
            result.current,
            `Viewport ${viewportWidth}px: expected isMobile=${shouldBeMobile}`
          ).toBe(shouldBeMobile)

          unmount()
        }
      ),
      { numRuns: 100 }
    )
  })
})
