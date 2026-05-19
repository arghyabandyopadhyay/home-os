"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import type { Variants, Transition } from "framer-motion"
import { Search } from "lucide-react"

import { useIsMobile } from "@/hooks/use-is-mobile"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useLowPerformance } from "@/hooks/use-low-performance"
import { useScrollDirection } from "@/hooks/use-scroll-direction"
import { DURATION, EASING } from "@/lib/motion"

/**
 * Animation variants for the FloatingSearchBar expand/collapse.
 * Exported for property-based testing.
 *
 * Validates: Requirements 3.1, 3.2
 */
export const expandCollapseVariants: Variants = {
  resting: { scaleX: 1, opacity: 1 },
  expanded: { scaleX: 1.75, opacity: 1 },
}

/**
 * Transition config for expansion (entrance): ease-out, 180ms.
 * Exported for property-based testing.
 *
 * Validates: Requirements 3.1, 3.5
 */
export const expandTransition: Transition = {
  duration: 0.18,
  ease: "easeOut",
}

/**
 * Transition config for collapse (exit): ease-in, 180ms.
 * Exported for property-based testing.
 *
 * Validates: Requirements 3.5
 */
export const collapseTransition: Transition = {
  duration: 0.18,
  ease: "easeIn",
}

/**
 * Entrance animation variants for the FloatingSearchBar mount.
 * Exported for property-based testing.
 *
 * Validates: Requirements 6.1, 6.2
 */
export const entranceVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
}

/**
 * Transition config for entrance animation: ease-out, 200ms.
 * Only animates transform and opacity properties.
 * Exported for property-based testing.
 *
 * Validates: Requirements 6.1, 6.2, 6.3
 */
export const entranceTransition: Transition = {
  duration: 0.2,
  ease: "easeOut",
}

/**
 * Hide transition config: ease-in, 200ms.
 * Used when the search bar translates downward off-screen on scroll down.
 * Exported for property-based testing.
 *
 * Validates: Requirements 3.1, 3.6
 */
export const hideTransition: Transition = {
  duration: DURATION.normal,
  ease: EASING.exit,
}

/**
 * Show transition config: ease-out, 200ms.
 * Used when the search bar translates back into view on scroll up.
 * Exported for property-based testing.
 *
 * Validates: Requirements 3.2
 */
export const showTransition: Transition = {
  duration: DURATION.normal,
  ease: EASING.entrance,
}

/**
 * The translateY displacement when hidden (px).
 * Calculated as: height (44px) + bottom offset (24px) + shadow spread (~10px) = 78px.
 * Exported for property-based testing.
 *
 * Validates: Requirements 1.2, 3.6
 */
export const HIDE_DISPLACEMENT = 78

/**
 * Default scroll threshold in pixels.
 * The minimum scroll distance before hide/show behavior triggers.
 * Exported for property-based testing.
 *
 * Validates: Requirements 1.4
 */
export const SCROLL_THRESHOLD = 10

/**
 * A fixed-position, pill-shaped search button rendered exclusively on mobile viewports.
 * Provides thumb-friendly access to the command menu at the bottom of the screen.
 *
 * Validates: Requirements 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 7.3, 7.4
 */
