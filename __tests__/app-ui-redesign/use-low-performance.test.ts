import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useLowPerformance } from "@/hooks/use-low-performance"

describe("useLowPerformance", () => {
  let originalCSS: typeof CSS

  beforeEach(() => {
    originalCSS = globalThis.CSS
    // Clean up any leftover class from previous tests
    document.documentElement.classList.remove("low-perf")
  })

  afterEach(() => {
    document.documentElement.classList.remove("low-perf")
    // Restore original CSS
    Object.defineProperty(globalThis, "CSS", {
      value: originalCSS,
      writable: true,
      configurable: true,
    })
    // Restore navigator.deviceMemory
    Object.defineProperty(navigator, "deviceMemory", {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  it("returns false and does not add .low-perf when device has sufficient memory and backdrop-filter is supported", () => {
    // Mock deviceMemory > 4
    Object.defineProperty(navigator, "deviceMemory", {
      value: 8,
      writable: true,
      configurable: true,
    })
    // Mock CSS.supports returning true for backdrop-filter
    Object.defineProperty(globalThis, "CSS", {
      value: {
        supports: (prop: string, value: string) => {
          if (prop === "backdrop-filter" && value === "blur(1px)") return true
          if (prop === "-webkit-backdrop-filter" && value === "blur(1px)") return true
          return false
        },
      },
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useLowPerformance())

    expect(result.current).toBe(false)
    expect(document.documentElement.classList.contains("low-perf")).toBe(false)
  })

  it("returns true and adds .low-perf when deviceMemory <= 4", () => {
    Object.defineProperty(navigator, "deviceMemory", {
      value: 4,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(globalThis, "CSS", {
      value: {
        supports: (prop: string, value: string) => {
          if (prop === "backdrop-filter" && value === "blur(1px)") return true
          return false
        },
      },
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useLowPerformance())

    expect(result.current).toBe(true)
    expect(document.documentElement.classList.contains("low-perf")).toBe(true)
  })

  it("returns true and adds .low-perf when backdrop-filter is not supported", () => {
    Object.defineProperty(navigator, "deviceMemory", {
      value: 16,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(globalThis, "CSS", {
      value: {
        supports: () => false,
      },
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useLowPerformance())

    expect(result.current).toBe(true)
    expect(document.documentElement.classList.contains("low-perf")).toBe(true)
  })

  it("returns true when CSS.supports is not available (old browser)", () => {
    Object.defineProperty(navigator, "deviceMemory", {
      value: undefined,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(globalThis, "CSS", {
      value: undefined,
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useLowPerformance())

    expect(result.current).toBe(true)
    expect(document.documentElement.classList.contains("low-perf")).toBe(true)
  })

  it("returns false when deviceMemory is not available but backdrop-filter is supported", () => {
    Object.defineProperty(navigator, "deviceMemory", {
      value: undefined,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(globalThis, "CSS", {
      value: {
        supports: (prop: string, value: string) => {
          if (prop === "backdrop-filter" && value === "blur(1px)") return true
          return false
        },
      },
      writable: true,
      configurable: true,
    })

    const { result } = renderHook(() => useLowPerformance())

    expect(result.current).toBe(false)
    expect(document.documentElement.classList.contains("low-perf")).toBe(false)
  })

  it("removes .low-perf class on unmount", () => {
    Object.defineProperty(navigator, "deviceMemory", {
      value: 2,
      writable: true,
      configurable: true,
    })
    Object.defineProperty(globalThis, "CSS", {
      value: {
        supports: () => true,
      },
      writable: true,
      configurable: true,
    })

    const { unmount } = renderHook(() => useLowPerformance())

    expect(document.documentElement.classList.contains("low-perf")).toBe(true)

    unmount()

    expect(document.documentElement.classList.contains("low-perf")).toBe(false)
  })
})
