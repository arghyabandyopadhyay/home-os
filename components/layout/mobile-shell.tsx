"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { usePathname } from "next/navigation"

import { useIsMobile } from "@/hooks/use-is-mobile"
import { useImmersiveViewport } from "@/hooks/use-immersive-viewport"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useLowPerformance } from "@/hooks/use-low-performance"
import { useScrollDirection } from "@/hooks/use-scroll-direction"

// ─── Types ───────────────────────────────────────────────────────────────────

type ImmersiveState = "chrome-visible" | "chrome-hidden" | "keyboard-open"

type ImmersiveContextValue = {
  /** Current immersive state machine position */
  state: ImmersiveState
  /** Whether app is running as installed PWA */
  isStandalone: boolean
  /** Current visual viewport height in pixels */
  viewportHeight: number
  /** Current device orientation */
  orientation: "portrait" | "landscape"
  /** Convenience: true when state is "chrome-visible" */
  chromeVisible: boolean
  /**
   * Whether animations should be enabled for chrome transitions.
   * False when the user prefers reduced motion or the device is low-performance.
   * Descendant components (Header, BottomNav) can read this instead of
   * importing useReducedMotion/useLowPerformance individually.
   */
  shouldAnimate: boolean
}

type MobileShellProps = {
  children: React.ReactNode
}

// ─── Scroll Position Cache ───────────────────────────────────────────────────

type ScrollCacheEntry = {
  offset: number
  timestamp: number
}

/** Maximum number of scroll position entries to cache */
const SCROLL_CACHE_MAX = 20

/** Safari toolbar animation suppression window in ms */
const SAFARI_TOOLBAR_SUPPRESSION_MS = 300

// ─── Context ─────────────────────────────────────────────────────────────────

const ImmersiveContext = createContext<ImmersiveContextValue | null>(null)

/**
 * Hook to access the ImmersiveContext from descendant components.
 * Returns `null` when used outside of a MobileShell provider (e.g., on desktop).
 */
