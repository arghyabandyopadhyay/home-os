"use client"

import { create } from "zustand"
import type { Notification } from "@/types/notification"

type NotificationConnectionStatus = "connected" | "connecting" | "reconnecting" | "disconnected"

type NotificationState = {
  // State
  notifications: Notification[]
  unreadCount: number
  connectionStatus: NotificationConnectionStatus
  isPanelOpen: boolean
  quietHoursActive: boolean

  // Actions
  setNotifications: (notifications: Notification[]) => void
  prependNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  dismissNotification: (id: string) => void
  setUnreadCount: (count: number) => void
  incrementUnreadCount: () => void
  decrementUnreadCount: () => void
  setConnectionStatus: (status: NotificationConnectionStatus) => void
  setPanelOpen: (open: boolean) => void
  setQuietHoursActive: (active: boolean) => void
  appendNotifications: (notifications: Notification[]) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  connectionStatus: "disconnected",
  isPanelOpen: false,
  quietHoursActive: false,

  // Actions
  setNotifications: (notifications) => set({ notifications }),

  prependNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      if (!notification || notification.read) return state

      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),

  dismissNotification: (id) =>
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id)
      if (!notification) return state

      const wasUnread = !notification.read
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      }
    }),

  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnreadCount: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  decrementUnreadCount: () =>
    set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  setPanelOpen: (open) => set({ isPanelOpen: open }),

  setQuietHoursActive: (active) => set({ quietHoursActive: active }),

  appendNotifications: (notifications) =>
    set((state) => ({
      notifications: [...state.notifications, ...notifications],
    })),
}))
