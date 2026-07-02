import { render, screen, fireEvent } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { NotificationItem, formatRelativeTime } from "@/components/notifications/notification-item"
import type { Notification } from "@/types/notification"

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "n1",
    type: "task_due",
    title: "Your task is due",
    body: "The task 'Finish report' is due tomorrow. Please review and complete it before the deadline.",
    read: false,
    dismissed: false,
    targetRoute: "/tasks",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
    metadata: {},
    ...overrides,
  }
}

describe("NotificationItem", () => {
  const defaultProps = {
    onMarkAsRead: vi.fn(),
    onMarkAsUnread: vi.fn(),
    onDismiss: vi.fn(),
    onNavigate: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the notification title and truncated body", () => {
    render(<NotificationItem notification={makeNotification()} {...defaultProps} />)
    expect(screen.getByText("Your task is due")).toBeDefined()
    // Body should be truncated (original is >80 chars)
    const bodyElement = screen.getByText(/The task 'Finish report'/i)
    expect(bodyElement).toBeDefined()
  })

  it("renders the correct type icon (aria-hidden)", () => {
    const { container } = render(
      <NotificationItem notification={makeNotification({ type: "calendar_reminder" })} {...defaultProps} />
    )
    const icon = container.querySelector('[aria-hidden="true"]')
    expect(icon).not.toBeNull()
  })

  it("shows unread indicator styling when notification is unread", () => {
    const { container } = render(
      <NotificationItem notification={makeNotification({ read: false })} {...defaultProps} />
    )
    const item = container.firstElementChild
    expect(item?.className).toContain("border-l-2")
    expect(item?.className).toContain("border-l-blue-400/60")
  })

  it("shows muted styling when notification is read", () => {
    const { container } = render(
      <NotificationItem notification={makeNotification({ read: true })} {...defaultProps} />
    )
    const item = container.firstElementChild
    expect(item?.className).toContain("text-app-muted")
    expect(item?.className).toContain("opacity-75")
  })

  it("has descriptive aria-label with type, title, and read status (unread)", () => {
    render(<NotificationItem notification={makeNotification({ read: false })} {...defaultProps} />)
    const article = screen.getByRole("article")
    expect(article.getAttribute("aria-label")).toBe("Task due: Your task is due. Unread")
  })

  it("has aria-label reflecting read status for read notifications", () => {
    render(<NotificationItem notification={makeNotification({ read: true })} {...defaultProps} />)
    const article = screen.getByRole("article")
    expect(article.getAttribute("aria-label")).toBe("Task due: Your task is due. Read")
  })

  it("calls onNavigate when body is clicked", () => {
    render(<NotificationItem notification={makeNotification()} {...defaultProps} />)
    const navButton = screen.getByRole("button", { name: /navigate to task due/i })
    fireEvent.click(navButton)
    expect(defaultProps.onNavigate).toHaveBeenCalledTimes(1)
  })

  it("shows 'Mark as read' button for unread notifications", () => {
    render(<NotificationItem notification={makeNotification({ read: false })} {...defaultProps} />)
    expect(screen.getByLabelText("Mark as read")).toBeDefined()
    expect(screen.queryByLabelText("Mark as unread")).toBeNull()
  })

  it("shows 'Mark as unread' button for read notifications", () => {
    render(<NotificationItem notification={makeNotification({ read: true })} {...defaultProps} />)
    expect(screen.getByLabelText("Mark as unread")).toBeDefined()
    expect(screen.queryByLabelText("Mark as read")).toBeNull()
  })

  it("calls onMarkAsRead when the mark read button is clicked", () => {
    render(<NotificationItem notification={makeNotification({ read: false })} {...defaultProps} />)
    fireEvent.click(screen.getByLabelText("Mark as read"))
    expect(defaultProps.onMarkAsRead).toHaveBeenCalledTimes(1)
  })

  it("calls onMarkAsUnread when the mark unread button is clicked", () => {
    render(<NotificationItem notification={makeNotification({ read: true })} {...defaultProps} />)
    fireEvent.click(screen.getByLabelText("Mark as unread"))
    expect(defaultProps.onMarkAsUnread).toHaveBeenCalledTimes(1)
  })

  it("calls onDismiss when the dismiss button is clicked", () => {
    render(<NotificationItem notification={makeNotification()} {...defaultProps} />)
    fireEvent.click(screen.getByLabelText("Dismiss notification"))
    expect(defaultProps.onDismiss).toHaveBeenCalledTimes(1)
  })

  it("uses item-app class", () => {
    const { container } = render(
      <NotificationItem notification={makeNotification()} {...defaultProps} />
    )
    expect(container.firstElementChild?.className).toContain("item-app")
  })

  it("renders relative timestamp", () => {
    render(<NotificationItem notification={makeNotification()} {...defaultProps} />)
    expect(screen.getByText("5m ago")).toBeDefined()
  })

  it("renders different aria-labels for different notification types", () => {
    render(
      <NotificationItem
        notification={makeNotification({ type: "collaboration_mention", title: "You were mentioned" })}
        {...defaultProps}
      />
    )
    const article = screen.getByRole("article")
    expect(article.getAttribute("aria-label")).toBe("Mention: You were mentioned. Unread")
  })
})

describe("formatRelativeTime", () => {
  it("returns 'Just now' for timestamps less than 60 seconds ago", () => {
    const now = new Date().toISOString()
    expect(formatRelativeTime(now)).toBe("Just now")
  })

  it("returns minutes ago for timestamps less than 60 minutes", () => {
    const date = new Date(Date.now() - 15 * 60 * 1000).toISOString()
    expect(formatRelativeTime(date)).toBe("15m ago")
  })

  it("returns hours ago for timestamps less than 24 hours", () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(date)).toBe("3h ago")
  })

  it("returns 'Yesterday' for timestamps 24-48 hours ago", () => {
    const date = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(date)).toBe("Yesterday")
  })

  it("returns days ago for timestamps less than 7 days", () => {
    const date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(date)).toBe("5d ago")
  })

  it("returns formatted date for timestamps older than 7 days", () => {
    const date = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const result = formatRelativeTime(date)
    // Should be a date string like "Dec 1" or "Jan 5"
    expect(result).not.toContain("ago")
    expect(result).not.toBe("Yesterday")
  })
})
