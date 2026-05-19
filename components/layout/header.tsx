"use client"

import { motion } from "framer-motion"
import type { Transition } from "framer-motion"

import { useIsMobile } from "@/hooks/use-is-mobile"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useLowPerformance } from "@/hooks/use-low-performance"
import { useScrollDirection } from "@/hooks/use-scroll-direction"
import { DURATION, EASING } from "@/lib/motion"

import { MobileSidebar } from "./mobile-sidebar"
import { UserMenu } from "./user-menu"
import { SearchTrigger } from "./search-trigger"

/**
 * The translateY displacement when hidden (px, negative = upward).
 * Calculated as: height (64px / h-16) + border (1px) + shadow buffer (3px) = 68px.
 */
export const HEADER_HIDE_DISPLACEMENT = -68

/**
 * Default scroll threshold in pixels for the header.
 * Matches the FloatingSearchBar threshold for consistent UX.
 */
export const HEADER_SCROLL_THRESHOLD = 10

/**
 * Hide transition config: ease-in, 200ms.
 * Used when the header translates upward off-screen on scroll down.
 */
export const headerHideTransition: Transition = {
  duration: DURATION.normal,
  ease: EASING.exit,
}

/**
 * Show transition config: ease-out, 200ms.
 * Used when the header translates back into view on scroll up.
 */
export const headerShowTransition: Transition = {
  duration: DURATION.normal,
  ease: EASING.entrance,
}

export function Header() {
  const isMobile = useIsMobile()
  const prefersReducedMotion = useReducedMotion()
  const isLowPerf = useLowPerformance()
  const scrollDirection = useScrollDirection({ threshold: HEADER_SCROLL_THRESHOLD })

  // Only hide on mobile when scrolling down
  const isScrollHidden = isMobile && scrollDirection === "down"

  // Determine pointer-events based on visibility state
  const pointerEvents = isScrollHidden ? "none" : "auto"

  // Determine transition (degraded mode = instant)
  const scrollTransition =
    prefersReducedMotion || isLowPerf
      ? { duration: 0 }
      : isScrollHidden
        ? headerHideTransition
        : headerShowTransition

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b border-app bg-app-surface/80 px-6 pr-8 backdrop-blur-xl safe-area-header md:sticky md:left-auto md:right-auto"
      style={{ pointerEvents }}
      animate={{ y: isScrollHidden ? HEADER_HIDE_DISPLACEMENT : 0 }}
      transition={scrollTransition}
    >
      <div className="flex items-center gap-4">
        <MobileSidebar />
      </div>

      <div className="flex items-center gap-3">
        <SearchTrigger />
        <UserMenu />
      </div>
    </motion.header>
  )
}
