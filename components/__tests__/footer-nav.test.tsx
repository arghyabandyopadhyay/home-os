import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { FooterNav } from "@/components/legal/footer-nav"

// Mock next/link to render a plain anchor
vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

describe("FooterNav", () => {
  it("renders a nav element with aria-label='Footer'", () => {
    render(<FooterNav />)
    const nav = screen.getByRole("navigation", { name: "Footer" })
    expect(nav).toBeDefined()
  })

  it("renders three links with correct labels and hrefs", () => {
    render(<FooterNav />)

    const privacyLink = screen.getByRole("link", { name: "Privacy Policy" })
    expect(privacyLink.getAttribute("href")).toBe("/privacy")

    const termsLink = screen.getByRole("link", { name: "Terms of Service" })
    expect(termsLink.getAttribute("href")).toBe("/terms")

    const contactLink = screen.getByRole("link", { name: "Contact" })
    expect(contactLink.getAttribute("href")).toBe("/contact")
  })

  it("applies link-muted class to all links", () => {
    render(<FooterNav />)

    const links = [
      screen.getByRole("link", { name: "Privacy Policy" }),
      screen.getByRole("link", { name: "Terms of Service" }),
      screen.getByRole("link", { name: "Contact" }),
    ]

    for (const link of links) {
      expect(link.className).toContain("link-muted")
    }
  })
})
