import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { NotificationBell } from "@/components/notifications/notification-bell"

describe("NotificationBell", () => {
  describe("aria-label", () => {
    it("shows 'Notifications' when unread count is 0", () => {
      render(<NotificationBell unreadCount={0} isOpen={false} onToggle={() => {}} />)
      const button = screen.getByRole("button")
      expect(button.getAttribute("aria-label")).toBe("Notifications")
    })

    it("shows unread count in aria-label when count > 0", () => {
      render(<NotificationBell unreadCount={5} isOpen={false} onToggle={() => {}} />)
      const button = screen.getByRole("button")
      expect(button.getAttribute("aria-label")).toBe("Notifications, 5 unread")
    })

    it("shows exact count in aria-label when count is 100", () => {
      render(<NotificationBell unreadCount={100} isOpen={false} onToggle={() => {}} />)
      const button = screen.getByRole("button")
      expect(button.getAttribute("aria-label")).toBe("Notifications, 100 unread")
    })
  })

  describe("aria-expanded", () => {
    it("sets aria-expanded to false when panel is closed", () => {
      render(<NotificationBell unreadCount={0} isOpen={false} onToggle={() => {}} />)
      const button = screen.getByRole("button")
      expect(button.getAttribute("aria-expanded")).toBe("false")
    })

    it("sets aria-expanded to true when panel is open", () => {
      render(<NotificationBell unreadCount={0} isOpen={true} onToggle={() => {}} />)
      const button = screen.getByRole("button")
      expect(button.getAttribute("aria-expanded")).toBe("true")
    })
  })

  describe("badge", () => {
    it("hides badge when unread count is 0", () => {
      const { container } = render(
        <NotificationBell unreadCount={0} isOpen={false} onToggle={() => {}} />
      )
      const badge = container.querySelector("span")
      expect(badge).toBeNull()
    })

    it("shows badge with count when unread count > 0", () => {
      const { container } = render(
        <NotificationBell unreadCount={7} isOpen={false} onToggle={() => {}} />
      )
      const badge = container.querySelector("span")
      expect(badge).not.toBeNull()
      expect(badge!.textContent).toBe("7")
    })

    it("shows '99+' when unread count exceeds 99", () => {
      const { container } = render(
        <NotificationBell unreadCount={150} isOpen={false} onToggle={() => {}} />
      )
      const badge = container.querySelector("span")
      expect(badge).not.toBeNull()
      expect(badge!.textContent).toBe("99+")
    })

    it("shows exact count at boundary (99)", () => {
      const { container } = render(
        <NotificationBell unreadCount={99} isOpen={false} onToggle={() => {}} />
      )
      const badge = container.querySelector("span")
      expect(badge).not.toBeNull()
      expect(badge!.textContent).toBe("99")
    })

    it("shows '99+' at count 100", () => {
      const { container } = render(
        <NotificationBell unreadCount={100} isOpen={false} onToggle={() => {}} />
      )
      const badge = container.querySelector("span")
      expect(badge).not.toBeNull()
      expect(badge!.textContent).toBe("99+")
    })

    it("applies correct styling classes to badge", () => {
      const { container } = render(
        <NotificationBell unreadCount={3} isOpen={false} onToggle={() => {}} />
      )
      const badge = container.querySelector("span")
      expect(badge!.className).toContain("text-xs")
      expect(badge!.className).toContain("rounded-full")
      expect(badge!.className).toContain("bg-app-elevated")
      expect(badge!.className).toContain("text-app")
    })
  })

  describe("onToggle", () => {
    it("calls onToggle when button is clicked", () => {
      const onToggle = vi.fn()
      render(<NotificationBell unreadCount={0} isOpen={false} onToggle={onToggle} />)
      const button = screen.getByRole("button")
      fireEvent.click(button)
      expect(onToggle).toHaveBeenCalledTimes(1)
    })
  })
})
