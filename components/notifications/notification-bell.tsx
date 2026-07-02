"use client"

import { Bell } from "lucide-react"

type NotificationBellProps = {
  unreadCount: number
  isOpen: boolean
  onToggle: () => void
}

function formatBadgeText(count: number): string {
  if (count > 99) return "99+"
  return String(count)
}

export function NotificationBell({ unreadCount, isOpen, onToggle }: NotificationBellProps) {
  const ariaLabel =
    unreadCount > 0
      ? `Notifications, ${unreadCount} unread`
      : "Notifications"

  return (
    <button
      type="button"
      className="relative inline-flex items-center justify-center rounded-lg p-2 text-app-muted transition-colors hover:bg-app-elevated hover:text-app"
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      onClick={onToggle}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-app-elevated px-1 text-xs text-app">
          {formatBadgeText(unreadCount)}
        </span>
      )}
    </button>
  )
}
