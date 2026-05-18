"use client"

import { useEffect, useState } from "react"

/**
 * Custom hook to detect whether the viewport is below the `md` breakpoint (768px).
 *
 * Returns `true` when the viewport width is less than 768px (mobile),
 * and `false` when at or above 768px (desktop/tablet).
 *
 * Uses `window.matchMedia` with a change event listener to update dynamically
 * on viewport resize or device rotation without requiring a page reload.
 *
 * Defaults to `false` on initial render for SSR safety — the component
 * will not render on the server and will hydrate correctly on the client.
 *
 * Validates: Requirements 1.1, 1.2, 1.3
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)")
    setIsMobile(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  return isMobile
}
