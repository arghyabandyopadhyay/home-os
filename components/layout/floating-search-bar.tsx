"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import type { Variants, Transition } from "framer-motion"
import { Search } from "lucide-react"

import { useIsMobile } from "@/hooks/use-is-mobile"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

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
 * A fixed-position, pill-shaped search button rendered exclusively on mobile viewports.
 * Provides thumb-friendly access to the command menu at the bottom of the screen.
 *
 * Validates: Requirements 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 7.3, 7.4
 */
export function FloatingSearchBar() {
  const isMobile = useIsMobile()
  const prefersReducedMotion = useReducedMotion()
  const [isExpanded, setIsExpanded] = useState(false)
  const [commandMenuOpen, setCommandMenuOpen] = useState(false)
  const fallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasDispatchedRef = useRef(false)

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
  }, [isExpanded, commandMenuOpen, prefersReducedMotion, dispatchOpenCommandMenu])

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
      className="fixed left-1/2 z-40 -translate-x-1/2"
      style={{
        bottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
      }}
      variants={entranceVariants}
      initial="hidden"
      animate="visible"
      transition={
        prefersReducedMotion
          ? { duration: 0 }
          : entranceTransition
      }
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
  )
}
