"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import type { Transition } from "framer-motion"
import { usePathname, useRouter } from "next/navigation"

import { useIsMobile } from "@/hooks/use-is-mobile"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useLowPerformance } from "@/hooks/use-low-performance"
import { useScrollDirection } from "@/hooks/use-scroll-direction"
import { useImmersiveContext } from "@/components/layout/mobile-shell"
import { DURATION, EASING } from "@/lib/motion"

import { ArrowLeft, Menu, Search } from "lucide-react"
import { UserMenu } from "./user-menu"
import { SearchTrigger } from "./search-trigger"
import { useMobileSidebar } from "@/hooks/use-mobile-sidebar"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { NotificationCenter } from "@/components/notifications/notification-center"
import { useNotificationStore } from "@/hooks/use-notification-store"

/**
 * The translateY displacement when hidden (px, negative = upward).
 * Calculated as: height (64px / h-16) + border (1px) + shadow buffer (3px) = 68px.
 * Kept exported for backward compatibility. The component internally uses a
 * dynamic value read from the CSS custom property `--header-hide-y`.
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
 * Show transition config: ease-out, 150ms.
 * Used when the header translates back into view on scroll up.
 * Faster than hide for a snappy, responsive reveal.
 */
export const headerShowTransition: Transition = {
  duration: DURATION.fast,
  ease: EASING.entrance,
}

/**
 * Idle duration (ms) after which will-change is removed from the header.
 */
const WILL_CHANGE_IDLE_MS = 500

export function Header() {
  const headerRef = useRef<HTMLElement>(null)
  const willChangeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [hideDisplacement, setHideDisplacement] = useState(HEADER_HIDE_DISPLACEMENT)
  const openSidebar = useMobileSidebar((s) => s.open)
  const pathname = usePathname()
  const router = useRouter()

  const isMobile = useIsMobile()

  // Notification state from Zustand store
  const isPanelOpen = useNotificationStore((s) => s.isPanelOpen)
  const setPanelOpen = useNotificationStore((s) => s.setPanelOpen)
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  // Show back button instead of hamburger on detail/reader pages
  const isDetailPage = pathname.startsWith("/reader/") || pathname.startsWith("/notes/") || pathname.startsWith("/documents/")
  const prefersReducedMotion = useReducedMotion()
  const isLowPerf = useLowPerformance()
  const scrollDirection = useScrollDirection({ threshold: HEADER_SCROLL_THRESHOLD })

  // Try to read ImmersiveContext (available when inside MobileShell on mobile)
  const immersiveContext = useImmersiveContext()

  // Read the dynamic --header-hide-y CSS custom property after mount
  useEffect(() => {
    const el = headerRef.current
    if (!el) return

    const raw = getComputedStyle(el).getPropertyValue("--header-hide-y").trim()
    if (raw) {
      const parsed = parseFloat(raw)
      if (!Number.isNaN(parsed)) {
        setHideDisplacement(parsed)
      }
    }
  }, [])

  // Determine visibility:
  // If ImmersiveContext is available (mobile inside MobileShell), use context-driven state.
  // Otherwise, fall back to local scroll direction (desktop or outside MobileShell).
  const isScrollHidden = immersiveContext
    ? !immersiveContext.chromeVisible
    : isMobile && scrollDirection === "down"

  // Determine whether animations should be enabled:
  // If context is available, use its shouldAnimate flag (already accounts for reduced motion + low-perf).
  // Otherwise, fall back to local hook checks.
  const shouldAnimate = immersiveContext
    ? immersiveContext.shouldAnimate
    : !prefersReducedMotion && !isLowPerf

  // Manage will-change lifecycle: apply during transitions, remove after idle
  useEffect(() => {
    if (!isMobile) return

    const el = headerRef.current
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
  }, [isScrollHidden, isMobile])

  // Determine pointer-events based on visibility state
  const pointerEvents = isScrollHidden ? "none" : "auto"

  // Determine transition (degraded mode = instant)
  const scrollTransition = !shouldAnimate
    ? { duration: 0 }
    : isScrollHidden
      ? headerHideTransition
      : headerShowTransition

  return (
    <motion.header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-40 flex md:h-16 items-center gap-2 border-b border-app bg-app-surface/80 px-2 md:px-6 md:pr-8 backdrop-blur-xl safe-area-header md:sticky md:left-auto md:right-auto"
      style={{ pointerEvents }}
      animate={{ y: isScrollHidden ? hideDisplacement : 0 }}
      transition={scrollTransition}
    >
      {/* Mobile layout: hamburger/back + full-width search bar + avatar */}
      {isDetailPage ? (
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-app-muted hover:bg-app-elevated hover:text-app transition-colors md:hidden"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
      ) : (
        <button
          onClick={openSidebar}
          aria-label="Open navigation menu"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-app-muted hover:bg-app-elevated hover:text-app transition-colors md:hidden"
        >
          <Menu size={20} aria-hidden="true" />
        </button>
      )}

      {/* Mobile inline search bar — fills remaining space */}
      <button
        type="button"
        onClick={() => window.dispatchEvent(new Event("open-command-menu"))}
        aria-label="Search"
        className="flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border border-app bg-app-elevated/60 px-3 text-sm text-app-muted md:hidden"
      >
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <span className="truncate">Search your home</span>
      </button>

      {/* Mobile user menu */}
      <div className="flex shrink-0 items-center gap-1 md:hidden">
        <NotificationBell
          unreadCount={unreadCount}
          isOpen={isPanelOpen}
          onToggle={() => setPanelOpen(!isPanelOpen)}
        />
        <UserMenu />
      </div>

      {/* Desktop layout: search trigger + user menu (right-aligned) */}
      <div className="hidden md:flex md:flex-1 md:items-center md:justify-between">
        <div />
        <div className="flex items-center gap-3">
          <SearchTrigger />
          <NotificationBell
            unreadCount={unreadCount}
            isOpen={isPanelOpen}
            onToggle={() => setPanelOpen(!isPanelOpen)}
          />
          <UserMenu />
        </div>
      </div>

      {/* Notification Center panel */}
      <NotificationCenter
        isOpen={isPanelOpen}
        onClose={() => setPanelOpen(false)}
      />
    </motion.header>
  )
}
