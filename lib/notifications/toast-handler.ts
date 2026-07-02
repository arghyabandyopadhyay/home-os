import { toast } from "sonner"
import type { Notification } from "@/types/notification"

export function showNotificationToast(
  notification: Notification,
  options: {
    quietHoursActive: boolean
    onNavigate: (route: string) => void
  }
): void {
  if (options.quietHoursActive) return

  const duration = notification.type === "system_alert" ? Infinity : 5000

  toast(notification.title, {
    description: truncateBody(notification.body, 80),
    duration,
    action: notification.targetRoute
      ? { label: "View", onClick: () => options.onNavigate(notification.targetRoute!) }
      : undefined,
  })
}

export function truncateBody(body: string, maxLength: number): string {
  if (body.length <= maxLength) return body
  const truncated = body.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(" ")
  return (lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated) + "…"
}
