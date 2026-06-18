import { describe, it, expect, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useRef } from "react"
import { usePageTracking } from "@/components/shared/document-reader/use-page-tracking"

// Helper to render the hook with a mock container ref
function renderPageTrackingHook(
  viewMode: "single-page" | "single-scroll" | "two-page-scroll" = "single-page",
  numPages = 10
) {
  const containerRef = { current: document.createElement("div") }
  return renderHook(
    ({ viewMode, numPages }) => usePageTracking(viewMode, numPages, containerRef),
    { initialProps: { viewMode, numPages } }
  )
}

describe("usePageTracking", () => {
  describe("single-page mode navigation", () => {
    it("starts at page 1", () => {
      const { result } = renderPageTrackingHook("single-page", 10)
      expect(result.current.currentPage).toBe(1)
    })

    it("nextPage increments currentPage", () => {
      const { result } = renderPageTrackingHook("single-page", 10)
      act(() => result.current.nextPage())
      expect(result.current.currentPage).toBe(2)
    })

    it("prevPage decrements currentPage", () => {
      const { result } = renderPageTrackingHook("single-page", 10)
      act(() => result.current.goToPage(5))
      act(() => result.current.prevPage())
      expect(result.current.currentPage).toBe(4)
    })

    it("nextPage does not exceed numPages", () => {
      const { result } = renderPageTrackingHook("single-page", 3)
      act(() => result.current.goToPage(3))
      act(() => result.current.nextPage())
      expect(result.current.currentPage).toBe(3)
    })

    it("prevPage does not go below 1", () => {
      const { result } = renderPageTrackingHook("single-page", 10)
      act(() => result.current.prevPage())
      expect(result.current.currentPage).toBe(1)
    })

    it("goToPage clamps to valid range", () => {
      const { result } = renderPageTrackingHook("single-page", 10)
      act(() => result.current.goToPage(15))
      expect(result.current.currentPage).toBe(10)

      act(() => result.current.goToPage(0))
      expect(result.current.currentPage).toBe(1)
    })

    it("goToPage navigates to specific page", () => {
      const { result } = renderPageTrackingHook("single-page", 10)
      act(() => result.current.goToPage(7))
      expect(result.current.currentPage).toBe(7)
    })
  })

  describe("scrollToPage", () => {
    it("in single-page mode, sets currentPage directly", () => {
      const { result } = renderPageTrackingHook("single-page", 10)
      act(() => result.current.scrollToPage(5))
      expect(result.current.currentPage).toBe(5)
    })

    it("clamps page to valid range", () => {
      const { result } = renderPageTrackingHook("single-page", 5)
      act(() => result.current.scrollToPage(99))
      expect(result.current.currentPage).toBe(5)

      act(() => result.current.scrollToPage(-1))
      expect(result.current.currentPage).toBe(1)
    })
  })

  describe("displayLabel", () => {
    it("returns page number as string in single-page mode", () => {
      const { result } = renderPageTrackingHook("single-page", 10)
      expect(result.current.displayLabel).toBe("1")

      act(() => result.current.goToPage(5))
      expect(result.current.displayLabel).toBe("5")
    })

    it("returns page number as string in single-scroll mode", () => {
      const { result } = renderPageTrackingHook("single-scroll", 10)
      expect(result.current.displayLabel).toBe("1")
    })

    it("returns range string in two-page-scroll mode when page is in a pair", () => {
      const { result } = renderPageTrackingHook("two-page-scroll", 10)
      // page 1 is alone → "1"
      expect(result.current.displayLabel).toBe("1")

      // Navigate to page 2 → pair is [2, 3] → "2–3"
      act(() => result.current.goToPage(2))
      expect(result.current.displayLabel).toBe("2\u20133")

      // Navigate to page 3 → pair is [2, 3] → "2–3"
      act(() => result.current.goToPage(3))
      expect(result.current.displayLabel).toBe("2\u20133")
    })

    it("returns single number in two-page-scroll when last page is alone", () => {
      // 4 pages: pairs are [[1], [2,3], [4]]
      const { result } = renderPageTrackingHook("two-page-scroll", 4)
      act(() => result.current.goToPage(4))
      expect(result.current.displayLabel).toBe("4")
    })
  })
})
