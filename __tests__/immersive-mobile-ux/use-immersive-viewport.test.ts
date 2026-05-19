import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useImmersiveViewport } from "@/hooks/use-immersive-viewport"

/**
 * Unit tests for the useImmersiveViewport hook.
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11
 *
 * Tests that:
 * - The hook returns correct initial viewport state
 * - Keyboard detection works based on 150px threshold
 * - PWA standalone detection works via media query and navigator.standalone
 * - Orientation detection works
 * - Resize events are throttled via requestAnimationFrame
 * - Orientation change is debounced by 100ms
 * - Passive event listeners are used
 * - All listeners are cleaned up on unmount
 */

describe("useImmersiveViewport hook", () => {
  let addEventListenerSpy: ReturnType<typeof vi.spyOn>
  let removeEventListenerSpy: ReturnType<typeof vi.spyOn>
  let rafCallbacks: FrameRequestCallback[] = []

  beforeEach(() => {
    rafCallbacks = []

    // Define requestAnimationFrame and cancelAnimationFrame on globalThis
    // (jsdom doesn't provide them by default)
    globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback) => {
      rafCallbacks.push(cb)
      return rafCallbacks.length
    }) as unknown as typeof globalThis.requestAnimationFrame
    globalThis.cancelAnimationFrame = vi.fn() as unknown as typeof globalThis.cancelAnimationFrame

    // Mock window.innerHeight (layout viewport)
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 800,
    })

    // Mock window.visualViewport
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: {
        height: 800,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    })

    // Mock screen.orientation
    Object.defineProperty(screen, "orientation", {
      writable: true,
      configurable: true,
      value: { type: "portrait-primary" },
    })

    // Mock matchMedia
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(orientation: portrait)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    // Spy on window event listeners
    addEventListenerSpy = vi.spyOn(window, "addEventListener")
    removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it("returns correct initial viewport state on mount", () => {
    const { result } = renderHook(() => useImmersiveViewport())

    expect(result.current.viewportHeight).toBe(800)
    expect(result.current.isKeyboardOpen).toBe(false)
    expect(result.current.isStandalone).toBe(false)
    expect(result.current.orientation).toBe("portrait")
  })

  it("detects keyboard open when visual viewport is ≥ 150px smaller than layout viewport", () => {
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: {
        height: 600, // 200px smaller → keyboard open
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    })

    const { result } = renderHook(() => useImmersiveViewport())

    expect(result.current.isKeyboardOpen).toBe(true)
    expect(result.current.viewportHeight).toBe(600)
  })

  it("does not detect keyboard when difference is less than 150px", () => {
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: {
        height: 700, // 100px smaller → not keyboard
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    })

    const { result } = renderHook(() => useImmersiveViewport())

    expect(result.current.isKeyboardOpen).toBe(false)
  })

  it("detects keyboard at exactly 150px threshold", () => {
    Object.defineProperty(window, "innerHeight", {
      value: 800,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: {
        height: 650, // exactly 150px smaller → keyboard open
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    })

    const { result } = renderHook(() => useImmersiveViewport())

    expect(result.current.isKeyboardOpen).toBe(true)
  })

  it("detects PWA standalone mode via media query", () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches:
          query === "(display-mode: standalone)" ||
          query === "(orientation: portrait)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    const { result } = renderHook(() => useImmersiveViewport())

    expect(result.current.isStandalone).toBe(true)
  })

  it("detects PWA standalone mode via navigator.standalone (iOS)", () => {
    Object.defineProperty(navigator, "standalone", {
      writable: true,
      configurable: true,
      value: true,
    })

    const { result } = renderHook(() => useImmersiveViewport())

    expect(result.current.isStandalone).toBe(true)

    // Clean up
    Object.defineProperty(navigator, "standalone", {
      writable: true,
      configurable: true,
      value: undefined,
    })
  })

  it("detects landscape orientation", () => {
    Object.defineProperty(screen, "orientation", {
      writable: true,
      configurable: true,
      value: { type: "landscape-primary" },
    })

    const { result } = renderHook(() => useImmersiveViewport())

    expect(result.current.orientation).toBe("landscape")
  })

  it("uses passive event listeners for resize", () => {
    renderHook(() => useImmersiveViewport())

    const resizeCall = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === "resize"
    )
    expect(resizeCall).toBeDefined()
    expect(resizeCall![2]).toEqual({ passive: true })
  })

  it("uses passive event listeners for orientationchange", () => {
    renderHook(() => useImmersiveViewport())

    const orientationCall = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === "orientationchange"
    )
    expect(orientationCall).toBeDefined()
    expect(orientationCall![2]).toEqual({ passive: true })
  })

  it("cleans up all event listeners on unmount", () => {
    const { unmount } = renderHook(() => useImmersiveViewport())

    unmount()

    const resizeRemoval = removeEventListenerSpy.mock.calls.find(
      (call) => call[0] === "resize"
    )
    const orientationRemoval = removeEventListenerSpy.mock.calls.find(
      (call) => call[0] === "orientationchange"
    )

    expect(resizeRemoval).toBeDefined()
    expect(orientationRemoval).toBeDefined()
  })

  it("throttles resize callbacks via requestAnimationFrame", () => {
    renderHook(() => useImmersiveViewport())

    // Get the resize handler
    const resizeCall = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === "resize"
    )
    const resizeHandler = resizeCall![1] as () => void

    // Track how many times RAF is called after mount
    let postMountRafCalls = 0
    const originalRaf = globalThis.requestAnimationFrame
    globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) => {
      postMountRafCalls++
      // Don't execute callback — simulates pending frame
      return postMountRafCalls
    }) as typeof globalThis.requestAnimationFrame

    // Fire resize multiple times
    act(() => {
      resizeHandler()
      resizeHandler()
      resizeHandler()
    })

    // Only one RAF should be scheduled (throttled)
    expect(postMountRafCalls).toBe(1)

    // Restore
    globalThis.requestAnimationFrame = originalRaf
  })

  it("debounces orientation change by 100ms", () => {
    const { result } = renderHook(() => useImmersiveViewport())

    // Get the orientationchange handler
    const orientationCall = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === "orientationchange"
    )
    const orientationHandler = orientationCall![1] as () => void

    // Change orientation
    Object.defineProperty(screen, "orientation", {
      writable: true,
      configurable: true,
      value: { type: "landscape-primary" },
    })

    act(() => {
      orientationHandler()
    })

    // Should not have updated yet (debounced)
    expect(result.current.orientation).toBe("portrait")

    // Advance timers by 100ms
    act(() => {
      vi.advanceTimersByTime(100)
    })

    // Now it should be updated
    expect(result.current.orientation).toBe("landscape")
  })

  it("falls back to window.innerHeight when visualViewport is unavailable", () => {
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: null,
    })
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 667,
    })

    const { result } = renderHook(() => useImmersiveViewport())

    expect(result.current.viewportHeight).toBe(667)
  })

  it("falls back to matchMedia for orientation when screen.orientation is unavailable", () => {
    Object.defineProperty(screen, "orientation", {
      writable: true,
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      configurable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(orientation: portrait)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    const { result } = renderHook(() => useImmersiveViewport())

    expect(result.current.orientation).toBe("portrait")
  })
})
