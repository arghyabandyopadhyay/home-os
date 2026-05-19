import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { renderHook } from "@testing-library/react"
import React from "react"

import { MobileShell, useImmersiveContext } from "@/components/layout/mobile-shell"

/**
 * Unit tests for the MobileShell component.
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.6
 *
 * Tests that:
 * - MobileShell renders 100dvh container on mobile
 * - MobileShell passes through on desktop (≥ 768px)
 * - Initial context state is "chrome-visible"
 * - Handles null/undefined children gracefully
 * - useImmersiveContext returns null outside of MobileShell
 */

// Mock useIsMobile hook
vi.mock("@/hooks/use-is-mobile", () => ({
  useIsMobile: vi.fn(() => true),
}))

// Mock useImmersiveViewport hook
vi.mock("@/hooks/use-immersive-viewport", () => ({
  useImmersiveViewport: vi.fn(() => ({
    viewportHeight: 800,
    isKeyboardOpen: false,
    isStandalone: false,
    orientation: "portrait" as const,
  })),
}))

// Mock useScrollDirection hook
vi.mock("@/hooks/use-scroll-direction", () => ({
  useScrollDirection: vi.fn(() => null),
}))

// Mock useReducedMotion hook
vi.mock("@/hooks/use-reduced-motion", () => ({
  useReducedMotion: vi.fn(() => false),
}))

// Mock useLowPerformance hook
vi.mock("@/hooks/use-low-performance", () => ({
  useLowPerformance: vi.fn(() => false),
}))

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/dashboard"),
}))

import { useIsMobile } from "@/hooks/use-is-mobile"
import { useImmersiveViewport } from "@/hooks/use-immersive-viewport"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useLowPerformance } from "@/hooks/use-low-performance"

const mockUseIsMobile = vi.mocked(useIsMobile)
const mockUseImmersiveViewport = vi.mocked(useImmersiveViewport)
const mockUseReducedMotion = vi.mocked(useReducedMotion)
const mockUseLowPerformance = vi.mocked(useLowPerformance)