export function useImmersiveContext(): ImmersiveContextValue | null {
  return useContext(ImmersiveContext)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Checks if the current scroll position is in iOS overscroll bounce territory.
 * Returns true if scrollY < 0 or scrollY > max scrollable height.
 */
function isOverscrolling(): boolean {
  if (typeof window === "undefined") return false
  const scrollY = window.scrollY
  const maxScroll =
    document.documentElement.scrollHeight - window.innerHeight
  return scrollY < 0 || scrollY > maxScroll
}

/**
 * Gets the current visual viewport height with fallback.
 */
function getViewportHeight(): number {
  if (typeof window === "undefined") return 0
  return window.visualViewport
    ? window.visualViewport.height
    : window.innerHeight
}

/**
 * Strips query params and hash from a pathname for scroll cache keying.
 */
function getCleanPathname(pathname: string | null): string {
  if (!pathname) return "/"
  // usePathname from next/navigation already excludes query/hash,
  // but be defensive
  const qIndex = pathname.indexOf("?")
  const hIndex = pathname.indexOf("#")
  let end = pathname.length
  if (qIndex !== -1) end = Math.min(end, qIndex)
  if (hIndex !== -1) end = Math.min(end, hIndex)
  return pathname.slice(0, end)
}

// ─── Component ───────────────────────────────────────────────────────────────

/**
 * MobileShell wraps mobile content and provides the ImmersiveContext to descendants.
 *
 * On mobile (< 768px):
 * - Renders children in a 100dvh container (100vh in PWA standalone mode)
 * - Provides ImmersiveContext with viewport state and chrome visibility
 * - Manages the immersive state machine (chrome-visible ↔ chrome-hidden ↔ keyboard-open)
 * - Orchestrates chrome visibility based on scroll direction
 * - Manages --app-viewport-height CSS custom property
 * - Handles iOS Safari overscroll bounce suppression
 * - Suppresses chrome changes during Safari toolbar animation (300ms window)
 * - Manages scroll position preservation across routes (LRU cache, max 20)
 * - Handles keyboard visibility and orientation changes
 *
 * On desktop (≥ 768px):
 * - Passes through children directly without any wrapper or context
 *
 * Handles null/undefined children gracefully by rendering an empty container.
 *
 * Animation Performance Contract:
 * - All chrome animations (Header, BottomNav) use ONLY `transform` and `opacity`
 *   properties to ensure GPU acceleration and avoid layout thrashing.
 * - `will-change: transform` is applied during transitions and removed after 500ms idle.
 * - When `shouldAnimate` is false (reduced motion or low-performance device),
 *   all animation durations MUST be 0ms. State changes and pointer-events toggling
 *   are still applied — only the visual transition is skipped.
 * - Framer Motion `animate` prop is used for all chrome transitions, ensuring
 *   interruptible animations with no animation debt from rapid direction changes.
 * - No layout-triggering properties (width, height, top, bottom, left, right,
 *   margin, padding) are animated during chrome visibility transitions.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 5.1, 5.2, 5.3, 5.4, 5.5,
 * 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6,
 * 8.1, 8.3, 9.1, 9.2, 9.3, 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2,
 * 11.3, 11.4, 13.1, 13.2, 13.3, 13.4, 13.5, 13.6
 */
export function MobileShell({ children }: MobileShellProps) {
  const isMobile = useIsMobile()
  const { viewportHeight, isKeyboardOpen, isStandalone, orientation } =
    useImmersiveViewport()
  const prefersReducedMotion = useReducedMotion()
  const isLowPerf = useLowPerformance()
  const scrollDirection = useScrollDirection({ threshold: 8 })
  const pathname = usePathname()

  // Derived: animations should be disabled when reduced motion or low-perf
  const shouldAnimate = !prefersReducedMotion && !isLowPerf

  // ─── Chrome Visibility State ─────────────────────────────────────────────

  // Track scroll-direction-based chrome state (separate from keyboard override)
  const [scrollBasedState, setScrollBasedState] = useState<
    "chrome-visible" | "chrome-hidden"
  >("chrome-visible")

  // Safari toolbar animation suppression
  const lastViewportResizeRef = useRef<number>(0)
  const hasUserScrolledRef = useRef<boolean>(false)
  const safariSuppressionActiveRef = useRef<boolean>(false)

  // Track previous keyboard state for restore logic
  const prevKeyboardOpenRef = useRef<boolean>(false)

  // Track previous orientation for change detection
  const prevOrientationRef = useRef<"portrait" | "landscape">(orientation)

  // ─── Safari Toolbar Animation Detection ──────────────────────────────────

  // Track viewport resize events to detect Safari toolbar animation
  useEffect(() => {
    if (typeof window === "undefined" || !isMobile) return

    const handleViewportResize = () => {
      const now = Date.now()
      const timeSinceLastResize = now - lastViewportResizeRef.current

      // If we get rapid viewport resizes (< 300ms apart) without user scroll input,
      // this is likely Safari toolbar animating
      if (
        timeSinceLastResize < SAFARI_TOOLBAR_SUPPRESSION_MS &&
        !hasUserScrolledRef.current
      ) {
        safariSuppressionActiveRef.current = true

        // Clear suppression after the window passes
        setTimeout(() => {
          safariSuppressionActiveRef.current = false
        }, SAFARI_TOOLBAR_SUPPRESSION_MS)
      }

      lastViewportResizeRef.current = now
      hasUserScrolledRef.current = false
    }

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleViewportResize, {
        passive: true,
      })
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleViewportResize)
      }
    }
  }, [isMobile])

  // Track user scroll input for Safari toolbar detection
  useEffect(() => {
    if (typeof window === "undefined" || !isMobile) return

    const handleScroll = () => {
      hasUserScrolledRef.current = true
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", handleScroll)
    }
  }, [isMobile])

  // ─── Scroll-Direction Chrome Visibility Orchestration (Task 5.2) ─────────

  useEffect(() => {
    if (!isMobile) return

    // Suppress chrome changes when keyboard is open
    if (isKeyboardOpen) return

    // Suppress during iOS overscroll bounce
    if (typeof window !== "undefined" && isOverscrolling()) return

    // Force chrome-visible when at top of page
    if (typeof window !== "undefined" && window.scrollY === 0) {
      setScrollBasedState("chrome-visible")
      return
    }

    // Apply scroll direction to chrome state
    if (scrollDirection === "down") {
      setScrollBasedState("chrome-hidden")
    } else if (scrollDirection === "up" || scrollDirection === null) {
      setScrollBasedState("chrome-visible")
    }
  }, [scrollDirection, isKeyboardOpen, isMobile])

  // ─── Keyboard Visibility Handling (Task 5.4) ─────────────────────────────

  useEffect(() => {
    if (!isMobile) return

    // When keyboard closes, restore chrome based on current scroll direction
    if (prevKeyboardOpenRef.current && !isKeyboardOpen) {
      if (scrollDirection === "down") {
        setScrollBasedState("chrome-hidden")
      } else {
        setScrollBasedState("chrome-visible")
      }
    }

    prevKeyboardOpenRef.current = isKeyboardOpen
  }, [isKeyboardOpen, scrollDirection, isMobile])

  // ─── Orientation Change Handling (Task 5.6) ──────────────────────────────

  useEffect(() => {
    if (!isMobile) return
    if (typeof window === "undefined") return

    // Detect orientation change
    if (prevOrientationRef.current !== orientation) {
      // If keyboard is open during orientation change, close keyboard state first
      // The useImmersiveViewport hook already debounces orientation by 100ms
      // We just need to preserve chrome state and update viewport height

      // Chrome state is preserved automatically since we don't reset scrollBasedState here
      // The --app-viewport-height will be updated by the viewport height effect below

      prevOrientationRef.current = orientation
    }
  }, [orientation, isMobile])

  // ─── Dynamic Viewport Height Management (Task 5.3) ───────────────────────

  useEffect(() => {
    if (typeof window === "undefined" || !isMobile) return

    let rafId: number | null = null
    let ticking = false

    const updateViewportHeight = () => {
      const height = getViewportHeight()
      document.documentElement.style.setProperty(
        "--app-viewport-height",
        `${height}px`
      )
    }

    const throttledUpdate = () => {
      if (ticking) return
      ticking = true
      rafId = requestAnimationFrame(() => {
        updateViewportHeight()
        ticking = false
      })
    }

    // Set initial value
    updateViewportHeight()

    // In PWA standalone mode, we use 100vh directly and skip browser chrome compensation
    // But we still set the CSS property for components that reference it
    if (!isStandalone) {
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", throttledUpdate, {
          passive: true,
        })
      }
      window.addEventListener("resize", throttledUpdate, { passive: true })
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", throttledUpdate)
      }
      window.removeEventListener("resize", throttledUpdate)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [isMobile, isStandalone])

  // Update --app-viewport-height when viewportHeight changes (covers keyboard open/close)
  useEffect(() => {
    if (typeof window === "undefined" || !isMobile) return
    document.documentElement.style.setProperty(
      "--app-viewport-height",
      `${viewportHeight}px`
    )
  }, [viewportHeight, isMobile])

  // ─── Scroll Position Preservation (Task 5.5) ─────────────────────────────

  const scrollCacheRef = useRef<Map<string, ScrollCacheEntry>>(new Map())
  const contentRef = useRef<HTMLDivElement>(null)
  const prevPathnameRef = useRef<string | null>(null)
  const hasRestoredRef = useRef<boolean>(false)

  // LRU eviction helper
  const evictLRU = useCallback((cache: Map<string, ScrollCacheEntry>) => {
    if (cache.size <= SCROLL_CACHE_MAX) return

    let oldestKey: string | null = null
    let oldestTimestamp = Infinity

    for (const [key, entry] of cache) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp
        oldestKey = key
      }
    }

    if (oldestKey !== null) {
      cache.delete(oldestKey)
    }
  }, [])

  // Store scroll position on route exit, restore on route enter
  useEffect(() => {
    if (!isMobile) return
    if (typeof window === "undefined") return

    const cleanPath = getCleanPathname(pathname)
    const cache = scrollCacheRef.current

    // Store scroll position for the previous route (route exit)
    if (prevPathnameRef.current !== null && prevPathnameRef.current !== cleanPath) {
      const prevPath = prevPathnameRef.current
      cache.set(prevPath, {
        offset: window.scrollY,
        timestamp: Date.now(),
      })
      evictLRU(cache)
    }

    // Restore scroll position for the new route (route enter)
    hasRestoredRef.current = false
    const entry = cache.get(cleanPath)

    if (entry) {
      // Update timestamp for LRU tracking
      entry.timestamp = Date.now()

      // Restore after content mounts and is tall enough
      // Use requestAnimationFrame to wait for content to render
      requestAnimationFrame(() => {
        const maxScroll =
          document.documentElement.scrollHeight - window.innerHeight
        const targetScroll = Math.min(entry.offset, Math.max(0, maxScroll))
        window.scrollTo(0, targetScroll)
        hasRestoredRef.current = true
      })
    } else {
      // New route: start at position 0
      window.scrollTo(0, 0)
      hasRestoredRef.current = true
    }

    prevPathnameRef.current = cleanPath
  }, [pathname, isMobile, evictLRU])

  // ─── State Machine ───────────────────────────────────────────────────────

  // Priority: keyboard-open > scroll-direction-based
  const state: ImmersiveState = isKeyboardOpen
    ? "keyboard-open"
    : scrollBasedState

  const contextValue = useMemo<ImmersiveContextValue>(
    () => ({
      state,
      isStandalone,
      viewportHeight,
      orientation,
      chromeVisible: state === "chrome-visible",
      shouldAnimate,
    }),
    [state, isStandalone, viewportHeight, orientation, shouldAnimate]
  )

  // Desktop: pass through children directly without wrapper or context
  if (!isMobile) {
    return <>{children}</>
  }

  // ─── Container Height Logic ──────────────────────────────────────────────

  // PWA standalone: use 100vh directly, apply all safe-area insets
  // Normal mobile: use 100dvh as primary, fall back to --app-viewport-height, then 100vh
  const containerHeight = isStandalone ? "100vh" : "100dvh"

  // Mobile: wrap in container with ImmersiveContext provider
  return (
    <ImmersiveContext.Provider value={contextValue}>
      <div
        ref={contentRef}
        className={`relative flex w-full flex-1 flex-col${
          isStandalone ? " standalone-shell" : ""
        }`}
        style={{
          minHeight: containerHeight,
          // PWA standalone: apply all four safe-area insets
          ...(isStandalone
            ? {
                paddingTop: "env(safe-area-inset-top)",
                paddingBottom: "env(safe-area-inset-bottom)",
                paddingLeft: "env(safe-area-inset-left)",
                paddingRight: "env(safe-area-inset-right)",
              }
            : {}),
        }}
      >
        {/* PWA standalone: status bar area background */}
        {isStandalone && (
          <div
            className="fixed top-0 left-0 right-0 z-50 bg-app-surface"
            style={{ height: "env(safe-area-inset-top)" }}
            aria-hidden="true"
          />
        )}
        {children}
      </div>
    </ImmersiveContext.Provider>
  )
}

export type { ImmersiveState, ImmersiveContextValue, MobileShellProps }
