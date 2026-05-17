import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import PrivacyPage from "@/app/privacy/page"

// Mock next/link to render a plain anchor
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe("Privacy Policy Page", () => {
  /**
   * Validates: Requirements 2.2
   */
  it('renders "Privacy Policy" heading', () => {
    render(<PrivacyPage />)
    const heading = screen.getByRole("heading", { level: 1, name: "Privacy Policy" })
    expect(heading).toBeDefined()
  })

  /**
   * Validates: Requirements 2.3, 2.4, 2.5, 2.6, 2.7
   */
  it("renders all required section headings", () => {
    render(<PrivacyPage />)

    const expectedHeadings = [
      "Data We Collect",
      "How We Use Your Data",
      "Data Storage & Security",
      "Third-Party Services",
      "Your Rights",
    ]

    for (const headingText of expectedHeadings) {
      const heading = screen.getByRole("heading", { level: 2, name: headingText })
      expect(heading).toBeDefined()
    }
  })

  /**
   * Validates: Requirements 2.8
   */
  it("displays the last updated date", () => {
    render(<PrivacyPage />)
    const dateText = screen.getByText(/last updated/i)
    expect(dateText).toBeDefined()
    // Verify it contains a human-readable date format
    expect(dateText.textContent).toMatch(/\w+ \d{1,2}, \d{4}/)
  })
})
