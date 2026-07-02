"use client"

import { useCallback } from "react"
import { useNotificationPreferences, useUpdatePreferences } from "@/hooks/queries/use-notifications"
import { usePushManager } from "@/hooks/use-push-manager"
import { NotificationPreferencesPanel } from "@/components/notifications/notification-preferences"
import type { NotificationPreferences } from "@/types/notification"

export function NotificationsSettingsSection() {
  const { data: preferences, isLoading } = useNotificationPreferences()
  const { permissionState, subscribe, unsubscribe } = usePushManager()
  const updatePreferences = useUpdatePreferences()

  const handleUpdate = useCallback(
    (updates: Partial<NotificationPreferences>) => {
      updatePreferences.mutate(updates)
    },
    [updatePreferences]
  )

  const handlePushToggle = useCallback(
    async (enabled: boolean) => {
      if (enabled) {
        await subscribe()
      } else {
        await unsubscribe()
      }
      updatePreferences.mutate({ pushEnabled: enabled })
    },
    [subscribe, unsubscribe, updatePreferences]
  )

  if (isLoading || !preferences) {
    return (
      <div className="card-app p-6 animate-pulse">
        <div className="h-6 w-32 rounded bg-app-elevated" />
        <div className="mt-4 space-y-3">
          <div className="h-4 w-full rounded bg-app-elevated" />
          <div className="h-4 w-3/4 rounded bg-app-elevated" />
          <div className="h-4 w-1/2 rounded bg-app-elevated" />
        </div>
      </div>
    )
  }

  return (
    <NotificationPreferencesPanel
      preferences={preferences}
      pushPermissionState={permissionState}
      onUpdate={handleUpdate}
      onPushToggle={handlePushToggle}
    />
  )
}
