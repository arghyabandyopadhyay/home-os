/**
 * Document Reader View Modes — Types & Utility Functions
 *
 * Shared types and pure utility functions for the document reader
 * view mode system. All functions are side-effect free and easily testable.
 */

// --- Types ---

export type ViewMode = "single-page" | "single-scroll" | "two-page-scroll"

export type PagePair = [number] | [number, number]

// --- Utility Functions ---

/**
 * Computes page pairs for two-page scroll layout.
 * Page 1 is always alone on the first row, then pages are paired (2,3), (4,5), etc.
 * If the document has an odd number of pages (> 1), the last page is alone.
 *
 * @param numPages - Total number of pages in the document (≥ 1)
 * @returns Array of page pairs
 */
export function computePagePairs(numPages: number): PagePair[] {
  const pairs: PagePair[] = [[1]]
  for (let i = 2; i <= numPages; i += 2) {
    if (i + 1 <= numPages) {
      pairs.push([i, i + 1])
    } else {
      pairs.push([i])
    }
  }
  return pairs
}

/**
 * Computes the page width that fits within the available container width.
 * In two-page-scroll mode, accounts for the gap between pages so both fit side by side.
 *
 * @param containerWidth - The measured width of the content container in pixels
 * @param viewMode - The current view mode
 * @param padding - Total horizontal padding (default 48px = 24px each side)
 * @returns The computed page width in pixels
 */
export function computeFitWidth(
  containerWidth: number,
  viewMode: ViewMode,
  padding: number = 48
): number {
  const available = containerWidth - padding
  if (viewMode === "two-page-scroll") {
    const gap = 16
    return Math.floor((available - gap) / 2)
  }
  return available
}

/**
 * Validates and normalizes page input from the user.
 * - Valid integer in [1, numPages]: returns that integer
 * - Integer < 1: returns 1
 * - Integer > numPages: returns numPages
 * - Non-numeric (NaN): returns currentPage (revert)
 *
 * @param input - The raw string from the page input field
 * @param numPages - Total number of pages in the document
 * @param currentPage - The current page number (used as fallback)
 * @returns The validated page number
 */
export function validatePageInput(
  input: string,
  numPages: number,
  currentPage: number
): number {
  const parsed = parseInt(input, 10)
  if (isNaN(parsed)) {
    return currentPage
  }
  if (parsed < 1) {
    return 1
  }
  if (parsed > numPages) {
    return numPages
  }
  return parsed
}

/**
 * Determines the most visible page based on IntersectionObserver entries.
 * Returns the 1-indexed page number whose vertical center is closest
 * to the viewport's vertical center.
 *
 * Page elements are expected to have a `data-page-number` attribute.
 *
 * @param entries - Array of IntersectionObserverEntry objects
 * @returns The 1-indexed page number closest to viewport center, or 1 if no entries
 */
export function getMostVisiblePage(entries: IntersectionObserverEntry[]): number {
  if (entries.length === 0) return 1

  const viewportHeight = entries[0].rootBounds?.height ?? window.innerHeight
  const viewportTop = entries[0].rootBounds?.top ?? 0
  const viewportCenter = viewportTop + viewportHeight / 2

  let closestPage = 1
  let closestDistance = Infinity

  for (const entry of entries) {
    if (!entry.isIntersecting) continue

    const rect = entry.boundingClientRect
    const elementCenter = rect.top + rect.height / 2
    const distance = Math.abs(elementCenter - viewportCenter)

    const pageAttr = (entry.target as HTMLElement).dataset.pageNumber
    const pageNum = pageAttr ? parseInt(pageAttr, 10) : 0

    if (pageNum > 0 && distance < closestDistance) {
      closestDistance = distance
      closestPage = pageNum
    }
  }

  return closestPage
}

/**
 * Formats a page pair into a display label string.
 * - Single page [n] → "n"
 * - Page pair [n, m] → "n–m" (en-dash U+2013)
 *
 * @param pair - A page pair tuple
 * @returns Formatted label string
 */
export function formatPageLabel(pair: PagePair): string {
  if (pair.length === 1) {
    return String(pair[0])
  }
  return `${pair[0]}\u2013${pair[1]}`
}
