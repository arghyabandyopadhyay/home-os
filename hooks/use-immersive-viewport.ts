"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * State returned by the useImmersiveViewport hook.
 */
type ImmersiveViewportState = {
  /** Current visual viewport height in pixels (0 during SSR) */
  viewportHeight: number
  /** True when the visual viewport is ≥ 150px smaller than the layout viewport (keyboard likely open) */
  isKeyboardOpen: boolean
  /** True when the app is running in PWA standalone mode */
  isStandalone: boolean
  /** Current device orientation */
  orientation: "portrait" | "landscape"
}

/** Safe defaults for SSR where window is undefined */
const SSR_DEFAULTS: ImmersiveViewportState = {
  viewportHeight: 0,
  isKeyboardOpen: false,
  isStandalone: false,
  orientation: "portrait",
}

/** Threshold in pixels — keyboard is considered open when visual viewport is this much smaller than layout viewport */
const KEYBOARD_THRESHOLD = 150

/** Debounce delay for orientation change in milliseconds */
const ORIENTATION_DEBOUNCE_MS = 100

/**
 * Measures the current viewport state synchronously.
 * Used on mount and during resize/orientation events.
 */
function measureViewport(): ImmersiveViewportState {
  const layoutHeight = window.innerHeight
  const viewportHeight = window.visualViewport
    ? window.visualViewport.height
    : layoutHeight

  const isKeyboardOpen = layoutHeight - viewportHeight >= KEYBOARD_THRESHOLD

  const isStandalone = getIsStandalone()
  const orientation = getOrientation()

  return {
    viewportHeight,
    isKeyboardOpen,
    isStandalone,
    orientation,
  }
}

/**
 * Detects PWA standalone mode via media query or navigator.standalone (iOS Safari).
 */
function getIsStandalone(): boolean {
  if (window.matchMedia("(display-mode: standalone)").matches) {
    return true
  }
  // navigator.standalone is a non-standard iOS Safari property
  const nav = navigator as Navigator & { standalone?: boolean }
  if (nav.standalone === true) {
    return true
  }
  return false
}

/**
 * Determines the current orientation from the Screen Orientation API
 * or falls back to a matchMedia query.
 */
function getOrientation(): "portrait" | "landscape" {
  if (screen.orientation && screen.orientation.type) {
    return screen.orientation.type.startsWith("portrait")
      ? "portrait"
      : "landscape"
  }
  // Fallback: matchMedia
  if (window.matchMedia("(orientation: portrait)").matches) {
    return "portrait"
  }
  return "landscape"
}

/**
 * Provides dynamic viewport dimensions, keyboard state, PWA detection,
 * and orientation for immersive mobile experiences.
 *
 * - Uses `window.visualViewport.height` (fallback: `window.innerHeight`)
 * - Detects keyboard via 150px threshold between visual and layout viewport
 * - Detects PWA standalone via media query or `navigator.standalone`
 * - Throttles resize via requestAnimationFrame (one update per frame)
 * - Debounces orientation change by 100ms
 * - Uses passive event listeners
 * - Cleans up all listeners on unmount
 * - Returns safe SSR defaults when window is undefined
 * - Synchronously measures on mount before events fire
 *
 * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11
 */
export function useImmersiveViewport(): ImmersiveViewportState {
  const [state, setState] = useState<ImmersiveViewportState>(() => {
    if (typeof window === "undefined") return SSR_DEFAULTS
    // Synchronously measure on mount before events fire
    return measureViewport()
  })

  const rafId = useRef<number | null>(null)
  const ticking = useRef(false)
  const orientationTimeoutId = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleResize = useCallback(() => {
    if (ticking.current) return
    ticking.current = true

    rafId.current = requestAnimationFrame(() => {
      setState(measureViewport())
      ticking.current = false
    })
  }, [])

  const handleOrientationChange = useCallback(() => {
    // Clear any pending debounce
    if (orientationTimeoutId.current !== null) {
      clearTimeout(orientationTimeoutId.current)
    }

    // Debounce orientation change by 100ms to allow viewport to stabilize
    orientationTimeoutId.current = setTimeout(() => {
      setState(measureViewport())
      orientationTimeoutId.current = null
    }, ORIENTATION_DEBOUNCE_MS)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    // Synchronously measure on mount (covers the case where useState initializer
    // ran during SSR and we need to hydrate with real values)
    setState(measureViewport())

    // Listen to visualViewport resize if available
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize, {
        passive: true,
      })
    }

    // Fallback: listen to window resize
    window.addEventListener("resize", handleResize, { passive: true })

    // Orientation change
    window.addEventListener("orientationchange", handleOrientationChange, {
      passive: true,
    })

    return () => {
      // Clean up all listeners
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize)
      }
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleOrientationChange)

      // Cancel pending RAF
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current)
      }

      // Clear pending orientation debounce
      if (orientationTimeoutId.current !== null) {
        clearTimeout(orientationTimeoutId.current)
      }
    }
  }, [handleResize, handleOrientationChange])

  return state
}
