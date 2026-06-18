"use client"

import { useState, useEffect, useRef, useCallback, type RefObject } from "react"

import {
  type ViewMode,
  getMostVisiblePage,
  formatPageLabel,
  computePagePairs,
} from "@/components/shared/document-reader/types"

/**
 * Tracks the current page in the document reader across all view modes.
 *
 * - Single-page mode: manages `currentPage` state with prev/next/goToPage
 * - Scroll modes: uses IntersectionObserver on page elements to determine
 *   the most-visible page, with scroll event fallback
 * - Provides `scrollToPage` for direct navigation from page input
 * - Computes `displayLabel` (single number or range string)
 */
export function usePageTracking(
  viewMode: ViewMode,
  numPages: number,
  containerRef: RefObject<HTMLDivElement | null>
) {
  const [currentPage, setCurrentPage] = useState(1)
  const prevViewModeRef = useRef<ViewMode>(viewMode)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // --- Mode switch preservation (requirements 1.4, 1.5) ---
  useEffect(() => {
    const prevMode = prevViewModeRef.current
    prevViewModeRef.current = viewMode

    if (prevMode === viewMode) return

    // Switching from scroll → single-page: preserve the most-visible page (req 1.4)
    // currentPage is already being kept up-to-date by the observer, so no action needed

    // Switching from single-page → scroll: scroll to current page (req 1.5)
    if (prevMode === "single-page" && viewMode !== "single-page") {
      // Use a microtask to allow the scroll view to render its pages first
      requestAnimationFrame(() => {
        scrollToPageElement(currentPage)
      })
    }
  }, [viewMode, currentPage])

  // --- IntersectionObserver for scroll modes (requirements 2.3, 3.3) ---
  useEffect(() => {
    if (viewMode === "single-page") {
      // Clean up observer when in single-page mode
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      return
    }

    const container = containerRef.current
    if (!container) return

    // Check for IntersectionObserver support
    if (typeof IntersectionObserver === "undefined") {
      // Fallback: scroll event listener
      const handleScroll = () => {
        const pageElements = container.querySelectorAll<HTMLElement>(
          "[data-page-number]"
        )
        if (pageElements.length === 0) return

        const containerRect = container.getBoundingClientRect()
        const containerCenter = containerRect.top + containerRect.height / 2

        let closestPage = 1
        let closestDistance = Infinity

        pageElements.forEach((el) => {
          const rect = el.getBoundingClientRect()
          const elementCenter = rect.top + rect.height / 2
          const distance = Math.abs(elementCenter - containerCenter)
          const pageNum = parseInt(el.dataset.pageNumber ?? "0", 10)

          if (pageNum > 0 && distance < closestDistance) {
            closestDistance = distance
            closestPage = pageNum
          }
        })

        setCurrentPage(closestPage)
      }

      container.addEventListener("scroll", handleScroll, { passive: true })
      return () => container.removeEventListener("scroll", handleScroll)
    }

    // Set up IntersectionObserver
    const observer = new IntersectionObserver(
      (entries) => {
        const page = getMostVisiblePage(entries)
        setCurrentPage(page)
      },
      {
        root: container,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    )
    observerRef.current = observer

    // Observe all page elements
    const pageElements = container.querySelectorAll("[data-page-number]")
    pageElements.forEach((el) => observer.observe(el))

    // Use MutationObserver to watch for new page elements being added
    const mutationObserver = new MutationObserver(() => {
      observer.disconnect()
      const updatedElements = container.querySelectorAll("[data-page-number]")
      updatedElements.forEach((el) => observer.observe(el))
    })
    mutationObserver.observe(container, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      observerRef.current = null
      mutationObserver.disconnect()
    }
  }, [viewMode, containerRef, numPages])

  // --- Scroll to a specific page element ---
  const scrollToPageElement = useCallback(
    (page: number) => {
      const container = containerRef.current
      if (!container) return

      const target = container.querySelector<HTMLElement>(
        `[data-page-number="${page}"]`
      )
      if (target) {
        target.scrollIntoView({ block: "start", behavior: "smooth" })
      }
    },
    [containerRef]
  )

  // --- Navigation functions (requirement 4.5, 4.6) ---
  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, numPages))
      setCurrentPage(clamped)
    },
    [numPages]
  )

  const nextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, numPages))
  }, [numPages])

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1))
  }, [])

  const scrollToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(1, Math.min(page, numPages))
      if (viewMode === "single-page") {
        setCurrentPage(clamped)
      } else {
        setCurrentPage(clamped)
        scrollToPageElement(clamped)
      }
    },
    [viewMode, numPages, scrollToPageElement]
  )

  // --- Display label (requirement 3.3) ---
  const displayLabel = (() => {
    if (viewMode === "two-page-scroll") {
      const pairs = computePagePairs(numPages)
      const pair = pairs.find(
        (p) => p[0] === currentPage || (p.length === 2 && p[1] === currentPage)
      )
      return pair ? formatPageLabel(pair) : String(currentPage)
    }
    return String(currentPage)
  })()

  return {
    currentPage,
    displayLabel,
    scrollToPage,
    goToPage,
    nextPage,
    prevPage,
  }
}
