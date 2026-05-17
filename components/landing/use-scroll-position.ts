"use client"

import { useEffect, useState } from "react"

/**
 * Hook that returns the current vertical scroll position (window.scrollY).
 * Uses a passive scroll listener with requestAnimationFrame throttling
 * to avoid excessive re-renders.
 *
 * Validates: Requirements 2.5, 2.6
 */
export function useScrollPosition(): number {
  const [scrollY, setScrollY] = useState(() =>
    typeof window !== "undefined" ? window.scrollY : 0
  )

  useEffect(() => {
    let rafId: number | null = null
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        ticking = true
        rafId = requestAnimationFrame(() => {
          setScrollY(window.scrollY)
          ticking = false
        })
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })

    return () => {
      window.removeEventListener("scroll", handleScroll)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [])

  return scrollY
}
