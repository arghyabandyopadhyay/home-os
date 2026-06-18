import { describe, it, expect } from "vitest"
import {
  computePagePairs,
  computeFitWidth,
  validatePageInput,
  formatPageLabel,
  getMostVisiblePage,
} from "@/components/shared/document-reader/types"

describe("computePagePairs", () => {
  it("returns [[1]] for a single-page document", () => {
    expect(computePagePairs(1)).toEqual([[1]])
  })

  it("returns [[1], [2]] for a 2-page document", () => {
    expect(computePagePairs(2)).toEqual([[1], [2]])
  })

  it("returns [[1], [2, 3]] for a 3-page document", () => {
    expect(computePagePairs(3)).toEqual([[1], [2, 3]])
  })

  it("returns [[1], [2, 3], [4]] for a 4-page document", () => {
    expect(computePagePairs(4)).toEqual([[1], [2, 3], [4]])
  })

  it("returns [[1], [2, 3], [4, 5]] for a 5-page document", () => {
    expect(computePagePairs(5)).toEqual([[1], [2, 3], [4, 5]])
  })

  it("handles a larger even-numbered document (6 pages)", () => {
    expect(computePagePairs(6)).toEqual([[1], [2, 3], [4, 5], [6]])
  })

  it("handles a larger odd-numbered document (7 pages)", () => {
    expect(computePagePairs(7)).toEqual([[1], [2, 3], [4, 5], [6, 7]])
  })
})

describe("computeFitWidth", () => {
  it("returns available width minus padding for single-page mode", () => {
    expect(computeFitWidth(1000, "single-page")).toBe(952)
  })

  it("returns available width minus padding for single-scroll mode", () => {
    expect(computeFitWidth(1000, "single-scroll")).toBe(952)
  })

  it("accounts for gap in two-page-scroll mode", () => {
    // available = 1000 - 48 = 952, then (952 - 16) / 2 = 468
    expect(computeFitWidth(1000, "two-page-scroll")).toBe(468)
  })

  it("uses custom padding value", () => {
    expect(computeFitWidth(800, "single-page", 100)).toBe(700)
  })

  it("uses custom padding in two-page mode", () => {
    // available = 800 - 100 = 700, then (700 - 16) / 2 = 342
    expect(computeFitWidth(800, "two-page-scroll", 100)).toBe(342)
  })

  it("uses default padding of 48 when not specified", () => {
    expect(computeFitWidth(500, "single-scroll")).toBe(452)
  })
})

describe("validatePageInput", () => {
  it("returns parsed integer when in valid range", () => {
    expect(validatePageInput("5", 10, 3)).toBe(5)
  })

  it("returns 1 when input is less than 1", () => {
    expect(validatePageInput("0", 10, 3)).toBe(1)
    expect(validatePageInput("-5", 10, 3)).toBe(1)
  })

  it("returns numPages when input exceeds total", () => {
    expect(validatePageInput("15", 10, 3)).toBe(10)
    expect(validatePageInput("999", 50, 25)).toBe(50)
  })

  it("returns currentPage when input is non-numeric", () => {
    expect(validatePageInput("abc", 10, 7)).toBe(7)
    expect(validatePageInput("", 10, 4)).toBe(4)
    expect(validatePageInput("hello", 20, 12)).toBe(12)
  })

  it("handles boundary values correctly", () => {
    expect(validatePageInput("1", 10, 5)).toBe(1)
    expect(validatePageInput("10", 10, 5)).toBe(10)
  })

  it("handles single-page documents", () => {
    expect(validatePageInput("1", 1, 1)).toBe(1)
    expect(validatePageInput("2", 1, 1)).toBe(1)
    expect(validatePageInput("0", 1, 1)).toBe(1)
  })
})

describe("formatPageLabel", () => {
  it("formats single page as plain number string", () => {
    expect(formatPageLabel([1])).toBe("1")
    expect(formatPageLabel([42])).toBe("42")
  })

  it("formats page pair with en-dash", () => {
    expect(formatPageLabel([2, 3])).toBe("2\u20133")
    expect(formatPageLabel([10, 11])).toBe("10\u201311")
  })
})

describe("getMostVisiblePage", () => {
  it("returns 1 for empty entries", () => {
    expect(getMostVisiblePage([])).toBe(1)
  })

  it("returns the page whose center is closest to viewport center", () => {
    const viewportHeight = 800
    const viewportCenter = viewportHeight / 2 // 400

    const makeEntry = (pageNum: number, top: number, height: number, isIntersecting: boolean) =>
      ({
        isIntersecting,
        boundingClientRect: { top, height, bottom: top + height } as DOMRectReadOnly,
        rootBounds: { top: 0, height: viewportHeight } as DOMRectReadOnly,
        target: {
          dataset: { pageNumber: String(pageNum) },
        } as unknown as Element,
      }) as unknown as IntersectionObserverEntry

    const entries = [
      makeEntry(1, -200, 600, true), // center = -200 + 300 = 100, distance = 300
      makeEntry(2, 300, 600, true), // center = 300 + 300 = 600, distance = 200
      makeEntry(3, 200, 400, true), // center = 200 + 200 = 400, distance = 0
    ]

    expect(getMostVisiblePage(entries)).toBe(3)
  })

  it("ignores non-intersecting entries", () => {
    const viewportHeight = 800

    const makeEntry = (pageNum: number, top: number, height: number, isIntersecting: boolean) =>
      ({
        isIntersecting,
        boundingClientRect: { top, height, bottom: top + height } as DOMRectReadOnly,
        rootBounds: { top: 0, height: viewportHeight } as DOMRectReadOnly,
        target: {
          dataset: { pageNumber: String(pageNum) },
        } as unknown as Element,
      }) as unknown as IntersectionObserverEntry

    const entries = [
      makeEntry(1, 350, 100, false), // closest to center but not intersecting
      makeEntry(2, 100, 200, true), // center = 200, distance = 200
    ]

    expect(getMostVisiblePage(entries)).toBe(2)
  })
})
