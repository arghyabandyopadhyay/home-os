import { renderHook, act } from "@testing-library/react"
import { describe, it, expect } from "vitest"

import { useViewMode } from "@/components/shared/document-reader/use-view-mode"

describe("useViewMode", () => {
  it("defaults to single-page mode", () => {
    const { result } = renderHook(() => useViewMode())
    expect(result.current.viewMode).toBe("single-page")
  })

  it("allows setting to single-scroll mode", () => {
    const { result } = renderHook(() => useViewMode())
    act(() => {
      result.current.setViewMode("single-scroll")
    })
    expect(result.current.viewMode).toBe("single-scroll")
  })

  it("allows setting to two-page-scroll mode", () => {
    const { result } = renderHook(() => useViewMode())
    act(() => {
      result.current.setViewMode("two-page-scroll")
    })
    expect(result.current.viewMode).toBe("two-page-scroll")
  })

  it("allows switching back to single-page mode", () => {
    const { result } = renderHook(() => useViewMode())
    act(() => {
      result.current.setViewMode("two-page-scroll")
    })
    act(() => {
      result.current.setViewMode("single-page")
    })
    expect(result.current.viewMode).toBe("single-page")
  })
})
