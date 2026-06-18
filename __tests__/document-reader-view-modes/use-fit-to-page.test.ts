import { renderHook, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { useRef } from "react"

import { useFitToPage } from "@/components/shared/document-reader/use-fit-to-page"

// Mock ResizeObserver
class MockResizeObserver {
  callback: ResizeObserverCallback
  elements: Element[] = []

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
    MockResizeObserver.instances.push(this)
  }

  observe(element: Element) {
    this.elements.push(element)
  }

  unobserve(element: Element) {
    this.elements = this.elements.filter((el) => el !== element)
  }

  disconnect() {
    this.elements = []
  }

  // Trigger a resize
  trigger() {
    this.callback([] as unknown as ResizeObserverEntry[], this as unknown as ResizeObserver)
  }

  static instances: MockResizeObserver[] = []
  static reset() {
    MockResizeObserver.instances = []
  }
}

describe("useFitToPage", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    MockResizeObserver.reset()
    vi.stubGlobal("ResizeObserver", MockResizeObserver)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  function createMockContainer(width: number): HTMLDivElement {
    const el = document.createElement("div")
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue({
      width,
      height: 800,
      top: 0,
      left: 0,
      bottom: 800,
      right: width,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })
    return el
  }

  it("should default fitToPage to true", () => {
    const container = createMockContainer(1000)
    const ref = { current: container }

    const { result } = renderHook(() => useFitToPage(ref, "single-page"))

    expect(result.current.fitToPage).toBe(true)
  })

  it("should compute pageWidth using computeFitWidth for single-page mode", () => {
    const container = createMockContainer(1000)
    const ref = { current: container }

    const { result } = renderHook(() => useFitToPage(ref, "single-page"))

    // computeFitWidth(1000, "single-page", 48) = 1000 - 48 = 952
    expect(result.current.pageWidth).toBe(952)
  })

  it("should compute pageWidth for two-page-scroll mode", () => {
    const container = createMockContainer(1000)
    const ref = { current: container }

    const { result } = renderHook(() => useFitToPage(ref, "two-page-scroll"))

    // computeFitWidth(1000, "two-page-scroll", 48) = Math.floor((1000 - 48 - 16) / 2) = Math.floor(936 / 2) = 468
    expect(result.current.pageWidth).toBe(468)
  })

  it("should return undefined for pageWidth when fitToPage is disabled", () => {
    const container = createMockContainer(1000)
    const ref = { current: container }

    const { result } = renderHook(() => useFitToPage(ref, "single-page"))

    act(() => {
      result.current.toggleFitToPage()
    })

    expect(result.current.fitToPage).toBe(false)
    expect(result.current.pageWidth).toBeUndefined()
  })

  it("should toggle fitToPage state", () => {
    const container = createMockContainer(1000)
    const ref = { current: container }

    const { result } = renderHook(() => useFitToPage(ref, "single-page"))

    expect(result.current.fitToPage).toBe(true)

    act(() => {
      result.current.toggleFitToPage()
    })

    expect(result.current.fitToPage).toBe(false)

    act(() => {
      result.current.toggleFitToPage()
    })

    expect(result.current.fitToPage).toBe(true)
  })

  it("should recalculate pageWidth on container resize (debounced)", () => {
    const container = createMockContainer(1000)
    const ref = { current: container }

    const { result } = renderHook(() => useFitToPage(ref, "single-page"))

    expect(result.current.pageWidth).toBe(952) // 1000 - 48

    // Simulate resize
    vi.spyOn(container, "getBoundingClientRect").mockReturnValue({
      width: 800,
      height: 800,
      top: 0,
      left: 0,
      bottom: 800,
      right: 800,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    })

    // Trigger resize observer
    const observer = MockResizeObserver.instances[0]
    act(() => {
      observer.trigger()
    })

    // Before debounce completes, should still have old value
    expect(result.current.pageWidth).toBe(952)

    // Advance past debounce timer (200ms)
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Now should have new value: 800 - 48 = 752
    expect(result.current.pageWidth).toBe(752)
  })

  it("should return undefined pageWidth when container width is 0", () => {
    const container = createMockContainer(0)
    const ref = { current: container }

    const { result } = renderHook(() => useFitToPage(ref, "single-page"))

    expect(result.current.pageWidth).toBeUndefined()
  })

  it("should preserve fitToPage state across view mode changes", () => {
    const container = createMockContainer(1000)
    const ref = { current: container }

    const { result, rerender } = renderHook(
      ({ viewMode }) => useFitToPage(ref, viewMode),
      { initialProps: { viewMode: "single-page" as const } }
    )

    expect(result.current.fitToPage).toBe(true)

    // Switch to two-page-scroll
    rerender({ viewMode: "two-page-scroll" as const })

    expect(result.current.fitToPage).toBe(true)

    // Toggle off
    act(() => {
      result.current.toggleFitToPage()
    })

    expect(result.current.fitToPage).toBe(false)

    // Switch back to single-page
    rerender({ viewMode: "single-page" as const })

    // fitToPage state should be preserved
    expect(result.current.fitToPage).toBe(false)
  })

  it("should update pageWidth when view mode changes", () => {
    const container = createMockContainer(1000)
    const ref = { current: container }

    const { result, rerender } = renderHook(
      ({ viewMode }) => useFitToPage(ref, viewMode),
      { initialProps: { viewMode: "single-page" as const } }
    )

    // single-page: 1000 - 48 = 952
    expect(result.current.pageWidth).toBe(952)

    // Switch to two-page-scroll: Math.floor((1000 - 48 - 16) / 2) = 468
    rerender({ viewMode: "two-page-scroll" as const })
    expect(result.current.pageWidth).toBe(468)
  })

  it("should fall back to window resize when ResizeObserver is not available", () => {
    // Remove ResizeObserver
    vi.stubGlobal("ResizeObserver", undefined)

    const container = createMockContainer(1000)
    const ref = { current: container }

    const addEventSpy = vi.spyOn(window, "addEventListener")
    const removeEventSpy = vi.spyOn(window, "removeEventListener")

    const { result, unmount } = renderHook(() => useFitToPage(ref, "single-page"))

    expect(result.current.pageWidth).toBe(952)
    expect(addEventSpy).toHaveBeenCalledWith("resize", expect.any(Function))

    unmount()

    expect(removeEventSpy).toHaveBeenCalledWith("resize", expect.any(Function))
  })
})