export function FloatingSearchBar() {
  const isMobile = useIsMobile()
  const prefersReducedMotion = useReducedMotion()
  const isLowPerf = useLowPerformance()
  const scrollDirection = useScrollDirection({ threshold: SCROLL_THRESHOLD })
  const [isExpanded, setIsExpanded] = useState(false)
  const [commandMenuOpen, setCommandMenuOpen] = useState(false)
  const [entranceComplete, setEntranceComplete] = useState(false)
  const [forceVisible, setForceVisible] = useState(false)
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasDispatchedRef = useRef(false)

  // Derive scroll-hidden state
  // Hide on scroll down for fully immersive experience (YouTube-like).
  // Reappears on scroll up along with header and bottom nav.
  const scrollHideEnabled = entranceComplete && !commandMenuOpen && isMobile
  const isScrollHidden = scrollHideEnabled && scrollDirection === "down" && !forceVisible

  // Reset forceVisible when scroll direction changes away from "down"
  // (user scrolls up or reaches top), allowing future hide transitions
  useEffect(() => {
    if (forceVisible && scrollDirection !== "down") {
      setForceVisible(false)
    }
  }, [forceVisible, scrollDirection])

  // Determine transition for scroll hide/show
  const scrollTransition =
    prefersReducedMotion || isLowPerf
      ? { duration: 0 }
      : isScrollHidden
        ? hideTransition
        : showTransition

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (fallbackTimeoutRef.current) {
        clearTimeout(fallbackTimeoutRef.current)
      }
    }
  }, [])

  const dispatchOpenCommandMenu = useCallback(() => {
    if (hasDispatchedRef.current) return
    hasDispatchedRef.current = true

    // Clear fallback timeout if it exists
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current)
      fallbackTimeoutRef.current = null
    }

    try {
      window.dispatchEvent(new Event("open-command-menu"))
    } catch {
      // Fail silently — command menu simply won't open
    }
  }, [])

  const handleActivation = useCallback(() => {
    if (isExpanded) return
    if (commandMenuOpen) return

    hasDispatchedRef.current = false

    // Tap during hide transition: cancel hide by forcing visible.
    // Framer Motion will animate back from current position (Req 8.3, 3.5).
    // Then proceed with activation below.
    if (scrollHideEnabled && scrollDirection === "down") {
      setForceVisible(true)
    }

    // Tap during show transition: the bar is already animating to visible.
    // Framer Motion will complete the show animation natively.
    // We proceed with activation immediately (Req 8.2).

    if (prefersReducedMotion) {
      // Skip animation entirely and dispatch immediately
      try {
        window.dispatchEvent(new Event("open-command-menu"))
      } catch {
        // Fail silently
      }
      return
    }

    setIsExpanded(true)

    // Fallback: dispatch event after 250ms if animation callback doesn't fire
    fallbackTimeoutRef.current = setTimeout(() => {
      dispatchOpenCommandMenu()
    }, 250)
  }, [isExpanded, commandMenuOpen, prefersReducedMotion, dispatchOpenCommandMenu, scrollHideEnabled, scrollDirection])

  const handleAnimationComplete = useCallback(
    (variant: string) => {
      if (variant === "expanded") {
        dispatchOpenCommandMenu()
      }
    },
    [dispatchOpenCommandMenu]
  )

  // Listen for command menu close to collapse back
  useEffect(() => {
    const handleClose = () => {
      setIsExpanded(false)
      setCommandMenuOpen(false)
      hasDispatchedRef.current = false
    }

    window.addEventListener("close-command-menu", handleClose)
    return () => window.removeEventListener("close-command-menu", handleClose)
  }, [])

  // Track when command menu opens (from any source)
  useEffect(() => {
    const handleOpen = () => {
      setCommandMenuOpen(true)
    }

    window.addEventListener("open-command-menu", handleOpen)
    return () => window.removeEventListener("open-command-menu", handleOpen)
  }, [])

  if (!isMobile) {
    return null
  }

  return (
    <motion.div
      className="fixed left-1/2 z-50 -translate-x-1/2"
      style={{
        bottom: "calc(36px + env(safe-area-inset-bottom, 0px) + var(--bottom-nav-height, 0px))",
        pointerEvents: isScrollHidden ? "none" : "auto",
      }}
      variants={entranceVariants}
      initial="hidden"
      animate="visible"
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : entranceTransition
      }
      onAnimationComplete={() => {
        setEntranceComplete(true)
      }}
    >
      <motion.div
        animate={{ y: isScrollHidden ? HIDE_DISPLACEMENT : 0 }}
        transition={scrollTransition}
      >
        <motion.button
          type="button"
          aria-label="Search"
          className="flex h-11 w-[140px] items-center justify-center gap-2 rounded-full border border-app bg-app-surface shadow-lg outline-offset-2 focus-visible:outline-2 focus-visible:outline-current"
          variants={expandCollapseVariants}
          animate={isExpanded ? "expanded" : "resting"}
          transition={isExpanded ? expandTransition : collapseTransition}
          onAnimationComplete={handleAnimationComplete}
          onClick={handleActivation}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              handleActivation()
            }
          }}
        >
          <Search className="size-[18px] text-app-muted" aria-hidden="true" />
          <span className="text-sm text-app-muted">Search</span>
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
