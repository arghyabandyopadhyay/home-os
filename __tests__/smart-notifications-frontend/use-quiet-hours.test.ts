import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useQuietHours } from "@/hooks/use-quiet-hours"
import type { NotificationPreferences } from "@/types/notification"

/**
 * Unit tests for the useQuietHours hook.
 *
 * Tests that:
 * - Returns false when preferences are undefined
 * - Returns false when quiet hours are disabled
 * - Returns false when start or end is null
 * - Returns true when current time is within the quiet hours window
 * - Returns false when current time is outside the quiet hours window
 * - Handles overnight ranges (e.g., 22:00–07:00)
 * - Rechecks every 60 seconds via setInterval
 * - Cleans up interval on unmount
 */

function makePreferences(overrides: Partial<NotificationPreferences> = {}): NotificationPreferences {
  return {
    taskDue: true,
    calendarReminder: true,
    collaborationMention: true,
    systemAlert: true,
    quietHoursEnabled: true,
    quietHoursStart: "22:00",
    quietHoursEnd: "07:00",
    pushEnabled: false,
    ...overrides,
  }
}

describe("useQuietHours hook", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns false when preferences are undefined", () => {
    const { result } = renderHook(() => useQuietHours(undefined))
    expect(result.current.isActive).toBe(false)
  })

  it("returns false when quiet hours are disabled", () => {
    const prefs = makePreferences({ quietHoursEnabled: false })
    const { result } = renderHook(() => useQuietHours(prefs))
    expect(result.current.isActive).toBe(false)
  })

  it("returns false when quietHoursStart is null", () => {
    const prefs = makePreferences({ quietHoursStart: null })
    const { result } = renderHook(() => useQuietHours(prefs))
    expect(result.current.isActive).toBe(false)
  })

  it("returns false when quietHoursEnd is null", () => {
    const prefs = makePreferences({ quietHoursEnd: null })
    const { result } = renderHook(() => useQuietHours(prefs))
    expect(result.current.isActive).toBe(false)
  })

  it("returns true when current time is within quiet hours (overnight range)", () => {
    // Set time to 23:30 — within 22:00–07:00
    vi.setSystemTime(new Date(2024, 5, 15, 23, 30, 0))

    const prefs = makePreferences({ quietHoursStart: "22:00", quietHoursEnd: "07:00" })
    const { result } = renderHook(() => useQuietHours(prefs))
    expect(result.current.isActive).toBe(true)
  })

  it("returns true when current time is within quiet hours (early morning, overnight range)", () => {
    // Set time to 05:00 — within 22:00–07:00
    vi.setSystemTime(new Date(2024, 5, 15, 5, 0, 0))

    const prefs = makePreferences({ quietHoursStart: "22:00", quietHoursEnd: "07:00" })
    const { result } = renderHook(() => useQuietHours(prefs))
    expect(result.current.isActive).toBe(true)
  })

  it("returns false when current time is outside quiet hours (overnight range)", () => {
    // Set time to 12:00 — outside 22:00–07:00
    vi.setSystemTime(new Date(2024, 5, 15, 12, 0, 0))

    const prefs = makePreferences({ quietHoursStart: "22:00", quietHoursEnd: "07:00" })
    const { result } = renderHook(() => useQuietHours(prefs))
    expect(result.current.isActive).toBe(false)
  })

  it("returns true when current time is within same-day quiet hours", () => {
    // Set time to 14:00 — within 09:00–17:00
    vi.setSystemTime(new Date(2024, 5, 15, 14, 0, 0))

    const prefs = makePreferences({ quietHoursStart: "09:00", quietHoursEnd: "17:00" })
    const { result } = renderHook(() => useQuietHours(prefs))
    expect(result.current.isActive).toBe(true)
  })

  it("returns false when current time is outside same-day quiet hours", () => {
    // Set time to 20:00 — outside 09:00–17:00
    vi.setSystemTime(new Date(2024, 5, 15, 20, 0, 0))

    const prefs = makePreferences({ quietHoursStart: "09:00", quietHoursEnd: "17:00" })
    const { result } = renderHook(() => useQuietHours(prefs))
    expect(result.current.isActive).toBe(false)
  })

  it("rechecks every 60 seconds and updates when entering quiet hours", () => {
    // Start at 21:59 — outside 22:00–07:00
    vi.setSystemTime(new Date(2024, 5, 15, 21, 59, 0))

    const prefs = makePreferences({ quietHoursStart: "22:00", quietHoursEnd: "07:00" })
    const { result } = renderHook(() => useQuietHours(prefs))
    expect(result.current.isActive).toBe(false)

    // Advance to 22:00 — now within quiet hours
    vi.setSystemTime(new Date(2024, 5, 15, 22, 0, 0))
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(result.current.isActive).toBe(true)
  })

  it("rechecks every 60 seconds and updates when leaving quiet hours", () => {
    // Start at 06:59 — within 22:00–07:00
    vi.setSystemTime(new Date(2024, 5, 15, 6, 59, 0))

    const prefs = makePreferences({ quietHoursStart: "22:00", quietHoursEnd: "07:00" })
    const { result } = renderHook(() => useQuietHours(prefs))
    expect(result.current.isActive).toBe(true)

    // Advance to 07:00 — now outside quiet hours
    vi.setSystemTime(new Date(2024, 5, 15, 7, 0, 0))
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    expect(result.current.isActive).toBe(false)
  })

  it("cleans up interval on unmount", () => {
    const clearIntervalSpy = vi.spyOn(global, "clearInterval")

    vi.setSystemTime(new Date(2024, 5, 15, 23, 0, 0))
    const prefs = makePreferences()
    const { unmount } = renderHook(() => useQuietHours(prefs))

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })

  it("updates when preferences change", () => {
    vi.setSystemTime(new Date(2024, 5, 15, 23, 0, 0))

    const { result, rerender } = renderHook(
      ({ prefs }) => useQuietHours(prefs),
      { initialProps: { prefs: makePreferences({ quietHoursEnabled: false }) } }
    )

    expect(result.current.isActive).toBe(false)

    rerender({ prefs: makePreferences({ quietHoursEnabled: true }) })

    expect(result.current.isActive).toBe(true)
  })
})