describe("MobileShell component", () => {
  beforeEach(() => {
    mockUseIsMobile.mockReturnValue(true)
    mockUseImmersiveViewport.mockReturnValue({
      viewportHeight: 800,
      isKeyboardOpen: false,
      isStandalone: false,
      orientation: "portrait",
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("renders children in a 100dvh container on mobile", () => {
    const { container } = render(
      <MobileShell>
        <div data-testid="child">Hello</div>
      </MobileShell>
    )

    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper).toBeTruthy()
    expect(wrapper.style.height).toBe("100dvh")
    expect(wrapper.className).toContain("relative")
    expect(wrapper.className).toContain("w-full")
    expect(wrapper.className).toContain("overflow-hidden")
    expect(screen.getByTestId("child")).toBeTruthy()
  })

  it("passes through children directly on desktop (≥ 768px)", () => {
    mockUseIsMobile.mockReturnValue(false)

    const { container } = render(
      <MobileShell>
        <div data-testid="child">Hello Desktop</div>
      </MobileShell>
    )

    // On desktop, children are rendered directly without a wrapper div
    expect(screen.getByTestId("child")).toBeTruthy()
    // The container should not have a 100dvh wrapper
    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.style.height).not.toBe("100dvh")
  })

  it("provides initial context state as 'chrome-visible'", () => {
    let contextValue: ReturnType<typeof useImmersiveContext> = null

    function ContextReader() {
      contextValue = useImmersiveContext()
      return null
    }

    render(
      <MobileShell>
        <ContextReader />
      </MobileShell>
    )

    expect(contextValue).not.toBeNull()
    expect(contextValue!.state).toBe("chrome-visible")
    expect(contextValue!.chromeVisible).toBe(true)
  })

  it("sets state to 'keyboard-open' when keyboard is detected", () => {
    mockUseImmersiveViewport.mockReturnValue({
      viewportHeight: 400,
      isKeyboardOpen: true,
      isStandalone: false,
      orientation: "portrait",
    })

    let contextValue: ReturnType<typeof useImmersiveContext> = null

    function ContextReader() {
      contextValue = useImmersiveContext()
      return null
    }

    render(
      <MobileShell>
        <ContextReader />
      </MobileShell>
    )

    expect(contextValue).not.toBeNull()
    expect(contextValue!.state).toBe("keyboard-open")
    expect(contextValue!.chromeVisible).toBe(false)
  })

  it("exposes viewport state through context", () => {
    mockUseImmersiveViewport.mockReturnValue({
      viewportHeight: 667,
      isKeyboardOpen: false,
      isStandalone: true,
      orientation: "landscape",
    })

    let contextValue: ReturnType<typeof useImmersiveContext> = null

    function ContextReader() {
      contextValue = useImmersiveContext()
      return null
    }

    render(
      <MobileShell>
        <ContextReader />
      </MobileShell>
    )

    expect(contextValue).not.toBeNull()
    expect(contextValue!.viewportHeight).toBe(667)
    expect(contextValue!.isStandalone).toBe(true)
    expect(contextValue!.orientation).toBe("landscape")
  })

  it("handles null children gracefully (renders empty container)", () => {
    const { container } = render(
      <MobileShell>{null}</MobileShell>
    )

    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper).toBeTruthy()
    expect(wrapper.style.height).toBe("100dvh")
    // Container should be empty but not throw
    expect(wrapper.children.length).toBe(0)
  })

  it("handles undefined children gracefully (renders empty container)", () => {
    const { container } = render(
      <MobileShell>{undefined}</MobileShell>
    )

    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper).toBeTruthy()
    expect(wrapper.style.height).toBe("100dvh")
    expect(wrapper.children.length).toBe(0)
  })

  it("useImmersiveContext returns null when used outside MobileShell", () => {
    function ContextReader() {
      const ctx = useImmersiveContext()
      return <div data-testid="ctx-value">{ctx === null ? "null" : "has-value"}</div>
    }

    render(<ContextReader />)

    expect(screen.getByTestId("ctx-value").textContent).toBe("null")
  })

  it("useImmersiveContext returns null on desktop (no provider)", () => {
    mockUseIsMobile.mockReturnValue(false)

    let contextValue: ReturnType<typeof useImmersiveContext> = null

    function ContextReader() {
      contextValue = useImmersiveContext()
      return null
    }

    render(
      <MobileShell>
        <ContextReader />
      </MobileShell>
    )

    // On desktop, MobileShell doesn't wrap with provider
    expect(contextValue).toBeNull()
  })

  it("exposes shouldAnimate as true when no motion/perf restrictions", () => {
    mockUseReducedMotion.mockReturnValue(false)
    mockUseLowPerformance.mockReturnValue(false)

    let contextValue: ReturnType<typeof useImmersiveContext> = null

    function ContextReader() {
      contextValue = useImmersiveContext()
      return null
    }

    render(
      <MobileShell>
        <ContextReader />
      </MobileShell>
    )

    expect(contextValue).not.toBeNull()
    expect(contextValue!.shouldAnimate).toBe(true)
  })

  it("exposes shouldAnimate as false when reduced motion is preferred", () => {
    mockUseReducedMotion.mockReturnValue(true)
    mockUseLowPerformance.mockReturnValue(false)

    let contextValue: ReturnType<typeof useImmersiveContext> = null

    function ContextReader() {
      contextValue = useImmersiveContext()
      return null
    }

    render(
      <MobileShell>
        <ContextReader />
      </MobileShell>
    )

    expect(contextValue).not.toBeNull()
    expect(contextValue!.shouldAnimate).toBe(false)
  })

  it("exposes shouldAnimate as false when device is low-performance", () => {
    mockUseReducedMotion.mockReturnValue(false)
    mockUseLowPerformance.mockReturnValue(true)

    let contextValue: ReturnType<typeof useImmersiveContext> = null

    function ContextReader() {
      contextValue = useImmersiveContext()
      return null
    }

    render(
      <MobileShell>
        <ContextReader />
      </MobileShell>
    )

    expect(contextValue).not.toBeNull()
    expect(contextValue!.shouldAnimate).toBe(false)
  })

  it("exposes shouldAnimate as false when both reduced motion and low-perf", () => {
    mockUseReducedMotion.mockReturnValue(true)
    mockUseLowPerformance.mockReturnValue(true)

    let contextValue: ReturnType<typeof useImmersiveContext> = null

    function ContextReader() {
      contextValue = useImmersiveContext()
      return null
    }

    render(
      <MobileShell>
        <ContextReader />
      </MobileShell>
    )

    expect(contextValue).not.toBeNull()
    expect(contextValue!.shouldAnimate).toBe(false)
  })
})
