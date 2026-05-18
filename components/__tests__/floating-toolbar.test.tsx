import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { FloatingToolbar } from "@/components/shared/floating-toolbar"

describe("FloatingToolbar", () => {
  it("renders children in a horizontal row", () => {
    render(
      <FloatingToolbar>
        <button aria-label="Bold">B</button>
        <button aria-label="Italic">I</button>
      </FloatingToolbar>
    )

    expect(screen.getByRole("button", { name: "Bold" })).toBeDefined()
    expect(screen.getByRole("button", { name: "Italic" })).toBeDefined()
  })

  it("renders with toolbar role and aria-label", () => {
    render(
      <FloatingToolbar>
        <button aria-label="Undo">↩</button>
      </FloatingToolbar>
    )

    const toolbar = screen.getByRole("toolbar")
    expect(toolbar).toBeDefined()
    expect(toolbar.getAttribute("aria-label")).toBe("Actions")
  })

  it("applies rounded-2xl, border-app, and bg-app-surface classes", () => {
    render(
      <FloatingToolbar>
        <button aria-label="Save">💾</button>
      </FloatingToolbar>
    )

    const toolbar = screen.getByRole("toolbar")
    expect(toolbar.className).toContain("rounded-2xl")
    expect(toolbar.className).toContain("border-app")
    expect(toolbar.className).toContain("bg-app-surface")
  })

  it("uses gap-2 for horizontal spacing between buttons", () => {
    render(
      <FloatingToolbar>
        <button aria-label="Cut">✂</button>
        <button aria-label="Copy">📋</button>
      </FloatingToolbar>
    )

    const toolbar = screen.getByRole("toolbar")
    expect(toolbar.className).toContain("gap-2")
    expect(toolbar.className).toContain("flex")
  })

  it("defaults to bottom positioning with sticky bottom-6", () => {
    render(
      <FloatingToolbar>
        <button aria-label="Delete">🗑</button>
      </FloatingToolbar>
    )

    const toolbar = screen.getByRole("toolbar")
    expect(toolbar.className).toContain("sticky")
    expect(toolbar.className).toContain("bottom-6")
  })

  it("applies top-6 when position is top", () => {
    render(
      <FloatingToolbar position="top">
        <button aria-label="Pin">📌</button>
      </FloatingToolbar>
    )

    const toolbar = screen.getByRole("toolbar")
    expect(toolbar.className).toContain("sticky")
    expect(toolbar.className).toContain("top-6")
    expect(toolbar.className).not.toContain("bottom-6")
  })
})
