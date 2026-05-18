import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"

/**
 * Unit tests for the useIsMobile hook.
 * Validates: Requirements 1.1, 1.2, 1.3
 *
 * Tests that:
 * - The hook detects mobile viewport (< 768px)
 * - The hook returns false for desktop viewport (>= 768px)
 * - The hook responds to viewport changes dynamically
 * - The hook defaults to false for SSR safety
 * - The hook cleans up event listeners on unmount
 */

describe("useIsMobile hook", () => {
  let listeners: Array<(event: MediaQueryListEvent) => void> = []
  let matchesValue = false

  beforeEach(() => {
    listeners = []
    matchesValue = false

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: matchesValue,
        media: query,
        addEventListener: (_event: string, handler: (event: MediaQueryListEvent) => void) => {
          listeners.push(handler)
        },
        removeEventListener: (_event: string, handler: (event: MediaQueryListEvent) => void) => {
          listeners = listeners.filter((l) => l !== handler)
        },
      })),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("returns false when viewport is at or above 768px (desktop)", async () => {
    matchesValue = false
    const { useIsMobile } = await import("@/hooks/use-is-mobile")
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it("returns true when viewport is below 768px (mobile)", async () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        addEventListener: (_event: string, handler: (event: MediaQueryListEvent) => void) => {
          listeners.push(handler)
        },
        removeEventListener: vi.fn(),
      })),
    })

    const { useIsMobile } = await import("@/hooks/use-is-mobile")
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it("uses the correct media query string (max-width: 767px)", async () => {
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: matchMediaMock,
    })

    const { useIsMobile } = await import("@/hooks/use-is-mobile")
    renderHook(() => useIsMobile())
    expect(matchMediaMock).toHaveBeenCalledWith("(max-width: 767px)")
  })

  it("responds to viewport changes dynamically", async () => {
    matchesValue = false
    const { useIsMobile } = await import("@/hooks/use-is-mobile")
    const { result } = renderHook(() => useIsMobile())

    expect(result.current).toBe(false)

    // Simulate viewport shrinking to mobile
    act(() => {
      listeners.forEach((listener) =>
        listener({ matches: true } as MediaQueryListEvent)
      )
    })

    expect(result.current).toBe(true)

    // Simulate viewport expanding to desktop
    act(() => {
      listeners.forEach((listener) =>
        listener({ matches: false } as MediaQueryListEvent)
      )
    })

    expect(result.current).toBe(false)
  })

  it("cleans up event listener on unmount", async () => {
    const removeEventListenerMock = vi.fn()
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: removeEventListenerMock,
      })),
    })

    const { useIsMobile } = await import("@/hooks/use-is-mobile")
    const { unmount } = renderHook(() => useIsMobile())
    unmount()

    expect(removeEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function))
  })
})
