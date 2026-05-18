"use client"

import { useEffect, useState } from "react"

/**
 * Custom hook to detect the user's `prefers-reduced-motion` preference.
 *
 * Returns `true` when the user has enabled reduced motion at the OS level
 * (`prefers-reduced-motion: reduce`). Components should use this to:
 * - Skip all Framer Motion animations (set duration to 0, disable transitions)
 * - Render elements in their final visible state immediately
 * - Preserve focus indicators (those should always remain active)
 *
 * The CSS-level overrides in globals.css handle disabling CSS transitions,
 * but this hook is needed for JS-driven animations (Framer Motion).
 *
 * Validates: Requirements 5.6, 9.5, 17.7
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  return prefersReducedMotion
}

/**
 * Returns Framer Motion transition props that respect reduced motion.
 * When reduced motion is active, returns duration: 0 to show final state immediately.
 * When reduced motion is inactive, returns the provided transition config.
 *
 * Usage:
 * ```tsx
 * const reducedMotion = useReducedMotion()
 * const transition = getMotionTransition(reducedMotion, { duration: 0.2, ease: "easeOut" })
 * <motion.div transition={transition} ... />
 * ```
 */
export function getMotionTransition(
  prefersReducedMotion: boolean,
  transition: Record<string, unknown>
): Record<string, unknown> {
  if (prefersReducedMotion) {
    return { duration: 0 }
  }
  return transition
}

/**
 * Returns Framer Motion animate props that respect reduced motion.
 * When reduced motion is active, returns the final state directly as `initial`
 * so elements render in their completed position without animation.
 *
 * Usage:
 * ```tsx
 * const reducedMotion = useReducedMotion()
 * const { initial, animate, transition } = getMotionProps(reducedMotion, {
 *   initial: { opacity: 0, y: 20 },
 *   animate: { opacity: 1, y: 0 },
 *   transition: { duration: 0.2, ease: "easeOut" },
 * })
 * <motion.div initial={initial} animate={animate} transition={transition} />
 * ```
 */
export function getMotionProps(
  prefersReducedMotion: boolean,
  config: {
    initial: Record<string, unknown>
    animate: Record<string, unknown>
    transition: Record<string, unknown>
  }
): {
  initial: Record<string, unknown>
  animate: Record<string, unknown>
  transition: Record<string, unknown>
} {
  if (prefersReducedMotion) {
    return {
      initial: config.animate,
      animate: config.animate,
      transition: { duration: 0 },
    }
  }
  return config
}
