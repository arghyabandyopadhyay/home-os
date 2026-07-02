export type NotificationType = "task_due" | "calendar_reminder" | "collaboration_mention" | "system_alert"

export type Notification = {
  id: string
  type: NotificationType
  title: string
  body: string
  read: boolean
  dismissed: boolean
  targetRoute: string | null
  createdAt: string
  metadata: Record<string, unknown>
}

export type NotificationPage = {
  notifications: Notification[]
  totalCount: number
  page: number
  pageSize: number
  hasNextPage: boolean
}

export type UnreadCountResponse = {
  count: number
}

export type NotificationPreferences = {
  taskDue: boolean
  calendarReminder: boolean
  collaborationMention: boolean
  systemAlert: boolean
  quietHoursEnabled: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
  pushEnabled: boolean
}

export type PushSubscriptionPayload = {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export type NotificationHubEvent = {
  notification: Notification
}
