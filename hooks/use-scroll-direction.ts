"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * The direction the user is scrolling, or `null` if no scroll has
 * exceeded the threshold yet (initial state / at top of page).
 */
export type ScrollDirection = "up" | "down" | null

/**
 * Options for the `useScrollDirection` hook.
 */
export interface UseScrollDirectionOptions {
  /** Minimum scroll distance (px) before a direction change is emitted. Default: 10, constrained to 8–20. */
  threshold?: number
}

/**
 * Clamps the threshold value to the allowed range [8, 20].
 */
function clampThreshold(value: number): number {
  return Math.min(20, Math.max(8, value))
}

/**
 * Tracks the user's vertical scroll direction using a passive scroll listener
 * and requestAnimationFrame throttling.
 *
 * Returns `"up"`, `"down"`, or `null`:
 * - `null` on initial mount (no scroll has occurred)
 * - `null` when scrollY === 0 (forces visible in consumer)
 * - `"down"` when accumulated downward scroll exceeds threshold
 * - `"up"` when accumulated upward scroll exceeds threshold
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 2.2, 2.5
 */
export function useScrollDirection(
  options?: UseScrollDirectionOptions
): ScrollDirection {
  const threshold = clampThreshold(options?.threshold ?? 10)

  const [direction, setDirection] = useState<ScrollDirection>(null)

  const previousScrollY = useRef(0)
  const accumulatedDelta = useRef(0)
  const currentDirection = useRef<"up" | "down" | null>(null)
  const ticking = useRef(false)
  const rafId = useRef<number | null>(null)

  const handleScroll = useCallback(() => {
    if (ticking.current) return

    ticking.current = true
    rafId.current = requestAnimationFrame(() => {
      const scrollY = window.scrollY
      const delta = scrollY - previousScrollY.current

      previousScrollY.current = scrollY

      // When at the top of the page, force direction to null
      if (scrollY === 0) {
        accumulatedDelta.current = 0
        currentDirection.current = null
        setDirection(null)
        ticking.current = false
        return
      }

      // Determine the direction of this delta
      const newDirection: "up" | "down" | null =
        delta > 0 ? "down" : delta < 0 ? "up" : null

      if (newDirection === null) {
        // No movement
        ticking.current = false
        return
      }

      // If direction reversed, reset accumulated delta
      if (newDirection !== currentDirection.current) {
        accumulatedDelta.current = 0
        currentDirection.current = newDirection
      }

      // Accumulate delta
      accumulatedDelta.current += Math.abs(delta)

      // Only update state when accumulated delta exceeds threshold
      if (accumulatedDelta.current > threshold) {
        setDirection(newDirection)
      }

      ticking.current = false
    })
  }, [threshold])

  useEffect(() => {
    // Set initial scroll position
    previousScrollY.current = window.scrollY

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [handleScroll])

  return direction
}
