"use client"

import { useRef, useEffect } from "react"
import type { Notification } from "@/types/notification"
import { groupNotificationsByTime } from "@/lib/notifications/group-by-time"
import { NotificationItem } from "@/components/notifications/notification-item"

type NotificationListProps = {
  notifications: Notification[]
  hasNextPage: boolean
  isFetchingNext: boolean
  onLoadMore: () => void
  onMarkAsRead: (id: string) => void
  onMarkAsUnread: (id: string) => void
  onDismiss: (id: string) => void
  onNavigate: (route: string) => void
}

export function NotificationList({
  notifications,
  hasNextPage,
  isFetchingNext,
  onLoadMore,
  onMarkAsRead,
  onMarkAsUnread,
  onDismiss,
  onNavigate,
}: NotificationListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && hasNextPage && !isFetchingNext) {
          onLoadMore()
        }
      },
      { rootMargin: "0px 0px 200px 0px" }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [hasNextPage, isFetchingNext, onLoadMore])

  const grouped = groupNotificationsByTime(notifications)

  return (
    <div className="flex flex-col">
      {grouped.map(({ group, notifications: groupNotifications }) => (
        <section key={group} aria-label={`${group} notifications`}>
          <h3 className="px-4 pb-1 pt-4 text-xs uppercase tracking-wide text-app-muted">
            {group}
          </h3>
          <div className="flex flex-col">
            {groupNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={() => onMarkAsRead(notification.id)}
                onMarkAsUnread={() => onMarkAsUnread(notification.id)}
                onDismiss={() => onDismiss(notification.id)}
                onNavigate={() => {
                  if (notification.targetRoute) {
                    onNavigate(notification.targetRoute)
                  }
                }}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Sentinel element for infinite scroll */}
      <div ref={sentinelRef} aria-hidden="true" />

      {/* Loading spinner when fetching next page */}
      {isFetchingNext && (
        <div className="flex justify-center py-3">
          <div
            className="h-4 w-4 animate-spin rounded-full border-2 border-app-elevated border-t-app"
            role="status"
            aria-label="Loading more notifications"
          />
        </div>
      )}
    </div>
  )
}
