import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileSidebar } from "@/components/layout/mobile-sidebar"

// Mock next/navigation
const mockPathname = vi.fn(() => "/dashboard")
vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
}))

describe("Sidebar", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/dashboard")
  })

  describe("Active state on route change", () => {
    it("marks the Dashboard link as active when pathname is /dashboard", () => {
      mockPathname.mockReturnValue("/dashboard")
      render(<Sidebar />)

      const activeLink = screen.getByRole("link", { name: /Today/i })
      expect(activeLink.getAttribute("aria-current")).toBe("page")
      expect(activeLink.className).toContain("bg-app-elevated")
      expect(activeLink.className).toContain("border-l-2")
      expect(activeLink.className).toContain("border-current")
    })

    it("marks the Notes link as active when pathname is /notes", () => {
      mockPathname.mockReturnValue("/notes")
      render(<Sidebar />)

      const activeLink = screen.getByRole("link", { name: /Notes/i })
      expect(activeLink.getAttribute("aria-current")).toBe("page")
      expect(activeLink.className).toContain("bg-app-elevated")
    })

    it("marks the Notes link as active for nested routes like /notes/123", () => {
      mockPathname.mockReturnValue("/notes/123")
      render(<Sidebar />)

      const activeLink = screen.getByRole("link", { name: /Notes/i })
      expect(activeLink.getAttribute("aria-current")).toBe("page")
      expect(activeLink.className).toContain("bg-app-elevated")
    })

    it("does not mark Dashboard as active for nested routes of other modules", () => {
      mockPathname.mockReturnValue("/notes/123")
      render(<Sidebar />)

      const dashboardLink = screen.getByRole("link", { name: /Today/i })
      expect(dashboardLink.getAttribute("aria-current")).toBeNull()
    })

    it("applies inactive styling to non-active links", () => {
      mockPathname.mockReturnValue("/dashboard")
      render(<Sidebar />)

      const inactiveLink = screen.getByRole("link", { name: /Notes/i })
      expect(inactiveLink.getAttribute("aria-current")).toBeNull()
      expect(inactiveLink.className).toContain("border-transparent")
      expect(inactiveLink.className).toContain("text-app-muted")
    })

    it("updates active state when route changes to /tasks", () => {
      mockPathname.mockReturnValue("/tasks")
      render(<Sidebar />)

      const tasksLink = screen.getByRole("link", { name: /Tasks/i })
      expect(tasksLink.getAttribute("aria-current")).toBe("page")
      expect(tasksLink.className).toContain("bg-app-elevated")

      // Other links should be inactive
      const dashboardLink = screen.getByRole("link", { name: /Today/i })
      expect(dashboardLink.getAttribute("aria-current")).toBeNull()
      expect(dashboardLink.className).toContain("border-transparent")
    })

    it("marks Settings as active on /settings route", () => {
      mockPathname.mockReturnValue("/settings")
      render(<Sidebar />)

      const settingsLink = screen.getByRole("link", { name: /Settings/i })
      expect(settingsLink.getAttribute("aria-current")).toBe("page")
      expect(settingsLink.className).toContain("bg-app-elevated")
    })
  })

  describe("Mobile overlay behavior", () => {
    it("renders the menu trigger button with md:hidden class", () => {
      render(<MobileSidebar />)

      const menuButton = screen.getByRole("button", { name: /open menu/i })
      expect(menuButton).toBeDefined()
      expect(menuButton.className).toContain("md:hidden")
    })

    it("renders the menu trigger with an accessible label", () => {
      render(<MobileSidebar />)

      const menuButton = screen.getByRole("button", { name: /open menu/i })
      expect(menuButton.getAttribute("aria-label")).toBe("Open menu")
    })

    it("opens the Sheet overlay when menu button is clicked", async () => {
      const user = userEvent.setup()
      render(<MobileSidebar />)

      const menuButton = screen.getByRole("button", { name: /open menu/i })
      await user.click(menuButton)

      // After clicking, the sidebar content should be visible in the sheet
      const nav = screen.getByRole("navigation", { name: /main navigation/i })
      expect(nav).toBeDefined()
    })

    it("renders the Sidebar component inside the Sheet when open", async () => {
      const user = userEvent.setup()
      render(<MobileSidebar />)

      const menuButton = screen.getByRole("button", { name: /open menu/i })
      await user.click(menuButton)

      // Verify sidebar navigation items are present
      expect(screen.getByRole("link", { name: /Today/i })).toBeDefined()
      expect(screen.getByRole("link", { name: /Notes/i })).toBeDefined()
      expect(screen.getByRole("link", { name: /Tasks/i })).toBeDefined()
    })

    it("uses a Sheet with side=left for the mobile overlay", async () => {
      const user = userEvent.setup()
      const { container } = render(<MobileSidebar />)

      const menuButton = screen.getByRole("button", { name: /open menu/i })
      await user.click(menuButton)

      const sheetContent = container.ownerDocument.querySelector(
        '[data-slot="sheet-content"]'
      )
      expect(sheetContent).not.toBeNull()
      expect(sheetContent!.getAttribute("data-side")).toBe("left")
    })
  })

  describe("Keyboard navigation", () => {
    it("renders navigation items as focusable links", () => {
      render(<Sidebar />)

      const links = screen.getAllByRole("link")
      // Should have nav items + footer links
      expect(links.length).toBeGreaterThanOrEqual(8)
    })

    it("allows tabbing through navigation items", async () => {
      const user = userEvent.setup()
      render(<Sidebar />)

      // Tab to the first nav link
      await user.tab()
      const firstLink = screen.getByRole("link", { name: /Today/i })
      expect(document.activeElement).toBe(firstLink)

      // Tab to the second nav link
      await user.tab()
      const secondLink = screen.getByRole("link", { name: /Notes/i })
      expect(document.activeElement).toBe(secondLink)

      // Tab to the third nav link
      await user.tab()
      const thirdLink = screen.getByRole("link", { name: /Tasks/i })
      expect(document.activeElement).toBe(thirdLink)
    })

    it("uses semantic nav element with aria-label", () => {
      render(<Sidebar />)

      const nav = screen.getByRole("navigation", { name: /main navigation/i })
      expect(nav).toBeDefined()
    })

    it("hides icons from assistive technology with aria-hidden", () => {
      const { container } = render(<Sidebar />)

      const nav = container.querySelector("nav")
      const svgs = nav!.querySelectorAll("svg")
      svgs.forEach((svg) => {
        expect(svg.getAttribute("aria-hidden")).toBe("true")
      })
    })
  })
})
