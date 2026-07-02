"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"
import { useNotificationStore } from "@/hooks/use-notification-store"
import { useNotificationHub } from "@/hooks/use-notification-hub"
import {
  useUnreadCount,
  useNotificationPreferences,
} from "@/hooks/queries/use-notifications"
import { useQuietHours } from "@/hooks/use-quiet-hours"
import { showNotificationToast } from "@/lib/notifications/toast-handler"
import type { NotificationHubEvent } from "@/types/notification"

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  // Auth token state
  const [token, setToken] = useState("")

  // Store actions
  const {
    setUnreadCount,
    prependNotification,
    setConnectionStatus,
    setQuietHoursActive,
    quietHoursActive,
  } = useNotificationStore()

  // ARIA live region announcement state
  const [announcement, setAnnouncement] = useState("")

  // 1. Fetch auth token on mount
  useEffect(() => {
    const supabase = createClient()

    async function fetchToken() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setToken(session?.access_token ?? "")
    }

    fetchToken()

    // Listen for auth state changes to keep token fresh
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? "")
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 2. Fetch initial unread count and sync to store
  const { data: unreadCountData } = useUnreadCount()

  useEffect(() => {
    if (unreadCountData) {
      setUnreadCount(unreadCountData.count)
    }
  }, [unreadCountData, setUnreadCount])

  // 3. Load notification preferences for quiet hours
  const { data: preferences } = useNotificationPreferences()
  const { isActive: quietHoursIsActive } = useQuietHours(preferences)

  // 4. Sync quiet hours active state to store
  useEffect(() => {
    setQuietHoursActive(quietHoursIsActive)
  }, [quietHoursIsActive, setQuietHoursActive])

  // Ref to track quiet hours for the hub callback (avoids stale closure)
  const quietHoursActiveRef = useRef(quietHoursActive)
  useEffect(() => {
    quietHoursActiveRef.current = quietHoursActive
  }, [quietHoursActive])

  // 5. Handle incoming notifications from SignalR
  const handleNotification = useCallback(
    (event: NotificationHubEvent) => {
      const { notification } = event

      // Update store: prepend notification (also increments unread count)
      prependNotification(notification)

      // Show toast if not in quiet hours
      showNotificationToast(notification, {
        quietHoursActive: quietHoursActiveRef.current,
        onNavigate: (route) => router.push(route),
      })

      // Update ARIA live region for screen reader announcement
      setAnnouncement(notification.title)
    },
    [prependNotification, router]
  )

  // Handle connection status changes
  const handleStatusChange = useCallback(
    (status: "connected" | "connecting" | "reconnecting" | "disconnected") => {
      setConnectionStatus(status)
    },
    [setConnectionStatus]
  )

  // 6. Initialize SignalR hub connection
  useNotificationHub({
    enabled: !!token,
    token,
    onNotification: handleNotification,
    onStatusChange: handleStatusChange,
  })

  return (
    <>
      {children}
      {/* ARIA live region for screen reader announcements of new notifications */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </>
  )
}
