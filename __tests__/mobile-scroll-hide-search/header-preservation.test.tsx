import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"

/**
 * Unit tests verifying the Header component preserves its core structure
 * and child components after the scroll-hide feature was added.
 * The Header now has scroll-hide behavior on mobile (via useScrollDirection),
 * but must still render all child components and maintain proper positioning.
 *
 * Validates: Requirements 5.1, 5.2, 5.3
 */

// Mock hooks used by Header
vi.mock("@/hooks/use-is-mobile", () => ({
  useIsMobile: () => false, // Default to desktop mode
}))

vi.mock("@/hooks/use-reduced-motion", () => ({
  useReducedMotion: () => false,
}))

vi.mock("@/hooks/use-low-performance", () => ({
  useLowPerformance: () => false,
}))

vi.mock("@/hooks/use-scroll-direction", () => ({
  useScrollDirection: () => null,
}))

// Mock framer-motion to render a plain header element
vi.mock("framer-motion", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  return {
    motion: {
      header: React.forwardRef(
        (
          {
            animate,
            transition,
            ...props
          }: React.HTMLAttributes<HTMLElement> & {
            animate?: unknown
            transition?: unknown
          },
          ref: React.Ref<HTMLElement>
        ) => React.createElement("header", { ...props, ref })
      ),
    },
  }
})

// Mock child components to isolate Header rendering
vi.mock("@/components/layout/mobile-sidebar", () => ({
  MobileSidebar: () => <button aria-label="Open menu">Menu</button>,
}))

vi.mock("@/components/layout/user-menu", () => ({
  UserMenu: () => <button aria-label="User menu">U</button>,
}))

vi.mock("@/components/layout/search-trigger", () => ({
  SearchTrigger: () => <button aria-label="Search">Search</button>,
}))

describe("Header Preservation (core structure maintained with scroll-hide)", () => {
  async function renderHeader() {
    const { Header } = await import("@/components/layout/header")
    return render(<Header />)
  }

  it("renders with md:sticky positioning class for desktop", async () => {
    const { container } = await renderHeader()

    const header = container.querySelector("header")
    expect(header).not.toBeNull()
    expect(header!.className).toContain("md:sticky")
  })

  it("renders with fixed positioning class for mobile", async () => {
    const { container } = await renderHeader()

    const header = container.querySelector("header")
    expect(header!.className).toContain("fixed")
  })

  it("renders with top-0 class to pin at viewport top", async () => {
    const { container } = await renderHeader()

    const header = container.querySelector("header")
    expect(header!.className).toContain("top-0")
  })

  it("renders with z-40 class for proper stacking context", async () => {
    const { container } = await renderHeader()

    const header = container.querySelector("header")
    expect(header!.className).toContain("z-40")
  })

  it("renders interactive child components (MobileSidebar, SearchTrigger, UserMenu)", async () => {
    await renderHeader()

    // All interactive children should be present and accessible
    expect(screen.getByRole("button", { name: "Open menu" })).toBeDefined()
    expect(screen.getByRole("button", { name: "Search" })).toBeDefined()
    expect(screen.getByRole("button", { name: "User menu" })).toBeDefined()
  })

  it("uses semantic <header> element", async () => {
    const { container } = await renderHeader()

    const header = container.querySelector("header")
    expect(header).not.toBeNull()
    expect(header!.tagName).toBe("HEADER")
  })

  it("has pointer-events auto when in desktop mode (visible state)", async () => {
    const { container } = await renderHeader()

    const header = container.querySelector("header")
    const style = header!.getAttribute("style") || ""

    // In desktop mode (isMobile=false), pointer-events should be auto
    expect(style).toContain("pointer-events")
    expect(style).toContain("auto")
  })
})
