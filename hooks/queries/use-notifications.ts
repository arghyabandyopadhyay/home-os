import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"
import { toast } from "sonner"
import type {
  Notification,
  NotificationPage,
  UnreadCountResponse,
  NotificationPreferences,
  PushSubscriptionPayload,
} from "@/types/notification"

const api = createClientApiClient()

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (pageSize: number) => ["notifications", "list", { pageSize }] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
  preferences: () => ["notifications", "preferences"] as const,
}

// Paginated notification history
export function useNotifications(pageSize = 20) {
  return useInfiniteQuery({
    queryKey: notificationKeys.all,
    queryFn: ({ pageParam = 1, signal }) =>
      api.get<NotificationPage>("/notifications", {
        params: { page: pageParam, pageSize },
        signal,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
    staleTime: 30_000,
  })
}

// Unread count for badge
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: ({ signal }) =>
      api.get<UnreadCountResponse>("/notifications/unread-count", { signal }),
    staleTime: 60_000,
    refetchInterval: 120_000,
  })
}

// User notification preferences
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: ({ signal }) =>
      api.get<NotificationPreferences>("/notifications/preferences", { signal }),
    staleTime: 300_000,
  })
}

// Mark a single notification as read
export function useMarkAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.patch<Notification>(`/notifications/${id}`, { body: { read: true } }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all })
      await queryClient.cancelQueries({ queryKey: notificationKeys.unreadCount() })

      const previousNotifications = queryClient.getQueryData(notificationKeys.all)
      const previousUnreadCount = queryClient.getQueryData<UnreadCountResponse>(
        notificationKeys.unreadCount()
      )

      // Optimistically update notification list
      queryClient.setQueryData(notificationKeys.all, (old: unknown) => {
        if (!old) return old
        const data = old as { pages: NotificationPage[]; pageParams: number[] }
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
          })),
        }
      })

      // Optimistically decrement unread count
      if (previousUnreadCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), {
          count: Math.max(0, previousUnreadCount.count - 1),
        })
      }

      return { previousNotifications, previousUnreadCount }
    },
    onError: (_err, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationKeys.all, context.previousNotifications)
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousUnreadCount)
      }
      toast.error("Failed to mark notification as read")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
    },
  })
}

// Mark a single notification as unread
export function useMarkAsUnread() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      api.patch<Notification>(`/notifications/${id}`, { body: { read: false } }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all })
      await queryClient.cancelQueries({ queryKey: notificationKeys.unreadCount() })

      const previousNotifications = queryClient.getQueryData(notificationKeys.all)
      const previousUnreadCount = queryClient.getQueryData<UnreadCountResponse>(
        notificationKeys.unreadCount()
      )

      // Optimistically update notification list
      queryClient.setQueryData(notificationKeys.all, (old: unknown) => {
        if (!old) return old
        const data = old as { pages: NotificationPage[]; pageParams: number[] }
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((n) =>
              n.id === id ? { ...n, read: false } : n
            ),
          })),
        }
      })

      // Optimistically increment unread count
      if (previousUnreadCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), {
          count: previousUnreadCount.count + 1,
        })
      }

      return { previousNotifications, previousUnreadCount }
    },
    onError: (_err, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationKeys.all, context.previousNotifications)
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousUnreadCount)
      }
      toast.error("Failed to mark notification as unread")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
    },
  })
}

// Mark all notifications as read
export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      api.post<{ count: number }>("/notifications/mark-all-read"),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all })
      await queryClient.cancelQueries({ queryKey: notificationKeys.unreadCount() })

      const previousNotifications = queryClient.getQueryData(notificationKeys.all)
      const previousUnreadCount = queryClient.getQueryData<UnreadCountResponse>(
        notificationKeys.unreadCount()
      )

      // Optimistically mark all as read
      queryClient.setQueryData(notificationKeys.all, (old: unknown) => {
        if (!old) return old
        const data = old as { pages: NotificationPage[]; pageParams: number[] }
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            notifications: page.notifications.map((n) => ({ ...n, read: true })),
          })),
        }
      })

      // Optimistically reset unread count
      queryClient.setQueryData(notificationKeys.unreadCount(), { count: 0 })

      return { previousNotifications, previousUnreadCount }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationKeys.all, context.previousNotifications)
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousUnreadCount)
      }
      toast.error("Failed to mark all notifications as read")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
    },
  })
}

// Dismiss (delete) a notification
export function useDismissNotification() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(`/notifications/${id}`),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.all })
      await queryClient.cancelQueries({ queryKey: notificationKeys.unreadCount() })

      const previousNotifications = queryClient.getQueryData(notificationKeys.all)
      const previousUnreadCount = queryClient.getQueryData<UnreadCountResponse>(
        notificationKeys.unreadCount()
      )

      // Find if the notification was unread before removing
      let wasUnread = false
      queryClient.setQueryData(notificationKeys.all, (old: unknown) => {
        if (!old) return old
        const data = old as { pages: NotificationPage[]; pageParams: number[] }
        return {
          ...data,
          pages: data.pages.map((page) => {
            const target = page.notifications.find((n) => n.id === id)
            if (target && !target.read) wasUnread = true
            return {
              ...page,
              notifications: page.notifications.filter((n) => n.id !== id),
            }
          }),
        }
      })

      // Decrement unread count if the dismissed notification was unread
      if (wasUnread && previousUnreadCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), {
          count: Math.max(0, previousUnreadCount.count - 1),
        })
      }

      return { previousNotifications, previousUnreadCount }
    },
    onError: (_err, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(notificationKeys.all, context.previousNotifications)
      }
      if (context?.previousUnreadCount) {
        queryClient.setQueryData(notificationKeys.unreadCount(), context.previousUnreadCount)
      }
      toast.error("Failed to dismiss notification")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all })
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() })
    },
  })
}

// Update notification preferences
export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Partial<NotificationPreferences>) =>
      api.patch<NotificationPreferences>("/notifications/preferences", {
        body: updates,
      }),
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: notificationKeys.preferences() })

      const previousPreferences = queryClient.getQueryData<NotificationPreferences>(
        notificationKeys.preferences()
      )

      // Optimistically merge updates into preferences
      if (previousPreferences) {
        queryClient.setQueryData(notificationKeys.preferences(), {
          ...previousPreferences,
          ...updates,
        })
      }

      return { previousPreferences }
    },
    onSuccess: () => {
      toast("Preferences saved")
    },
    onError: (_err, _updates, context) => {
      if (context?.previousPreferences) {
        queryClient.setQueryData(
          notificationKeys.preferences(),
          context.previousPreferences
        )
      }
      toast.error("Failed to save preferences")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() })
    },
  })
}

// Register push subscription
export function usePushSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: PushSubscriptionPayload) =>
      api.post<void>("/notifications/push-subscription", { body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() })
    },
    onError: () => {
      toast.error("Could not enable push notifications")
    },
  })
}

// Remove push subscription
export function useRemovePushSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => api.delete<void>("/notifications/push-subscription"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.preferences() })
    },
    onError: () => {
      toast.error("Could not disable push notifications")
    },
  })
}
