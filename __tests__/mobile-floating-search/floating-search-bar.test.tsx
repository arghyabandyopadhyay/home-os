import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"

/**
 * Unit tests for the FloatingSearchBar component.
 * Validates: Requirements 2.1, 3.3, 3.4, 4.1, 4.2, 7.1, 7.2, 7.3, 7.4, 8.2
 */

// Mock useIsMobile hook
const mockUseIsMobile = vi.fn(() => true)
vi.mock("@/hooks/use-is-mobile", () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

// Mock useReducedMotion hook
const mockUseReducedMotion = vi.fn(() => false)
vi.mock("@/hooks/use-reduced-motion", () => ({
  useReducedMotion: () => mockUseReducedMotion(),
}))

// Mock framer-motion to render plain elements and expose animation callbacks
let lastAnimationCompleteCallback: ((variant: string) => void) | null = null

vi.mock("framer-motion", () => ({
  motion: {
    button: ({
      children,
      onAnimationComplete,
      animate,
      ...props
    }: React.PropsWithChildren<{
      onAnimationComplete?: (variant: string) => void
      animate?: string
      [key: string]: unknown
    }>) => {
      lastAnimationCompleteCallback = onAnimationComplete ?? null
      // Remove framer-motion specific props before passing to DOM
      const {
        variants,
        transition,
        initial,
        ...domProps
      } = props as Record<string, unknown>
      return <button {...(domProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
    },
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<{ [key: string]: unknown }>) => {
      const {
        variants,
        transition,
        initial,
        animate,
        ...domProps
      } = props as Record<string, unknown>
      return <div {...(domProps as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>
    },
  },
}))

describe("FloatingSearchBar", () => {
  let dispatchEventSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    mockUseIsMobile.mockReturnValue(true)
    mockUseReducedMotion.mockReturnValue(false)
    lastAnimationCompleteCallback = null
    dispatchEventSpy = vi.spyOn(window, "dispatchEvent")
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  async function renderComponent() {
    const { FloatingSearchBar } = await import(
      "@/components/layout/floating-search-bar"
    )
    return render(<FloatingSearchBar />)
  }

  it("renders search icon and 'Search' text in resting state", async () => {
    await renderComponent()

    expect(screen.getByText("Search")).toBeDefined()
    // The Search icon from lucide-react renders as an SVG with aria-hidden
    const button = screen.getByRole("button", { name: "Search" })
    const svg = button.querySelector("svg")
    expect(svg).not.toBeNull()
  })

  it('has aria-label="Search" on button element', async () => {
    await renderComponent()

    const button = screen.getByRole("button", { name: "Search" })
    expect(button.getAttribute("aria-label")).toBe("Search")
  })

  it('uses <button type="button"> element', async () => {
    await renderComponent()

    const button = screen.getByRole("button", { name: "Search" })
    expect(button.tagName).toBe("BUTTON")
    expect(button.getAttribute("type")).toBe("button")
  })

  it("dispatches open-command-menu event on activation", async () => {
    await renderComponent()

    const button = screen.getByRole("button", { name: "Search" })
    fireEvent.click(button)

    // Simulate animation completing
    act(() => {
      if (lastAnimationCompleteCallback) {
        lastAnimationCompleteCallback("expanded")
      }
    })

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "open-command-menu" })
    )
  })

  it("does not dispatch event when command menu is already open", async () => {
    await renderComponent()

    const button = screen.getByRole("button", { name: "Search" })

    // First click to open command menu
    fireEvent.click(button)
    act(() => {
      if (lastAnimationCompleteCallback) {
        lastAnimationCompleteCallback("expanded")
      }
    })

    // The open-command-menu event listener in the component sets commandMenuOpen = true
    // Clear the spy to track only subsequent calls
    dispatchEventSpy.mockClear()

    // Second click should not dispatch
    fireEvent.click(button)

    // Advance timers to ensure no fallback fires
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(dispatchEventSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "open-command-menu" })
    )
  })

  it("skips animation and dispatches immediately when reduced motion is active", async () => {
    mockUseReducedMotion.mockReturnValue(true)
    await renderComponent()

    const button = screen.getByRole("button", { name: "Search" })
    fireEvent.click(button)

    // Should dispatch immediately without waiting for animation
    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "open-command-menu" })
    )
  })

  it("keyboard activation (Enter) triggers expansion", async () => {
    await renderComponent()

    const button = screen.getByRole("button", { name: "Search" })
    fireEvent.keyDown(button, { key: "Enter" })

    // Simulate animation completing (or fallback timeout)
    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "open-command-menu" })
    )
  })

  it("keyboard activation (Space) triggers expansion", async () => {
    await renderComponent()

    const button = screen.getByRole("button", { name: "Search" })
    fireEvent.keyDown(button, { key: " " })

    // Simulate animation completing (or fallback timeout)
    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(dispatchEventSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "open-command-menu" })
    )
  })

  it("not rendered in DOM at desktop viewport widths", async () => {
    mockUseIsMobile.mockReturnValue(false)
    const { container } = await renderComponent()

    expect(container.innerHTML).toBe("")
    expect(screen.queryByRole("button", { name: "Search" })).toBeNull()
  })

  it("focus indicator has outline with offset", async () => {
    await renderComponent()

    const button = screen.getByRole("button", { name: "Search" })
    expect(button.className).toContain("outline-offset-2")
    expect(button.className).toContain("focus-visible:outline-2")
  })
})
