"use client"

import { useCallback } from "react"
import { Bell, BellOff, Clock, Smartphone } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { useUpdatePreferences } from "@/hooks/queries/use-notifications"
import { usePushManager } from "@/hooks/use-push-manager"
import type { NotificationPreferences } from "@/types/notification"
import type { PushPermissionState } from "@/hooks/use-push-manager"

type NotificationPreferencesPanelProps = {
  preferences: NotificationPreferences
  pushPermissionState: PushPermissionState
  onUpdate: (updates: Partial<NotificationPreferences>) => void
  onPushToggle: (enabled: boolean) => void
}

const NOTIFICATION_TYPE_CONFIG = [
  {
    key: "taskDue" as const,
    label: "Task Due Reminders",
    description: "Get notified when tasks are approaching their due date",
  },
  {
    key: "calendarReminder" as const,
    label: "Calendar Reminders",
    description: "Get notified about upcoming calendar events",
  },
  {
    key: "collaborationMention" as const,
    label: "Mentions",
    description: "Get notified when someone mentions you",
  },
  {
    key: "systemAlert" as const,
    label: "System Alerts",
    description: "Important system notifications and announcements",
  },
] as const

function getPermissionStatusText(state: PushPermissionState): string {
  switch (state) {
    case "granted":
      return "Permission granted"
    case "denied":
      return "Permission denied by browser"
    case "default":
      return "Permission not yet requested"
    case "unsupported":
      return "Push notifications not supported in this browser"
  }
}

function getPermissionStatusColor(state: PushPermissionState): string {
  switch (state) {
    case "granted":
      return "text-green-500"
    case "denied":
      return "text-red-400"
    case "default":
      return "text-app-muted"
    case "unsupported":
      return "text-app-muted"
  }
}

export function NotificationPreferencesPanel({
  preferences,
  pushPermissionState,
  onUpdate,
  onPushToggle,
}: NotificationPreferencesPanelProps) {
  const updatePreferences = useUpdatePreferences()
  const { permissionState } = usePushManager()

  const effectivePermissionState = pushPermissionState ?? permissionState

  const handleTypeToggle = useCallback(
    (key: keyof Pick<NotificationPreferences, "taskDue" | "calendarReminder" | "collaborationMention" | "systemAlert">, checked: boolean) => {
      const updates = { [key]: checked }
      onUpdate(updates)
      updatePreferences.mutate(updates)
    },
    [onUpdate, updatePreferences]
  )

  const handleQuietHoursToggle = useCallback(
    (checked: boolean) => {
      const updates: Partial<NotificationPreferences> = { quietHoursEnabled: checked }
      if (checked && !preferences.quietHoursStart) {
        updates.quietHoursStart = "22:00"
        updates.quietHoursEnd = "07:00"
      }
      onUpdate(updates)
      updatePreferences.mutate(updates)
    },
    [onUpdate, updatePreferences, preferences.quietHoursStart]
  )

  const handleQuietHoursTimeChange = useCallback(
    (field: "quietHoursStart" | "quietHoursEnd", value: string) => {
      const updates = { [field]: value }
      onUpdate(updates)
      updatePreferences.mutate(updates)
    },
    [onUpdate, updatePreferences]
  )

  const handlePushToggle = useCallback(
    (checked: boolean) => {
      onPushToggle(checked)
    },
    [onPushToggle]
  )

  const isPushDisabled = effectivePermissionState === "denied" || effectivePermissionState === "unsupported"

  return (
    <div className="card-app p-6">
      <div className="mb-8 flex items-center gap-4">
        <div className="rounded-xl bg-amber-500/10 p-3">
          <Bell className="h-5 w-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-2xl font-semibold text-app">Notifications</h2>
          <p className="text-sm text-app-muted">
            Control which notifications you receive and when.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Per-type notification toggles */}
        <div className="space-y-4">
          {NOTIFICATION_TYPE_CONFIG.map((config) => (
            <div
              key={config.key}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex-1">
                <label className="text-sm font-medium text-app">
                  {config.label}
                </label>
                <p className="text-xs text-app-muted">{config.description}</p>
              </div>
              <Switch
                checked={preferences[config.key]}
                onCheckedChange={(checked) =>
                  handleTypeToggle(config.key, checked as boolean)
                }
                aria-label={config.label}
              />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-app" />

        {/* Quiet Hours section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-app-muted" />
              <div>
                <label className="text-sm font-medium text-app">
                  Quiet Hours
                </label>
                <p className="text-xs text-app-muted">
                  Suppress notifications during specified time window
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.quietHoursEnabled}
              onCheckedChange={(checked) =>
                handleQuietHoursToggle(checked as boolean)
              }
              aria-label="Quiet Hours"
            />
          </div>

          {preferences.quietHoursEnabled && (
            <div className="ml-7 flex items-center gap-3">
              <div>
                <label className="mb-1 block text-xs text-app-muted">
                  Start
                </label>
                <input
                  type="time"
                  value={preferences.quietHoursStart ?? "22:00"}
                  onChange={(e) =>
                    handleQuietHoursTimeChange("quietHoursStart", e.target.value)
                  }
                  className="input-app rounded-lg px-3 py-1.5 text-sm"
                  aria-label="Quiet hours start time"
                />
              </div>
              <span className="mt-4 text-app-muted">–</span>
              <div>
                <label className="mb-1 block text-xs text-app-muted">
                  End
                </label>
                <input
                  type="time"
                  value={preferences.quietHoursEnd ?? "07:00"}
                  onChange={(e) =>
                    handleQuietHoursTimeChange("quietHoursEnd", e.target.value)
                  }
                  className="input-app rounded-lg px-3 py-1.5 text-sm"
                  aria-label="Quiet hours end time"
                />
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-app" />

        {/* Push Notifications section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-4 w-4 text-app-muted" />
              <div>
                <label className="text-sm font-medium text-app">
                  Push Notifications
                </label>
                <p className="text-xs text-app-muted">
                  Receive browser notifications when the app is not focused
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.pushEnabled}
              onCheckedChange={(checked) =>
                handlePushToggle(checked as boolean)
              }
              disabled={isPushDisabled}
              aria-label="Push Notifications"
            />
          </div>

          {/* Permission state indicator */}
          <div className="ml-7 flex items-center gap-2">
            {effectivePermissionState === "granted" ? (
              <Bell className="h-3 w-3 text-green-500" />
            ) : (
              <BellOff className="h-3 w-3 text-app-muted" />
            )}
            <span
              className={`text-xs ${getPermissionStatusColor(effectivePermissionState)}`}
            >
              {getPermissionStatusText(effectivePermissionState)}
            </span>
          </div>

          {/* Helper text for denied/unsupported */}
          {effectivePermissionState === "denied" && (
            <p className="ml-7 text-xs text-app-muted">
              Push notifications have been blocked. Please update your browser
              settings to allow notifications from this site.
            </p>
          )}
          {effectivePermissionState === "unsupported" && (
            <p className="ml-7 text-xs text-app-muted">
              Your browser does not support push notifications. Try using a
              modern browser like Chrome, Firefox, or Edge.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
