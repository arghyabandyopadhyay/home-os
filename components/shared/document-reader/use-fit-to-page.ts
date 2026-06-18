"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"

import { computeFitWidth, type ViewMode } from "@/components/shared/document-reader/types"

/**
 * Hook that manages fit-to-page scaling for the document reader.
 *
 * Observes the container element's width via ResizeObserver (debounced at 200ms)
 * and computes the appropriate page width using `computeFitWidth`. Falls back to
 * the window resize event if ResizeObserver is not supported.
 *
 * When fit-to-page is disabled, returns `undefined` for pageWidth so pages
 * render at their intrinsic dimensions.
 */
export function useFitToPage(
  containerRef: RefObject<HTMLDivElement | null>,
  viewMode: ViewMode
): {
  fitToPage: boolean
  toggleFitToPage: () => void
  pageWidth: number | undefined
} {
  const [fitToPage, setFitToPage] = useState(true)
  const [containerWidth, setContainerWidth] = useState(0)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const toggleFitToPage = useCallback(() => {
    setFitToPage((prev) => !prev)
  }, [])

  // Measure container width with ResizeObserver (debounced at 200ms)
  // or fall back to window resize event
  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateWidth = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        const width = element.getBoundingClientRect().width
        setContainerWidth(width)
      }, 200)
    }

    // Initial measurement (no debounce for first read)
    const initialWidth = element.getBoundingClientRect().width
    setContainerWidth(initialWidth)

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => {
        updateWidth()
      })
      observer.observe(element)

      return () => {
        observer.disconnect()
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
      }
    } else {
      // Fallback: window resize event with same debounce
      window.addEventListener("resize", updateWidth)

      return () => {
        window.removeEventListener("resize", updateWidth)
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
      }
    }
  }, [containerRef])

  // Compute page width based on fit-to-page state and container width
  const pageWidth = fitToPage && containerWidth > 0
    ? computeFitWidth(containerWidth, viewMode)
    : undefined

  return { fitToPage, toggleFitToPage, pageWidth }
}
