import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { EmptyState } from "@/components/shared/empty-state"

function MockIcon({ className }: { className?: string }) {
  return <svg data-testid="empty-state-icon" className={className} />
}

describe("EmptyState", () => {
  const defaultProps = {
    module: "notes",
    icon: MockIcon,
    heading: "Start capturing your thoughts",
    body: "Create your first note to begin organizing ideas and inspiration.",
    actionLabel: "Create a note",
    onAction: vi.fn(),
  }

  it("renders the icon at 48px with text-app-muted", () => {
    render(<EmptyState {...defaultProps} />)

    const icon = screen.getByTestId("empty-state-icon")
    expect(icon).toBeDefined()
    const classAttr = icon.getAttribute("class") ?? ""
    expect(classAttr).toContain("h-12")
    expect(classAttr).toContain("w-12")
    expect(classAttr).toContain("text-app-muted")
  })

  it("renders the heading text", () => {
    render(<EmptyState {...defaultProps} />)

    const heading = screen.getByRole("heading", { level: 2 })
    expect(heading).toBeDefined()
    expect(heading.textContent).toBe("Start capturing your thoughts")
  })

  it("renders the body text", () => {
    render(<EmptyState {...defaultProps} />)

    expect(
      screen.getByText(
        "Create your first note to begin organizing ideas and inspiration."
      )
    ).toBeDefined()
  })

  it("renders a CTA button with btn-primary-app class", () => {
    render(<EmptyState {...defaultProps} />)

    const button = screen.getByRole("button", { name: "Create a note" })
    expect(button).toBeDefined()
    expect(button.className).toContain("btn-primary-app")
  })

  it("calls onAction when the CTA button is clicked", () => {
    const onAction = vi.fn()
    render(<EmptyState {...defaultProps} onAction={onAction} />)

    const button = screen.getByRole("button", { name: "Create a note" })
    fireEvent.click(button)
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it("centers content with minimum 64px padding", () => {
    const { container } = render(<EmptyState {...defaultProps} />)

    const wrapper = container.firstElementChild as HTMLElement
    expect(wrapper.className).toContain("p-16")
    expect(wrapper.className).toContain("items-center")
    expect(wrapper.className).toContain("justify-center")
  })
})
