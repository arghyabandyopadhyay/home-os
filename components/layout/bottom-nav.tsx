"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import type { Transition } from "framer-motion"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Home,
  NotebookPen,
  CheckSquare,
  Library,
  CalendarDays,
} from "lucide-react"

import { useIsMobile } from "@/hooks/use-is-mobile"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useLowPerformance } from "@/hooks/use-low-performance"
import { useScrollDirection } from "@/hooks/use-scroll-direction"
import { DURATION, EASING } from "@/lib/motion"

// ─── Types ───────────────────────────────────────────────────────────────────

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  ariaLabel: string
}

// ─── Default Navigation Items ────────────────────────────────────────────────

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Today", icon: Home, ariaLabel: "Navigate to Dashboard" },
  { href: "/notes", label: "Notes", icon: NotebookPen, ariaLabel: "Navigate to Notes" },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, ariaLabel: "Navigate to Tasks" },
  { href: "/library", label: "Library", icon: Library, ariaLabel: "Navigate to Library" },
  { href: "/calendar", label: "Calendar", icon: CalendarDays, ariaLabel: "Navigate to Calendar" },
]

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Default scroll threshold in pixels for the bottom nav.
 * Matches the Header threshold for consistent UX.
 */
export const BOTTOM_NAV_SCROLL_THRESHOLD = 10

/**
 * Hide transition config: ease-in, 200ms.
 * Used when the bottom nav translates downward off-screen on scroll down.
 */
export const bottomNavHideTransition: Transition = {
  duration: DURATION.normal,
  ease: EASING.exit,
}

/**
 * Show transition config: ease-out, 200ms.
 * Used when the bottom nav translates back into view on scroll up.
 */
export const bottomNavShowTransition: Transition = {
  duration: DURATION.normal,
  ease: EASING.entrance,
}

/**
 * Maximum number of navigation items allowed in the BottomNav.
 */
export const MAX_NAV_ITEMS = 5

/**
 * Idle duration (ms) after which will-change is removed.
 */
const WILL_CHANGE_IDLE_MS = 500

// ─── Component ───────────────────────────────────────────────────────────────

export function BottomNav() {
  const navRef = useRef<HTMLElement>(null)
  const willChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isMobile = useIsMobile()
  const prefersReducedMotion = useReducedMotion()
  const isLowPerf = useLowPerformance()
  const scrollDirection = useScrollDirection({ threshold: BOTTOM_NAV_SCROLL_THRESHOLD })
  const pathname = usePathname()

  // Hide on scroll down, show on scroll up or at top (null = at top)
  const isScrollHidden = isMobile && scrollDirection === "down"

  // Manage will-change lifecycle: apply during transitions, remove after idle
  // Uses direct DOM manipulation to avoid lint issues with setState in effects
  useEffect(() => {
    if (!isMobile) return

    const el = navRef.current
    if (!el) return

    // Apply will-change when transitioning
    el.style.willChange = "transform"

    // Clear any existing timeout
    if (willChangeTimeoutRef.current !== null) {
      clearTimeout(willChangeTimeoutRef.current)
    }

    // Remove will-change after idle period
    willChangeTimeoutRef.current = setTimeout(() => {
      el.style.willChange = "auto"
      willChangeTimeoutRef.current = null
    }, WILL_CHANGE_IDLE_MS)

    return () => {
      if (willChangeTimeoutRef.current !== null) {
        clearTimeout(willChangeTimeoutRef.current)
      }
    }
  }, [scrollDirection, isMobile])

  // Set --bottom-nav-height CSS custom property
  useEffect(() => {
    if (!isMobile) {
      document.documentElement.style.removeProperty("--bottom-nav-height")
      return
    }

    const el = navRef.current
    if (!el) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height
        document.documentElement.style.setProperty(
          "--bottom-nav-height",
          `${height}px`
        )
      }
    })

    observer.observe(el)

    // Set initial value
    const height = el.getBoundingClientRect().height
    document.documentElement.style.setProperty(
      "--bottom-nav-height",
      `${height}px`
    )

    return () => {
      observer.disconnect()
      document.documentElement.style.removeProperty("--bottom-nav-height")
    }
  }, [isMobile])

  // Only render on mobile (< 768px)
  if (!isMobile) {
    return null
  }

  // Limit to max 5 items
  const visibleItems = DEFAULT_NAV_ITEMS.slice(0, MAX_NAV_ITEMS)

  // Determine pointer-events based on visibility state
  const pointerEvents = isScrollHidden ? "none" : "auto"

  // Determine transition (degraded mode = instant)
  const scrollTransition =
    prefersReducedMotion || isLowPerf
      ? { duration: 0 }
      : isScrollHidden
        ? bottomNavHideTransition
        : bottomNavShowTransition

  return (
    <motion.nav
      ref={navRef}
      role="navigation"
      aria-label="Main navigation"
      aria-hidden={isScrollHidden}
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-app bg-app-surface/80 backdrop-blur-xl"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        pointerEvents,
      }}
      animate={{ y: isScrollHidden ? "100%" : 0 }}
      transition={scrollTransition}
    >
      {visibleItems.map((item) => {
        const Icon = item.icon
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.ariaLabel}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 px-3 py-2 text-xs transition-colors ${
              active ? "text-app" : "text-app-muted"
            }`}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="leading-none">{item.label}</span>
          </Link>
        )
      })}
    </motion.nav>
  )
}

export type { NavItem }
