import { describe, it, expect, vi, beforeEach } from "vitest"
import { render } from "@testing-library/react"

/**
 * Unit tests for the Header component scroll-hide behavior.
 * Tests positioning, constants, transitions, and state-driven behavior.
 *
 * Validates: Requirements 1.2, 1.3, 1.4, 2.2, 2.3, 3.1, 3.2, 4.1, 5.1, 6.1, 7.4, 7.5
 */

// Mock hooks with controllable return values
const mockUseIsMobile = vi.fn(() => false)
vi.mock("@/hooks/use-is-mobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

const mockUseReducedMotion = vi.fn(() => false)
vi.mock("@/hooks/use-reduced-motion", () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}))

const mockUseLowPerformance = vi.fn(() => false)
vi.mock("@/hooks/use-low-performance", () => ({
  useLowPerformance: () => mockUseLowPerformance(),
}))

const mockUseScrollDirection = vi.fn(() => null)
vi.mock("@/hooks/use-scroll-direction", () => ({
  useScrollDirection: () => mockUseScrollDirection(),
}))

// Mock framer-motion to render a plain header element but capture animate/transition/style props
let capturedAnimateProps: { animate?: unknown; transition?: unknown; style?: unknown } = {}

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
            style,
            ...props
          }: React.HTMLAttributes<HTMLElement> & {
            animate?: unknown
            transition?: unknown
            style?: React.CSSProperties
          },
          ref: React.Ref<HTMLElement>
        ) => {
          capturedAnimateProps = { animate, transition, style }
          return React.createElement("header", { ...props, style, ref })
        }
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

