import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import ContactPage from "@/app/contact/page"

// Mock next/link to render a plain anchor for testing
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

describe("Contact Us Page", () => {
  it('renders "Contact Us" heading', () => {
    render(<ContactPage />)

    const heading = screen.getByRole("heading", { level: 1, name: "Contact Us" })
    expect(heading).toBeDefined()
  })

  it("renders a clickable mailto email link", () => {
    render(<ContactPage />)

    const mailtoLink = screen.getByRole("link", { name: /businessgenie9@gmail\.com/i })
    expect(mailtoLink).toBeDefined()
    expect(mailtoLink.getAttribute("href")).toMatch(/^mailto:/)
  })

  it("renders response time description", () => {
    render(<ContactPage />)

    const responseHeading = screen.getByRole("heading", { level: 2, name: /response time/i })
    expect(responseHeading).toBeDefined()

    // Verify there's a paragraph with a specific timeframe mentioned
    const responseSection = responseHeading.closest("section")
    expect(responseSection).not.toBeNull()
    expect(responseSection!.textContent).toMatch(/\d+\s*business\s*day/i)
  })

  it("renders inquiry types list with at least 3 items", () => {
    render(<ContactPage />)

    const listItems = screen.getAllByRole("listitem")
    expect(listItems.length).toBeGreaterThanOrEqual(3)
  })
})
