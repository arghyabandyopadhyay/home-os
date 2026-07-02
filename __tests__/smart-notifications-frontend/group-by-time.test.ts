import { describe, it, expect, vi, afterEach } from "vitest"
import {
  groupNotificationsByTime,
  type TimeGroup,
  type GroupedNotifications,
} from "@/lib/notifications/group-by-time"
import type { Notification } from "@/types/notification"

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: overrides.id ?? "test-id",
    type: overrides.type ?? "task_due",
    title: overrides.title ?? "Test notification",
    body: overrides.body ?? "Test body",
    read: overrides.read ?? false,
    dismissed: overrides.dismissed ?? false,
    targetRoute: overrides.targetRoute ?? null,
    createdAt: overrides.createdAt ?? new Date().toISOString(),
    metadata: overrides.metadata ?? {},
  }
}

describe("groupNotificationsByTime", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns an empty array when given no notifications", () => {
    const result = groupNotificationsByTime([])
    expect(result).toEqual([])
  })

  it("groups a notification created today into 'Today'", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-06-12T14:00:00"))

    const notification = makeNotification({
      id: "1",
      createdAt: "2024-06-12T10:00:00",
    })

    const result = groupNotificationsByTime([notification])
    expect(result).toHaveLength(1)
    expect(result[0].group).toBe("Today")
    expect(result[0].notifications).toHaveLength(1)
  })

  it("groups a notification from yesterday into 'Yesterday'", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-06-12T14:00:00"))

    const notification = makeNotification({
      id: "1",
      createdAt: "2024-06-11T18:00:00",
    })

    const result = groupNotificationsByTime([notification])
    expect(result).toHaveLength(1)
    expect(result[0].group).toBe("Yesterday")
  })

  it("groups a notification from this week (not today/yesterday) into 'This Week'", () => {
    vi.useFakeTimers()
    // Wednesday June 12, 2024
    vi.setSystemTime(new Date("2024-06-12T14:00:00"))

    // Monday June 10, 2024 — same week, not yesterday
    const notification = makeNotification({
      id: "1",
      createdAt: "2024-06-10T10:00:00",
    })

    const result = groupNotificationsByTime([notification])
    expect(result).toHaveLength(1)
    expect(result[0].group).toBe("This Week")
  })

  it("groups a notification from before this week into 'Older'", () => {
    vi.useFakeTimers()
    // Wednesday June 12, 2024
    vi.setSystemTime(new Date("2024-06-12T14:00:00"))

    // June 3, 2024 — previous week
    const notification = makeNotification({
      id: "1",
      createdAt: "2024-06-03T10:00:00",
    })

    const result = groupNotificationsByTime([notification])
    expect(result).toHaveLength(1)
    expect(result[0].group).toBe("Older")
  })

  it("returns only non-empty groups", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-06-12T14:00:00"))

    const notifications = [
      makeNotification({ id: "1", createdAt: "2024-06-12T10:00:00" }),
      makeNotification({ id: "2", createdAt: "2024-06-03T10:00:00" }),
    ]

    const result = groupNotificationsByTime(notifications)
    expect(result).toHaveLength(2)
    expect(result[0].group).toBe("Today")
    expect(result[1].group).toBe("Older")
  })

  it("returns groups in display order: Today, Yesterday, This Week, Older", () => {
    vi.useFakeTimers()
    // Wednesday June 12, 2024
    vi.setSystemTime(new Date("2024-06-12T14:00:00"))

    const notifications = [
      makeNotification({ id: "1", createdAt: "2024-06-01T10:00:00" }), // Older
      makeNotification({ id: "2", createdAt: "2024-06-10T10:00:00" }), // This Week (Mon)
      makeNotification({ id: "3", createdAt: "2024-06-12T08:00:00" }), // Today
      makeNotification({ id: "4", createdAt: "2024-06-11T08:00:00" }), // Yesterday
    ]

    const result = groupNotificationsByTime(notifications)
    const groupOrder = result.map((g) => g.group)
    expect(groupOrder).toEqual(["Today", "Yesterday", "This Week", "Older"])
  })

  it("maintains reverse chronological order within each group", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-06-12T23:00:00"))

    const notifications = [
      makeNotification({ id: "early", createdAt: "2024-06-12T08:00:00" }),
      makeNotification({ id: "mid", createdAt: "2024-06-12T12:00:00" }),
      makeNotification({ id: "late", createdAt: "2024-06-12T18:00:00" }),
    ]

    const result = groupNotificationsByTime(notifications)
    expect(result).toHaveLength(1)
    expect(result[0].group).toBe("Today")

    const ids = result[0].notifications.map((n) => n.id)
    expect(ids).toEqual(["late", "mid", "early"])
  })

  it("handles notifications at midnight boundary correctly", () => {
    vi.useFakeTimers()
    // 12:01 AM on June 12
    vi.setSystemTime(new Date("2024-06-12T00:01:00"))

    const todayMidnight = makeNotification({
      id: "midnight",
      createdAt: "2024-06-12T00:00:00",
    })
    const yesterdayLate = makeNotification({
      id: "yesterday-late",
      createdAt: "2024-06-11T23:59:59",
    })

    const result = groupNotificationsByTime([todayMidnight, yesterdayLate])
    expect(result).toHaveLength(2)
    expect(result[0].group).toBe("Today")
    expect(result[0].notifications[0].id).toBe("midnight")
    expect(result[1].group).toBe("Yesterday")
    expect(result[1].notifications[0].id).toBe("yesterday-late")
  })

  it("handles Monday correctly — Sunday of previous week goes to 'Older'", () => {
    vi.useFakeTimers()
    // Monday June 10, 2024
    vi.setSystemTime(new Date("2024-06-10T14:00:00"))

    // Sunday June 9, 2024 — previous week
    const sundayNotification = makeNotification({
      id: "sunday",
      createdAt: "2024-06-09T12:00:00",
    })

    const result = groupNotificationsByTime([sundayNotification])
    expect(result).toHaveLength(1)
    // On Monday, Sunday is yesterday
    expect(result[0].group).toBe("Yesterday")
  })

  it("handles Sunday correctly — same week Mon-Fri go to 'This Week'", () => {
    vi.useFakeTimers()
    // Sunday June 16, 2024
    vi.setSystemTime(new Date("2024-06-16T14:00:00"))

    // Monday June 10, 2024 — start of this week
    const mondayNotification = makeNotification({
      id: "monday",
      createdAt: "2024-06-10T12:00:00",
    })

    const result = groupNotificationsByTime([mondayNotification])
    expect(result).toHaveLength(1)
    expect(result[0].group).toBe("This Week")
  })
})
