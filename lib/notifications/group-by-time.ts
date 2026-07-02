import type { Notification } from "@/types/notification"

export type TimeGroup = "Today" | "Yesterday" | "This Week" | "Older"

export type GroupedNotifications = {
  group: TimeGroup
  notifications: Notification[]
}[]

/**
 * Groups notifications by comparing `createdAt` against the current local date.
 * Returns only non-empty groups in display order (Today → Yesterday → This Week → Older).
 * Maintains reverse chronological order (newest first) within each group.
 */
export function groupNotificationsByTime(
  notifications: Notification[]
): GroupedNotifications {
  const now = new Date()
  const today = startOfDay(now)
  const yesterday = startOfDay(new Date(today.getTime() - 86_400_000))
  const startOfWeek = getStartOfWeek(today)

  const groups: Record<TimeGroup, Notification[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Older: [],
  }

  for (const notification of notifications) {
    const createdAt = new Date(notification.createdAt)
    const createdDay = startOfDay(createdAt)

    if (createdDay.getTime() === today.getTime()) {
      groups.Today.push(notification)
    } else if (createdDay.getTime() === yesterday.getTime()) {
      groups.Yesterday.push(notification)
    } else if (createdDay.getTime() >= startOfWeek.getTime()) {
      groups["This Week"].push(notification)
    } else {
      groups.Older.push(notification)
    }
  }

  // Sort each group in reverse chronological order (newest first)
  const sortDesc = (a: Notification, b: Notification) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()

  for (const key of Object.keys(groups) as TimeGroup[]) {
    groups[key].sort(sortDesc)
  }

  // Return only non-empty groups in display order
  const order: TimeGroup[] = ["Today", "Yesterday", "This Week", "Older"]

  return order
    .filter((group) => groups[group].length > 0)
    .map((group) => ({ group, notifications: groups[group] }))
}

/** Returns midnight (00:00:00.000) of the given date in local timezone */
function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Returns the start of the current week (Monday 00:00:00.000) in local timezone */
function getStartOfWeek(today: Date): Date {
  const d = new Date(today)
  const day = d.getDay()
  // getDay(): 0=Sun, 1=Mon, ..., 6=Sat → shift so Monday is first day
  const diff = day === 0 ? 6 : day - 1
  d.setDate(d.getDate() - diff)
  d.setHours(0, 0, 0, 0)
  return d
}
