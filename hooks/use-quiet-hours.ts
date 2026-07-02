import { useCallback, useEffect, useState } from "react"

import { isWithinQuietHours } from "@/lib/notifications/quiet-hours"
import type { NotificationPreferences } from "@/types/notification"

/**
 * Hook that checks if quiet hours are currently active based on notification preferences.
 *
 * Rechecks every 60 seconds via setInterval to handle transitions in/out of
 * the quiet hours window without requiring a page refresh.
 *
 * Returns `{ isActive: false }` when:
 * - preferences is undefined (not yet loaded)
 * - quietHoursEnabled is false
 * - quietHoursStart or quietHoursEnd is null
 *
 * Handles overnight ranges (e.g., 22:00–07:00 crossing midnight).
 */
export function useQuietHours(preferences: NotificationPreferences | undefined): {
  isActive: boolean
} {
  const computeIsActive = useCallback((): boolean => {
    if (!preferences) return false
    if (!preferences.quietHoursEnabled) return false
    if (preferences.quietHoursStart === null || preferences.quietHoursEnd === null) return false

    return isWithinQuietHours(preferences.quietHoursStart, preferences.quietHoursEnd)
  }, [preferences])

  const [isActive, setIsActive] = useState<boolean>(computeIsActive)

  useEffect(() => {
    setIsActive(computeIsActive())

    const interval = setInterval(() => {
      setIsActive(computeIsActive())
    }, 60_000)

    return () => clearInterval(interval)
  }, [computeIsActive])

  return { isActive }
}
