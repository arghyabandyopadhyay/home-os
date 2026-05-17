import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { LegalPageShell } from "@/components/legal/legal-page-shell"

// Mock next/link to render a plain anchor for testing
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe("LegalPageShell", () => {
  it("renders brand link with href '/' and correct aria-label", () => {
    render(
      <LegalPageShell>
        <p>Test content</p>
      </LegalPageShell>
    )

    const brandLink = screen.getByLabelText("Navigate to Home OS home page")
    expect(brandLink).toBeDefined()
    expect(brandLink.tagName).toBe("A")
    expect(brandLink.getAttribute("href")).toBe("/")
  })

  it("renders <main> element with correct classes", () => {
    const { container } = render(
      <LegalPageShell>
        <p>Test content</p>
      </LegalPageShell>
    )

    const main = container.querySelector("main")
    expect(main).not.toBeNull()
    expect(main!.className).toContain("mx-auto")
    expect(main!.className).toContain("max-w-3xl")
    expect(main!.className).toContain("py-10")
  })

  it("renders <article> wrapper for content", () => {
    const { container } = render(
      <LegalPageShell>
        <p>Wrapped content</p>
      </LegalPageShell>
    )

    const article = container.querySelector("article")
    expect(article).not.toBeNull()
    expect(article!.textContent).toContain("Wrapped content")
  })

  it("renders FooterNav within the shell", () => {
    render(
      <LegalPageShell>
        <p>Content</p>
      </LegalPageShell>
    )

    const nav = screen.getByRole("navigation", { name: "Footer" })
    expect(nav).toBeDefined()
  })
})
