import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

vi.mock("framer-motion", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  const MotionDiv = React.forwardRef(
    (
      {
        children,
        className,
        ...rest
      }: Record<string, unknown> & { children?: React.ReactNode },
      ref: React.Ref<HTMLDivElement>
    ) =>
      React.createElement(
        "div",
        { ref, className, ...rest },
        children
      )
  )
  MotionDiv.displayName = "MotionDiv"
  return {
    motion: { div: MotionDiv },
    useReducedMotion: () => false,
  }
})

vi.mock("next/link", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  return {
    default: ({
      children,
      href,
      className,
    }: {
      children: React.ReactNode
      href: string
      className?: string
    }) => React.createElement("a", { href, className }, children),
  }
})

describe("HeroSection", () => {
  it("renders the primary headline", async () => {
    const { HeroSection } = await import(
      "@/components/landing/hero-section"
    )
    render(<HeroSection />)

    expect(
      screen.getByText("A quiet home for your digital mind")
    ).toBeDefined()
  })

  it("renders the headline with large typography classes", async () => {
    const { HeroSection } = await import(
      "@/components/landing/hero-section"
    )
    render(<HeroSection />)

    const heading = screen.getByText("A quiet home for your digital mind")
    expect(heading.tagName).toBe("H2")
    expect(heading.className).toContain("text-5xl")
    expect(heading.className).toContain("md:text-6xl")
    expect(heading.className).toContain("lg:text-7xl")
    expect(heading.className).toContain("font-bold")
    expect(heading.className).toContain("tracking-tight")
  })

  it("renders supporting copy with text-app-muted", async () => {
    const { HeroSection } = await import(
      "@/components/landing/hero-section"
    )
    render(<HeroSection />)

    const subheadline = screen.getByText(/No clutter, no context switching/)
    expect(subheadline.className).toContain("text-app-muted")
  })

  it("renders supporting copy within 200 characters", async () => {
    const { HERO_CONTENT } = await import("@/components/landing/content")
    expect(HERO_CONTENT.subheadline.length).toBeLessThanOrEqual(200)
  })

  it("renders primary CTA button linking to /login", async () => {
    const { HeroSection } = await import(
      "@/components/landing/hero-section"
    )
    render(<HeroSection />)

    const ctaButton = screen.getByText("Enter Home OS")
    expect(ctaButton.closest("a")).toBeDefined()
    expect(ctaButton.closest("a")?.getAttribute("href")).toBe("/login")
    expect(ctaButton.closest("a")?.className).toContain("btn-primary-app")
  })

  it("renders secondary CTA link targeting #philosophy", async () => {
    const { HeroSection } = await import(
      "@/components/landing/hero-section"
    )
    render(<HeroSection />)

    const learnMore = screen.getByText("Learn more")
    expect(learnMore.closest("a")?.getAttribute("href")).toBe("#philosophy")
    expect(learnMore.closest("a")?.className).toContain("link-muted")
  })

  it("uses semantic section element with aria-labelledby", async () => {
    const { HeroSection } = await import(
      "@/components/landing/hero-section"
    )
    const { container } = render(<HeroSection />)

    const section = container.querySelector("section")
    expect(section).toBeDefined()
    expect(section?.getAttribute("aria-labelledby")).toBe("hero-heading")
  })

  it("applies full viewport height on desktop via lg:min-h-screen", async () => {
    const { HeroSection } = await import(
      "@/components/landing/hero-section"
    )
    const { container } = render(<HeroSection />)

    const section = container.querySelector("section")
    expect(section?.className).toContain("lg:min-h-screen")
  })

  it("applies padding on mobile instead of full viewport height", async () => {
    const { HeroSection } = await import(
      "@/components/landing/hero-section"
    )
    const { container } = render(<HeroSection />)

    const section = container.querySelector("section")
    expect(section?.className).toContain("py-12")
  })

  it("centers content vertically and horizontally", async () => {
    const { HeroSection } = await import(
      "@/components/landing/hero-section"
    )
    const { container } = render(<HeroSection />)

    const section = container.querySelector("section")
    expect(section?.className).toContain("flex")
    expect(section?.className).toContain("items-center")
    expect(section?.className).toContain("justify-center")
  })

  it("renders the UIMockup component", async () => {
    const { HeroSection } = await import(
      "@/components/landing/hero-section"
    )
    const { container } = render(<HeroSection />)

    // UIMockup renders a div with aria-hidden
    const mockup = container.querySelector("[aria-hidden='true']")
    expect(mockup).toBeDefined()
  })
})
