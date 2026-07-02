"use client"

import { CheckSquare, Calendar, AtSign, Info, Eye, EyeOff, X } from "lucide-react"
import type { Notification, NotificationType } from "@/types/notification"

type NotificationItemProps = {
  notification: Notification
  onMarkAsRead: () => void
  onMarkAsUnread: () => void
  onDismiss: () => void
  onNavigate: () => void
}

const typeIcons: Record<NotificationType, typeof CheckSquare> = {
  task_due: CheckSquare,
  calendar_reminder: Calendar,
  collaboration_mention: AtSign,
  system_alert: Info,
}

const typeLabels: Record<NotificationType, string> = {
  task_due: "Task due",
  calendar_reminder: "Calendar reminder",
  collaboration_mention: "Mention",
  system_alert: "System alert",
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) return "Just now"
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function truncateBody(body: string, maxLength = 80): string {
  if (body.length <= maxLength) return body
  const truncated = body.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(" ")
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "…"
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  onDismiss,
  onNavigate,
}: NotificationItemProps) {
  const Icon = typeIcons[notification.type]
  const typeLabel = typeLabels[notification.type]
  const readStatus = notification.read ? "Read" : "Unread"
  const ariaLabel = `${typeLabel}: ${notification.title}. ${readStatus}`

  return (
    <div
      className={`item-app group relative flex items-start gap-3 p-4 ${
        !notification.read
          ? "border-l-2 border-l-blue-400/60 bg-app-elevated/40"
          : "text-app-muted opacity-75"
      }`}
      aria-label={ariaLabel}
      role="article"
    >
      {/* Type icon */}
      <div className="mt-0.5 flex shrink-0 items-center justify-center">
        <Icon className="h-4 w-4 text-app-muted" aria-hidden="true" />
      </div>

      {/* Content — clickable body for navigation */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <button
          type="button"
          onClick={onNavigate}
          className="text-left focus:outline-none focus-visible:underline"
          tabIndex={0}
          aria-label={`Navigate to ${typeLabel.toLowerCase()}`}
        >
          <p className="text-sm font-medium leading-tight text-app">
            {notification.title}
          </p>
          {notification.body && (
            <p className="mt-0.5 text-xs leading-relaxed text-app-muted line-clamp-2">
              {truncateBody(notification.body)}
            </p>
          )}
        </button>
      </div>

      {/* Relative timestamp */}
      <span className="shrink-0 text-xs text-app-muted">
        {formatRelativeTime(notification.createdAt)}
      </span>

      {/* Action buttons — revealed on hover/focus */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
        {notification.read ? (
          <button
            type="button"
            onClick={onMarkAsUnread}
            className="rounded-lg p-1.5 text-app-muted hover:bg-app-elevated hover:text-app"
            aria-label="Mark as unread"
          >
            <EyeOff className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onMarkAsRead}
            className="rounded-lg p-1.5 text-app-muted hover:bg-app-elevated hover:text-app"
            aria-label="Mark as read"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-lg p-1.5 text-app-muted hover:bg-red-500/10 hover:text-red-500"
          aria-label="Dismiss notification"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
