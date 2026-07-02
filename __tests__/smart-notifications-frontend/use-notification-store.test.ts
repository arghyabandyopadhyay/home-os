/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from "vitest"
import { useNotificationStore } from "@/hooks/use-notification-store"
import type { Notification } from "@/types/notification"

function createNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    type: "task_due",
    title: "Test notification",
    body: "Test body",
    read: false,
    dismissed: false,
    targetRoute: null,
    createdAt: new Date().toISOString(),
    metadata: {},
    ...overrides,
  }
}

describe("hooks/use-notification-store", () => {
  beforeEach(() => {
    // Reset store between tests
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      connectionStatus: "disconnected",
      isPanelOpen: false,
      quietHoursActive: false,
    })
  })

  describe("initial state", () => {
    it("starts with empty notifications", () => {
      expect(useNotificationStore.getState().notifications).toEqual([])
    })

    it("starts with unreadCount of 0", () => {
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })

    it("starts with disconnected connection status", () => {
      expect(useNotificationStore.getState().connectionStatus).toBe("disconnected")
    })

    it("starts with panel closed", () => {
      expect(useNotificationStore.getState().isPanelOpen).toBe(false)
    })

    it("starts with quiet hours inactive", () => {
      expect(useNotificationStore.getState().quietHoursActive).toBe(false)
    })
  })

  describe("setNotifications", () => {
    it("replaces the notifications list", () => {
      const notifications = [createNotification(), createNotification()]
      useNotificationStore.getState().setNotifications(notifications)
      expect(useNotificationStore.getState().notifications).toEqual(notifications)
    })

    it("can set to empty array", () => {
      useNotificationStore.getState().setNotifications([createNotification()])
      useNotificationStore.getState().setNotifications([])
      expect(useNotificationStore.getState().notifications).toEqual([])
    })
  })

  describe("prependNotification", () => {
    it("adds notification to the beginning of the list", () => {
      const first = createNotification({ id: "first" })
      const second = createNotification({ id: "second" })

      useNotificationStore.getState().prependNotification(first)
      useNotificationStore.getState().prependNotification(second)

      const { notifications } = useNotificationStore.getState()
      expect(notifications[0].id).toBe("second")
      expect(notifications[1].id).toBe("first")
    })

    it("increments unread count by 1", () => {
      useNotificationStore.getState().prependNotification(createNotification())
      expect(useNotificationStore.getState().unreadCount).toBe(1)

      useNotificationStore.getState().prependNotification(createNotification())
      expect(useNotificationStore.getState().unreadCount).toBe(2)
    })
  })

  describe("markAsRead", () => {
    it("sets the notification to read: true", () => {
      const notification = createNotification({ id: "n1", read: false })
      useNotificationStore.setState({ notifications: [notification], unreadCount: 1 })

      useNotificationStore.getState().markAsRead("n1")

      const updated = useNotificationStore.getState().notifications[0]
      expect(updated.read).toBe(true)
    })

    it("decrements unread count when marking an unread notification", () => {
      const notification = createNotification({ id: "n1", read: false })
      useNotificationStore.setState({ notifications: [notification], unreadCount: 1 })

      useNotificationStore.getState().markAsRead("n1")
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })

    it("does not decrement unread count when notification is already read", () => {
      const notification = createNotification({ id: "n1", read: true })
      useNotificationStore.setState({ notifications: [notification], unreadCount: 1 })

      useNotificationStore.getState().markAsRead("n1")
      expect(useNotificationStore.getState().unreadCount).toBe(1)
    })

    it("does not change state when notification id is not found", () => {
      const notification = createNotification({ id: "n1", read: false })
      useNotificationStore.setState({ notifications: [notification], unreadCount: 1 })

      useNotificationStore.getState().markAsRead("nonexistent")

      expect(useNotificationStore.getState().unreadCount).toBe(1)
      expect(useNotificationStore.getState().notifications[0].read).toBe(false)
    })
  })

  describe("markAllAsRead", () => {
    it("sets all notifications to read: true", () => {
      const notifications = [
        createNotification({ id: "n1", read: false }),
        createNotification({ id: "n2", read: true }),
        createNotification({ id: "n3", read: false }),
      ]
      useNotificationStore.setState({ notifications, unreadCount: 2 })

      useNotificationStore.getState().markAllAsRead()

      const updated = useNotificationStore.getState().notifications
      expect(updated.every((n) => n.read)).toBe(true)
    })

    it("resets unread count to 0", () => {
      const notifications = [
        createNotification({ read: false }),
        createNotification({ read: false }),
      ]
      useNotificationStore.setState({ notifications, unreadCount: 2 })

      useNotificationStore.getState().markAllAsRead()
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })

  describe("dismissNotification", () => {
    it("removes the notification from the list", () => {
      const notifications = [
        createNotification({ id: "n1" }),
        createNotification({ id: "n2" }),
      ]
      useNotificationStore.setState({ notifications, unreadCount: 2 })

      useNotificationStore.getState().dismissNotification("n1")

      const remaining = useNotificationStore.getState().notifications
      expect(remaining).toHaveLength(1)
      expect(remaining[0].id).toBe("n2")
    })

    it("decrements unread count when dismissing an unread notification", () => {
      const notifications = [createNotification({ id: "n1", read: false })]
      useNotificationStore.setState({ notifications, unreadCount: 1 })

      useNotificationStore.getState().dismissNotification("n1")
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })

    it("does not decrement unread count when dismissing a read notification", () => {
      const notifications = [
        createNotification({ id: "n1", read: true }),
        createNotification({ id: "n2", read: false }),
      ]
      useNotificationStore.setState({ notifications, unreadCount: 1 })

      useNotificationStore.getState().dismissNotification("n1")
      expect(useNotificationStore.getState().unreadCount).toBe(1)
    })

    it("does not change state when notification id is not found", () => {
      const notifications = [createNotification({ id: "n1" })]
      useNotificationStore.setState({ notifications, unreadCount: 1 })

      useNotificationStore.getState().dismissNotification("nonexistent")

      expect(useNotificationStore.getState().notifications).toHaveLength(1)
      expect(useNotificationStore.getState().unreadCount).toBe(1)
    })
  })

  describe("setUnreadCount", () => {
    it("sets the unread count to a specific value", () => {
      useNotificationStore.getState().setUnreadCount(5)
      expect(useNotificationStore.getState().unreadCount).toBe(5)
    })
  })

  describe("incrementUnreadCount", () => {
    it("increments unread count by 1", () => {
      useNotificationStore.setState({ unreadCount: 3 })
      useNotificationStore.getState().incrementUnreadCount()
      expect(useNotificationStore.getState().unreadCount).toBe(4)
    })
  })

  describe("decrementUnreadCount", () => {
    it("decrements unread count by 1", () => {
      useNotificationStore.setState({ unreadCount: 3 })
      useNotificationStore.getState().decrementUnreadCount()
      expect(useNotificationStore.getState().unreadCount).toBe(2)
    })

    it("never goes below 0", () => {
      useNotificationStore.setState({ unreadCount: 0 })
      useNotificationStore.getState().decrementUnreadCount()
      expect(useNotificationStore.getState().unreadCount).toBe(0)
    })
  })

  describe("setConnectionStatus", () => {
    it("updates the connection status", () => {
      useNotificationStore.getState().setConnectionStatus("connecting")
      expect(useNotificationStore.getState().connectionStatus).toBe("connecting")

      useNotificationStore.getState().setConnectionStatus("connected")
      expect(useNotificationStore.getState().connectionStatus).toBe("connected")

      useNotificationStore.getState().setConnectionStatus("reconnecting")
      expect(useNotificationStore.getState().connectionStatus).toBe("reconnecting")

      useNotificationStore.getState().setConnectionStatus("disconnected")
      expect(useNotificationStore.getState().connectionStatus).toBe("disconnected")
    })
  })

  describe("setPanelOpen", () => {
    it("sets panel open state", () => {
      useNotificationStore.getState().setPanelOpen(true)
      expect(useNotificationStore.getState().isPanelOpen).toBe(true)

      useNotificationStore.getState().setPanelOpen(false)
      expect(useNotificationStore.getState().isPanelOpen).toBe(false)
    })
  })

  describe("setQuietHoursActive", () => {
    it("sets quiet hours active state", () => {
      useNotificationStore.getState().setQuietHoursActive(true)
      expect(useNotificationStore.getState().quietHoursActive).toBe(true)

      useNotificationStore.getState().setQuietHoursActive(false)
      expect(useNotificationStore.getState().quietHoursActive).toBe(false)
    })
  })

  describe("appendNotifications", () => {
    it("adds notifications to the end of the list", () => {
      const existing = [createNotification({ id: "existing" })]
      useNotificationStore.setState({ notifications: existing })

      const newNotifications = [
        createNotification({ id: "new1" }),
        createNotification({ id: "new2" }),
      ]
      useNotificationStore.getState().appendNotifications(newNotifications)

      const { notifications } = useNotificationStore.getState()
      expect(notifications).toHaveLength(3)
      expect(notifications[0].id).toBe("existing")
      expect(notifications[1].id).toBe("new1")
      expect(notifications[2].id).toBe("new2")
    })

    it("works with empty existing list", () => {
      const newNotifications = [createNotification({ id: "new1" })]
      useNotificationStore.getState().appendNotifications(newNotifications)
      expect(useNotificationStore.getState().notifications).toHaveLength(1)
    })
  })
})
