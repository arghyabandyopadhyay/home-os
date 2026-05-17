import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import TermsPage from "@/app/terms/page"

// Mock next/link to render a plain anchor for testing
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

/**
 * Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8
 *
 * Verifies the Terms of Service page renders the correct heading,
 * all required section headings, and the last updated date.
 */
describe("Terms of Service Page", () => {
  it('renders "Terms of Service" heading', () => {
    render(<TermsPage />)

    const heading = screen.getByRole("heading", {
      level: 1,
      name: "Terms of Service",
    })
    expect(heading).toBeDefined()
  })

  it('renders "Acceptable Use" section heading', () => {
    render(<TermsPage />)

    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Acceptable Use",
    })
    expect(heading).toBeDefined()
  })

  it('renders "Account Responsibilities" section heading', () => {
    render(<TermsPage />)

    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Account Responsibilities",
    })
    expect(heading).toBeDefined()
  })

  it('renders "Intellectual Property" section heading', () => {
    render(<TermsPage />)

    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Intellectual Property",
    })
    expect(heading).toBeDefined()
  })

  it('renders "Limitation of Liability" section heading', () => {
    render(<TermsPage />)

    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Limitation of Liability",
    })
    expect(heading).toBeDefined()
  })

  it('renders "Termination" section heading', () => {
    render(<TermsPage />)

    const heading = screen.getByRole("heading", {
      level: 2,
      name: "Termination",
    })
    expect(heading).toBeDefined()
  })

  it("displays the last updated date", () => {
    render(<TermsPage />)

    const dateText = screen.getByText(/last updated/i)
    expect(dateText).toBeDefined()
    expect(dateText.textContent).toMatch(/january|february|march|april|may|june|july|august|september|october|november|december/i)
  })
})
