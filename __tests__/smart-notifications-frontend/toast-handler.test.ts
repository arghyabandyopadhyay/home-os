import { describe, it, expect, vi, beforeEach } from "vitest"
import { showNotificationToast, truncateBody } from "@/lib/notifications/toast-handler"
import { toast } from "sonner"
import type { Notification } from "@/types/notification"

vi.mock("sonner", () => ({
  toast: vi.fn(),
}))

function createNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "notif-1",
    type: "task_due",
    title: "Task reminder",
    body: "Your task is due soon",
    read: false,
    dismissed: false,
    targetRoute: null,
    createdAt: new Date().toISOString(),
    metadata: {},
    ...overrides,
  }
}

describe("showNotificationToast", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("suppresses toast when quiet hours are active", () => {
    const notification = createNotification()
    const onNavigate = vi.fn()

    showNotificationToast(notification, { quietHoursActive: true, onNavigate })

    expect(toast).not.toHaveBeenCalled()
  })

  it("shows toast when quiet hours are not active", () => {
    const notification = createNotification()
    const onNavigate = vi.fn()

    showNotificationToast(notification, { quietHoursActive: false, onNavigate })

    expect(toast).toHaveBeenCalledWith("Task reminder", expect.objectContaining({
      description: "Your task is due soon",
      duration: 5000,
    }))
  })

  it("uses Infinity duration for system_alert type", () => {
    const notification = createNotification({ type: "system_alert", title: "System update" })
    const onNavigate = vi.fn()

    showNotificationToast(notification, { quietHoursActive: false, onNavigate })

    expect(toast).toHaveBeenCalledWith("System update", expect.objectContaining({
      duration: Infinity,
    }))
  })

  it("uses 5000ms duration for non-system_alert types", () => {
    const types = ["task_due", "calendar_reminder", "collaboration_mention"] as const
    const onNavigate = vi.fn()

    for (const type of types) {
      vi.clearAllMocks()
      const notification = createNotification({ type })
      showNotificationToast(notification, { quietHoursActive: false, onNavigate })
      expect(toast).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
        duration: 5000,
      }))
    }
  })

  it("includes action with onNavigate when targetRoute is present", () => {
    const notification = createNotification({ targetRoute: "/tasks" })
    const onNavigate = vi.fn()

    showNotificationToast(notification, { quietHoursActive: false, onNavigate })

    const callArgs = vi.mocked(toast).mock.calls[0][1] as { action?: { label: string; onClick: () => void } }
    expect(callArgs.action).toBeDefined()
    expect(callArgs.action!.label).toBe("View")

    callArgs.action!.onClick()
    expect(onNavigate).toHaveBeenCalledWith("/tasks")
  })

  it("does not include action when targetRoute is null", () => {
    const notification = createNotification({ targetRoute: null })
    const onNavigate = vi.fn()

    showNotificationToast(notification, { quietHoursActive: false, onNavigate })

    const callArgs = vi.mocked(toast).mock.calls[0][1] as { action?: unknown }
    expect(callArgs.action).toBeUndefined()
  })

  it("truncates body at 80 characters", () => {
    const longBody = "This is a very long notification body that exceeds eighty characters and should be truncated at a word boundary"
    const notification = createNotification({ body: longBody })
    const onNavigate = vi.fn()

    showNotificationToast(notification, { quietHoursActive: false, onNavigate })

    const callArgs = vi.mocked(toast).mock.calls[0][1] as { description: string }
    expect(callArgs.description.length).toBeLessThanOrEqual(81) // 80 chars + ellipsis character
    expect(callArgs.description.endsWith("…")).toBe(true)
  })
})

describe("truncateBody", () => {
  it("returns body unchanged when within maxLength", () => {
    expect(truncateBody("Hello world", 80)).toBe("Hello world")
  })

  it("returns body unchanged when exactly at maxLength", () => {
    const body = "a".repeat(80)
    expect(truncateBody(body, 80)).toBe(body)
  })

  it("truncates at word boundary with ellipsis", () => {
    const body = "The quick brown fox jumps over the lazy dog and continues running far beyond the field"
    const result = truncateBody(body, 80)
    expect(result.endsWith("…")).toBe(true)
    // The content before the ellipsis should not exceed 80 chars
    expect(result.length).toBeLessThanOrEqual(81) // content + "…" (1 char)
  })

  it("truncates at last space before maxLength", () => {
    // "Hello world foo" - truncate at 12 should give "Hello world…"
    const result = truncateBody("Hello world foo", 12)
    expect(result).toBe("Hello world…")
  })

  it("truncates without word boundary if no space exists", () => {
    const body = "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdef"
    const result = truncateBody(body, 80)
    expect(result).toBe(body.slice(0, 80) + "…")
  })

  it("uses ellipsis character (…) not three dots (...)", () => {
    const body = "This is a somewhat long text that will need to be truncated at the word boundary to fit"
    const result = truncateBody(body, 80)
    expect(result).toContain("…")
    expect(result).not.toContain("...")
  })
})
