import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { PageShell } from "@/components/layout/page-shell"

describe("PageShell", () => {
  it("renders title in a heading element", () => {
    render(
      <PageShell title="My Page">
        <p>Content</p>
      </PageShell>
    )

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading.textContent).toBe("My Page")
  })

  it("applies correct title styling classes", () => {
    render(
      <PageShell title="Styled Title">
        <p>Content</p>
      </PageShell>
    )

    const heading = screen.getByRole("heading", { level: 1 })
    expect(heading.className).toContain("text-4xl")
    expect(heading.className).toContain("font-bold")
    expect(heading.className).toContain("tracking-tight")
  })

  it("renders optional description with muted styling", () => {
    render(
      <PageShell title="Title" description="A helpful description">
        <p>Content</p>
      </PageShell>
    )

    const description = screen.getByText("A helpful description")
    expect(description.className).toContain("text-app-muted")
  })

  it("does not render description when not provided", () => {
    const { container } = render(
      <PageShell title="Title">
        <p>Content</p>
      </PageShell>
    )

    const paragraphs = container.querySelectorAll("header p")
    expect(paragraphs.length).toBe(0)
  })

  it("renders optional actions right-aligned in the header", () => {
    render(
      <PageShell title="Title" actions={<button>Add Item</button>}>
        <p>Content</p>
      </PageShell>
    )

    const button = screen.getByRole("button", { name: "Add Item" })
    expect(button).toBeDefined()
    // Actions container should be inside the header
    const header = button.closest("header")
    expect(header).not.toBeNull()
  })

  it("does not render actions container when actions not provided", () => {
    const { container } = render(
      <PageShell title="Title">
        <p>Content</p>
      </PageShell>
    )

    const header = container.querySelector("header")
    // Only the title div should be present, no actions wrapper
    const flexContainer = header!.querySelector(".flex")
    const children = flexContainer!.children
    expect(children.length).toBe(1) // Only the title/description div
  })

  it("renders children inside a section element", () => {
    const { container } = render(
      <PageShell title="Title">
        <p>Child content here</p>
      </PageShell>
    )

    const section = container.querySelector("section")
    expect(section).not.toBeNull()
    expect(section!.textContent).toContain("Child content here")
  })

  it("uses semantic HTML structure (main, header, section)", () => {
    const { container } = render(
      <PageShell title="Semantic Test">
        <p>Content</p>
      </PageShell>
    )

    expect(container.querySelector("main")).not.toBeNull()
    expect(container.querySelector("header")).not.toBeNull()
    expect(container.querySelector("section")).not.toBeNull()
  })

  it("applies panel-app class to the header container", () => {
    const { container } = render(
      <PageShell title="Panel Header">
        <p>Content</p>
      </PageShell>
    )

    const header = container.querySelector("header")
    expect(header!.className).toContain("panel-app")
  })

  it("constrains content to max-w-6xl with correct padding", () => {
    const { container } = render(
      <PageShell title="Layout Test">
        <p>Content</p>
      </PageShell>
    )

    const wrapper = container.querySelector(".max-w-6xl")
    expect(wrapper).not.toBeNull()
    expect(wrapper!.className).toContain("px-6")
    expect(wrapper!.className).toContain("py-10")
  })
})
