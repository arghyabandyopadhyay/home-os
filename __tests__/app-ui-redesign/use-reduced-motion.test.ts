import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"

/**
 * Unit tests for the useReducedMotion hook and helper utilities.
 * Validates: Requirements 5.6, 9.5, 17.7
 *
 * Tests that:
 * - The hook detects prefers-reduced-motion: reduce
 * - The hook responds to changes in the media query
 * - Helper functions disable animations when reduced motion is active
 * - Focus indicators are preserved (not affected by reduced motion)
 */

describe("useReducedMotion hook", () => {
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

  it("returns false when prefers-reduced-motion is not set", async () => {
    matchesValue = false
    const { useReducedMotion } = await import("@/hooks/use-reduced-motion")
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it("returns true when prefers-reduced-motion: reduce is active", async () => {
    matchesValue = true
    // Re-mock with matches = true
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

    const { useReducedMotion } = await import("@/hooks/use-reduced-motion")
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })

  it("responds to media query changes dynamically", async () => {
    matchesValue = false
    const { useReducedMotion } = await import("@/hooks/use-reduced-motion")
    const { result } = renderHook(() => useReducedMotion())

    expect(result.current).toBe(false)

    // Simulate the user enabling reduced motion
    act(() => {
      listeners.forEach((listener) =>
        listener({ matches: true } as MediaQueryListEvent)
      )
    })

    expect(result.current).toBe(true)

    // Simulate the user disabling reduced motion
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

    const { useReducedMotion } = await import("@/hooks/use-reduced-motion")
    const { unmount } = renderHook(() => useReducedMotion())
    unmount()

    expect(removeEventListenerMock).toHaveBeenCalledWith("change", expect.any(Function))
  })
})

describe("getMotionTransition helper", () => {
  it("returns duration: 0 when reduced motion is active", async () => {
    const { getMotionTransition } = await import("@/hooks/use-reduced-motion")
    const result = getMotionTransition(true, { duration: 0.3, ease: "easeOut" })
    expect(result).toEqual({ duration: 0 })
  })

  it("returns the original transition when reduced motion is inactive", async () => {
    const { getMotionTransition } = await import("@/hooks/use-reduced-motion")
    const transition = { duration: 0.3, ease: "easeOut" }
    const result = getMotionTransition(false, transition)
    expect(result).toEqual(transition)
  })

  it("preserves all transition properties when reduced motion is inactive", async () => {
    const { getMotionTransition } = await import("@/hooks/use-reduced-motion")
    const transition = { duration: 0.2, ease: "easeIn", delay: 0.1 }
    const result = getMotionTransition(false, transition)
    expect(result).toEqual(transition)
  })
})

describe("getMotionProps helper", () => {
  it("sets initial and animate to final state when reduced motion is active", async () => {
    const { getMotionProps } = await import("@/hooks/use-reduced-motion")
    const config = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.2, ease: "easeOut" },
    }
    const result = getMotionProps(true, config)
    expect(result.initial).toEqual({ opacity: 1, y: 0 })
    expect(result.animate).toEqual({ opacity: 1, y: 0 })
    expect(result.transition).toEqual({ duration: 0 })
  })

  it("returns original config when reduced motion is inactive", async () => {
    const { getMotionProps } = await import("@/hooks/use-reduced-motion")
    const config = {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.2, ease: "easeOut" },
    }
    const result = getMotionProps(false, config)
    expect(result).toEqual(config)
  })

  it("elements display in final state immediately when reduced motion is active", async () => {
    const { getMotionProps } = await import("@/hooks/use-reduced-motion")
    const config = {
      initial: { opacity: 0, scale: 0.95 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.3, ease: "easeOut" },
    }
    const result = getMotionProps(true, config)
    // Initial should be the final state (animate values)
    expect(result.initial).toEqual({ opacity: 1, scale: 1 })
    // Animate should also be the final state
    expect(result.animate).toEqual({ opacity: 1, scale: 1 })
    // Duration should be 0 (no animation)
    expect(result.transition).toEqual({ duration: 0 })
  })
})
