"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"

import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useLowPerformance } from "@/hooks/use-low-performance"
import { useNotificationStore } from "@/hooks/use-notification-store"
import {
  useNotifications,
  useMarkAsRead,
  useMarkAsUnread,
  useDismissNotification,
  useMarkAllAsRead,
} from "@/hooks/queries/use-notifications"
import { DURATION, EASING } from "@/lib/motion"
import { NotificationList } from "@/components/notifications/notification-list"
import { NotificationEmpty } from "@/components/notifications/notification-empty"

type NotificationCenterProps = {
  isOpen: boolean
  onClose: () => void
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const prefersReducedMotion = useReducedMotion()
  const isLowPerf = useLowPerformance()
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  const { markAllAsRead: storeMarkAllAsRead } = useNotificationStore()

  // Queries and mutations
  const {
    data,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useNotifications()

  const markAsReadMutation = useMarkAsRead()
  const markAsUnreadMutation = useMarkAsUnread()
  const dismissMutation = useDismissNotification()
  const markAllAsReadMutation = useMarkAllAsRead()

  // Flatten all notification pages into a single list
  const notifications = data?.pages.flatMap((page) => page.notifications) ?? []

  // Detect mobile viewport
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)")
    setIsMobile(mql.matches)

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  // Save previous focus and manage focus trap on open/close
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null
      // Prevent body scroll
      document.body.style.overflow = "hidden"
      // Focus the panel after animation starts
      requestAnimationFrame(() => {
        panelRef.current?.focus()
      })
    } else {
      document.body.style.overflow = ""
      // Return focus to bell button
      if (previousFocusRef.current) {
        previousFocusRef.current.focus()
        previousFocusRef.current = null
      }
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  // Focus trap — cycle through focusable elements inside the panel
  useEffect(() => {
    if (!isOpen) return

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return
      const panel = panelRef.current
      if (!panel) return

      const focusableElements = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (!firstElement || !lastElement) return

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener("keydown", handleTab)
    return () => document.removeEventListener("keydown", handleTab)
  }, [isOpen])

  // Auto-mark-as-read after 2 seconds of panel being open
  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      // Check unread count at the time of execution, not at effect setup
      const { unreadCount: currentUnread } = useNotificationStore.getState()
      if (currentUnread > 0) {
        storeMarkAllAsRead()
        markAllAsReadMutation.mutate()
      }
    }, 2000)

    return () => {
      clearTimeout(timer)
    }
  }, [isOpen, storeMarkAllAsRead, markAllAsReadMutation])

  // Handlers
  const handleBackdropClick = useCallback(() => {
    onClose()
  }, [onClose])

  const handleMarkAllAsRead = useCallback(() => {
    storeMarkAllAsRead()
    markAllAsReadMutation.mutate()
  }, [storeMarkAllAsRead, markAllAsReadMutation])

  const handleMarkAsRead = useCallback(
    (id: string) => {
      markAsReadMutation.mutate(id)
    },
    [markAsReadMutation]
  )

  const handleMarkAsUnread = useCallback(
    (id: string) => {
      markAsUnreadMutation.mutate(id)
    },
    [markAsUnreadMutation]
  )

  const handleDismiss = useCallback(
    (id: string) => {
      dismissMutation.mutate(id)
    },
    [dismissMutation]
  )

  const handleNavigate = useCallback(
    (route: string) => {
      router.push(route)
      onClose()
    },
    [router, onClose]
  )

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Animation configuration
  const shouldAnimate = !prefersReducedMotion
  const duration = shouldAnimate ? DURATION.slow : 0

  // Desktop: slide from right; Mobile: slide from bottom
  const panelAnimation = isMobile
    ? {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%" },
      }
    : {
        initial: { x: "100%" },
        animate: { x: 0 },
        exit: { x: "100%" },
      }

  const backdropClass = isLowPerf
    ? "fixed inset-0 z-50 bg-black/40"
    : "fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"

  const panelClass = isMobile
    ? "panel-app fixed inset-x-0 bottom-0 z-50 flex h-[80vh] flex-col rounded-t-2xl shadow-2xl outline-none"
    : "panel-app fixed inset-y-0 right-0 z-50 flex w-[380px] flex-col shadow-2xl outline-none"

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            className={backdropClass}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: shouldAnimate ? DURATION.normal : 0, ease: EASING.entrance }}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="Notification center"
            aria-modal="true"
            tabIndex={-1}
            className={panelClass}
            {...panelAnimation}
            transition={{
              duration,
              ease: shouldAnimate ? EASING.entrance : undefined,
            }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-app px-4 py-3">
              <h2 className="text-lg font-semibold tracking-tight">Notifications</h2>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="rounded-lg px-2 py-1 text-xs text-app-muted transition-colors hover:bg-app-elevated hover:text-app"
                  >
                    Mark all as read
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center justify-center rounded-lg p-1.5 text-app-muted transition-colors hover:bg-app-elevated hover:text-app"
                  aria-label="Close notification center"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <NotificationEmpty />
              ) : (
                <NotificationList
                  notifications={notifications}
                  hasNextPage={hasNextPage ?? false}
                  isFetchingNext={isFetchingNextPage}
                  onLoadMore={handleLoadMore}
                  onMarkAsRead={handleMarkAsRead}
                  onMarkAsUnread={handleMarkAsUnread}
                  onDismiss={handleDismiss}
                  onNavigate={handleNavigate}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