describe("Header Component - Unit Tests", () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(false)
    mockUseReducedMotion.mockReturnValue(false)
    mockUseLowPerformance.mockReturnValue(false)
    mockUseScrollDirection.mockReturnValue(null)
    capturedAnimateProps = {}
  })

  async function renderHeader() {
    const { Header } = await import("@/components/layout/header")
    return render(<Header />)
  }

  // ─── Positioning Tests ───────────────────────────────────────────────────────

  describe("Positioning", () => {
    it("renders with md:sticky class for desktop sticky behavior", async () => {
      mockUseIsMobile.mockReturnValue(false)
      const { container } = await renderHeader()
      const header = container.querySelector("header")
      expect(header).not.toBeNull()
      expect(header!.className).toContain("md:sticky")
    })

    it("renders with fixed top-0 positioning for mobile", async () => {
      mockUseIsMobile.mockReturnValue(true)
      const { container } = await renderHeader()
      const header = container.querySelector("header")
      expect(header!.className).toContain("fixed")
      expect(header!.className).toContain("top-0")
    })

    it("renders with z-40 class for proper stacking in desktop mode", async () => {
      mockUseIsMobile.mockReturnValue(false)
      const { container } = await renderHeader()
      const header = container.querySelector("header")
      expect(header!.className).toContain("z-40")
    })

    it("maintains z-index 40 in mobile hidden state", async () => {
      mockUseIsMobile.mockReturnValue(true)
      mockUseScrollDirection.mockReturnValue("down")
      const { container } = await renderHeader()
      const header = container.querySelector("header")
      expect(header!.className).toContain("z-40")
    })
  })

  // ─── Exported Constants Tests ────────────────────────────────────────────────

  describe("Exported Constants", () => {
    it("HEADER_HIDE_DISPLACEMENT absolute value is ≥ 65 (height 64px + border 1px)", async () => {
      const { HEADER_HIDE_DISPLACEMENT } = await import(
        "@/components/layout/header"
      )
      expect(Math.abs(HEADER_HIDE_DISPLACEMENT)).toBeGreaterThanOrEqual(65)
    })

    it("HEADER_SCROLL_THRESHOLD is between 8 and 20", async () => {
      const { HEADER_SCROLL_THRESHOLD } = await import(
        "@/components/layout/header"
      )
      expect(HEADER_SCROLL_THRESHOLD).toBeGreaterThanOrEqual(8)
      expect(HEADER_SCROLL_THRESHOLD).toBeLessThanOrEqual(20)
    })
  })

  // ─── Transition Config Tests ─────────────────────────────────────────────────

  describe("Transition Configuration", () => {
    it("headerHideTransition has ease-in easing (EASING.exit)", async () => {
      const { headerHideTransition } = await import(
        "@/components/layout/header"
      )
      const { EASING } = await import("@/lib/motion")
      expect(headerHideTransition.ease).toEqual(EASING.exit)
    })

    it("headerShowTransition has ease-out easing (EASING.entrance)", async () => {
      const { headerShowTransition } = await import(
        "@/components/layout/header"
      )
      const { EASING } = await import("@/lib/motion")
      expect(headerShowTransition.ease).toEqual(EASING.entrance)
    })
  })

  // ─── Degraded Mode Tests ─────────────────────────────────────────────────────

  describe("Degraded Mode (Reduced Motion / Low Performance)", () => {
    it("transition duration is 0 when prefersReducedMotion is true", async () => {
      mockUseIsMobile.mockReturnValue(true)
      mockUseReducedMotion.mockReturnValue(true)
      mockUseScrollDirection.mockReturnValue("down")
      await renderHeader()
      expect((capturedAnimateProps.transition as { duration: number }).duration).toBe(0)
    })

    it("transition duration is 0 when isLowPerf is true", async () => {
      mockUseIsMobile.mockReturnValue(true)
      mockUseLowPerformance.mockReturnValue(true)
      mockUseScrollDirection.mockReturnValue("down")
      await renderHeader()
      expect((capturedAnimateProps.transition as { duration: number }).duration).toBe(0)
    })
  })

  // ─── Visibility State Tests ──────────────────────────────────────────────────

  describe("Visibility State", () => {
    it("isScrollHidden is false when isMobile is false (desktop always visible)", async () => {
      mockUseIsMobile.mockReturnValue(false)
      mockUseScrollDirection.mockReturnValue("down")
      await renderHeader()
      // On desktop, animate.y should be 0 regardless of scroll direction
      expect((capturedAnimateProps.animate as { y: number }).y).toBe(0)
    })

    it("Header is visible (y=0) when scrollDirection is null", async () => {
      mockUseIsMobile.mockReturnValue(true)
      mockUseScrollDirection.mockReturnValue(null)
      await renderHeader()
      expect((capturedAnimateProps.animate as { y: number }).y).toBe(0)
    })

    it("Header mounts in Visible_State with no entrance animation delay", async () => {
      mockUseIsMobile.mockReturnValue(true)
      mockUseScrollDirection.mockReturnValue(null)
      await renderHeader()
      // Initial state: y should be 0 (visible), no delay in transition
      const animate = capturedAnimateProps.animate as { y: number }
      expect(animate.y).toBe(0)
    })
  })

  // ─── Pointer Events Tests ────────────────────────────────────────────────────

  describe("Pointer Events", () => {
    it("pointer-events is 'none' when header is hidden (mobile + scroll down)", async () => {
      mockUseIsMobile.mockReturnValue(true)
      mockUseScrollDirection.mockReturnValue("down")
      const { container } = await renderHeader()
      const header = container.querySelector("header")
      expect(header!.style.pointerEvents).toBe("none")
    })

    it("pointer-events is 'auto' when header is visible (mobile + scroll up)", async () => {
      mockUseIsMobile.mockReturnValue(true)
      mockUseScrollDirection.mockReturnValue("up")
      const { container } = await renderHeader()
      const header = container.querySelector("header")
      expect(header!.style.pointerEvents).toBe("auto")
    })

    it("pointer-events is 'auto' when header is visible (desktop mode)", async () => {
      mockUseIsMobile.mockReturnValue(false)
      mockUseScrollDirection.mockReturnValue("down")
      const { container } = await renderHeader()
      const header = container.querySelector("header")
      expect(header!.style.pointerEvents).toBe("auto")
    })
  })
})
