import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { useScrollPosition } from "@/components/landing/use-scroll-position"

describe("useScrollPosition", () => {
  let rafCallback: FrameRequestCallback | null = null

  beforeEach(() => {
    // Mock window.scrollY
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    })

    // Mock requestAnimationFrame to capture callback
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallback = cb
      return 1
    })
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    rafCallback = null
  })

  it("returns 0 as initial value", () => {
    const { result } = renderHook(() => useScrollPosition())
    expect(result.current).toBe(0)
  })

  it("updates value when scroll event fires", () => {
    const { result } = renderHook(() => useScrollPosition())

    act(() => {
      ;(window as unknown as { scrollY: number }).scrollY = 100
      window.dispatchEvent(new Event("scroll"))
      // Execute the RAF callback
      if (rafCallback) rafCallback(performance.now())
    })

    expect(result.current).toBe(100)
  })

  it("throttles updates with requestAnimationFrame", () => {
    renderHook(() => useScrollPosition())

    // Fire multiple scroll events
    act(() => {
      ;(window as unknown as { scrollY: number }).scrollY = 50
      window.dispatchEvent(new Event("scroll"))
      ;(window as unknown as { scrollY: number }).scrollY = 100
      window.dispatchEvent(new Event("scroll"))
      ;(window as unknown as { scrollY: number }).scrollY = 150
      window.dispatchEvent(new Event("scroll"))
    })

    // Only one RAF should have been requested (ticking prevents additional calls)
    expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1)
  })

  it("cleans up scroll listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener")

    const { unmount } = renderHook(() => useScrollPosition())
    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function)
    )
  })

  it("cancels pending RAF on unmount", () => {
    const { unmount } = renderHook(() => useScrollPosition())

    // Trigger a scroll to create a pending RAF
    act(() => {
      ;(window as unknown as { scrollY: number }).scrollY = 50
      window.dispatchEvent(new Event("scroll"))
    })

    unmount()

    expect(window.cancelAnimationFrame).toHaveBeenCalled()
  })

  it("uses passive scroll listener", () => {
    const addEventListenerSpy = vi.spyOn(window, "addEventListener")

    renderHook(() => useScrollPosition())

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
      { passive: true }
    )
  })
})
