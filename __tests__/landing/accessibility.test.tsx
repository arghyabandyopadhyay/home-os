import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"

// Mock framer-motion
vi.mock("framer-motion", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const React = require("react")
  const MotionDiv = React.forwardRef(
    (
      { children, className, style, role }: Record<string, unknown> & { children?: React.ReactNode },
      ref: React.Ref<HTMLDivElement>
    ) => React.createElement("div", { ref, className, style, role }, children)
  )
  MotionDiv.displayName = "MotionDiv"
  const MotionUl = React.forwardRef(
    (
      { children, className, role }: Record<string, unknown> & { children?: React.ReactNode },
      ref: React.Ref<HTMLUListElement>
    ) => React.createElement("ul", { ref, className, role }, children)
  )
  MotionUl.displayName = "MotionUl"
  const MotionLi = React.forwardRef(
    (
      { children, className }: Record<string, unknown> & { children?: React.ReactNode },
      ref: React.Ref<HTMLLIElement>
    ) => React.createElement("li", { ref, className }, children)
  )
  MotionLi.displayName = "MotionLi"
  return {
    motion: { div: MotionDiv, ul: MotionUl, li: MotionLi },
    useReducedMotion: () => false,
  }
})

// Mock next/link
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

// Mock useScrollPosition
vi.mock("@/components/landing/use-scroll-position", () => ({
  useScrollPosition: () => 0,
}))

describe("Accessibility: Landmarks and Navigation", () => {
  describe("Navbar landmarks", () => {
    it("renders a <nav> element with aria-label 'Main'", async () => {
      const { LandingNavbar } = await import("@/components/landing/landing-navbar")
      const { container } = render(<LandingNavbar />)

      const nav = container.querySelector("nav")
      expect(nav).not.toBeNull()
      expect(nav?.getAttribute("aria-label")).toBe("Main")
    })

    it("navbar interactive elements have accessible names", async () => {
      const { LandingNavbar } = await import("@/components/landing/landing-navbar")
      render(<LandingNavbar />)

      const loginLink = screen.getByText("Log in")
      expect(loginLink).toBeDefined()
      expect(loginLink.closest("a")).not.toBeNull()

      const signupLink = screen.getByText("Sign up")
      expect(signupLink).toBeDefined()
      expect(signupLink.closest("a")).not.toBeNull()
    })

    it("navbar links have valid href attributes", async () => {
      const { LandingNavbar } = await import("@/components/landing/landing-navbar")
      const { container } = render(<LandingNavbar />)

      const links = container.querySelectorAll("a")
      links.forEach((link) => {
        const href = link.getAttribute("href")
        expect(href).not.toBeNull()
        expect(href!.length).toBeGreaterThan(0)
      })
    })

    it("navbar interactive elements have focus-visible classes", async () => {
      const { LandingNavbar } = await import("@/components/landing/landing-navbar")
      const { container } = render(<LandingNavbar />)

      const links = container.querySelectorAll("a")
      links.forEach((link) => {
        expect(link.className).toContain("focus-visible:")
      })
    })
  })

  describe("Footer landmarks", () => {
    it("renders a <footer> element", async () => {
      const { LandingFooter } = await import("@/components/landing/landing-footer")
      const { container } = render(<LandingFooter />)

      const footer = container.querySelector("footer")
      expect(footer).not.toBeNull()
    })

    it("contains a <nav> with aria-label 'Footer'", async () => {
      const { LandingFooter } = await import("@/components/landing/landing-footer")
      const { container } = render(<LandingFooter />)

      const nav = container.querySelector("nav")
      expect(nav).not.toBeNull()
      expect(nav?.getAttribute("aria-label")).toBe("Footer")
    })

    it("footer links have valid href attributes", async () => {
      const { LandingFooter } = await import("@/components/landing/landing-footer")
      const { container } = render(<LandingFooter />)

      const links = container.querySelectorAll("a")
      expect(links.length).toBeGreaterThan(0)
      links.forEach((link) => {
        const href = link.getAttribute("href")
        expect(href).not.toBeNull()
        expect(href!.length).toBeGreaterThan(0)
      })
    })

    it("footer links have focus-visible classes", async () => {
      const { LandingFooter } = await import("@/components/landing/landing-footer")
      const { container } = render(<LandingFooter />)

      const links = container.querySelectorAll("a")
      links.forEach((link) => {
        expect(link.className).toContain("focus-visible:")
      })
    })
  })

  describe("Feature Showcase semantics", () => {
    it("renders a <section> element", async () => {
      const { FeatureShowcase } = await import("@/components/landing/feature-showcase")
      const { container } = render(<FeatureShowcase />)

      const section = container.querySelector("section")
      expect(section).not.toBeNull()
    })

    it("uses <ul> and <li> elements for module list", async () => {
      const { FeatureShowcase } = await import("@/components/landing/feature-showcase")
      const { container } = render(<FeatureShowcase />)

      const ul = container.querySelector("ul")
      expect(ul).not.toBeNull()

      const items = container.querySelectorAll("li")
      expect(items.length).toBe(6) // 6 modules
    })

    it("icons have aria-hidden='true'", async () => {
      const { FeatureShowcase } = await import("@/components/landing/feature-showcase")
      const { container } = render(<FeatureShowcase />)

      const svgIcons = container.querySelectorAll("svg")
      svgIcons.forEach((svg) => {
        // All decorative icons in the feature showcase should be aria-hidden
        expect(svg.getAttribute("aria-hidden")).toBe("true")
      })
    })
  })

  describe("Section landmarks", () => {
    it("HeroSection uses <section> with aria-labelledby", async () => {
      const { HeroSection } = await import("@/components/landing/hero-section")
      const { container } = render(<HeroSection />)

      const section = container.querySelector("section")
      expect(section).not.toBeNull()
      expect(section?.getAttribute("aria-labelledby")).toBe("hero-heading")
    })

    it("PhilosophySection uses <section> element", async () => {
      const { PhilosophySection } = await import("@/components/landing/philosophy-section")
      const { container } = render(<PhilosophySection />)

      const section = container.querySelector("section")
      expect(section).not.toBeNull()
    })

    it("WorkflowSection uses <section> with aria-labelledby", async () => {
      const { WorkflowSection } = await import("@/components/landing/workflow-section")
      const { container } = render(<WorkflowSection />)

      const section = container.querySelector("section")
      expect(section).not.toBeNull()
      expect(section?.getAttribute("aria-labelledby")).toBe("workflow-heading")
    })

    it("CTASection uses <section> with aria-labelledby", async () => {
      const { CTASection } = await import("@/components/landing/cta-section")
      const { container } = render(<CTASection />)

      const section = container.querySelector("section")
      expect(section).not.toBeNull()
      expect(section?.getAttribute("aria-labelledby")).toBe("cta-heading")
    })

    it("FeatureShowcase uses <section> with aria-labelledby", async () => {
      const { FeatureShowcase } = await import("@/components/landing/feature-showcase")
      const { container } = render(<FeatureShowcase />)

      const section = container.querySelector("section")
      expect(section).not.toBeNull()
      expect(section?.getAttribute("aria-labelledby")).toBe("features-heading")
    })
  })

  describe("Interactive elements have accessible names", () => {
    it("all navbar links and buttons have text content", async () => {
      const { LandingNavbar } = await import("@/components/landing/landing-navbar")
      const { container } = render(<LandingNavbar />)

      const interactiveElements = container.querySelectorAll("a, button")
      interactiveElements.forEach((el) => {
        const hasText = (el.textContent?.trim().length ?? 0) > 0
        const hasAriaLabel = el.getAttribute("aria-label") !== null
        expect(hasText || hasAriaLabel).toBe(true)
      })
    })

    it("all footer links have text content", async () => {
      const { LandingFooter } = await import("@/components/landing/landing-footer")
      const { container } = render(<LandingFooter />)

      const interactiveElements = container.querySelectorAll("a, button")
      interactiveElements.forEach((el) => {
        const hasText = (el.textContent?.trim().length ?? 0) > 0
        const hasAriaLabel = el.getAttribute("aria-label") !== null
        expect(hasText || hasAriaLabel).toBe(true)
      })
    })

    it("all CTA section links have text content", async () => {
      const { CTASection } = await import("@/components/landing/cta-section")
      const { container } = render(<CTASection />)

      const interactiveElements = container.querySelectorAll("a, button")
      expect(interactiveElements.length).toBeGreaterThan(0)
      interactiveElements.forEach((el) => {
        const hasText = (el.textContent?.trim().length ?? 0) > 0
        const hasAriaLabel = el.getAttribute("aria-label") !== null
        expect(hasText || hasAriaLabel).toBe(true)
      })
    })

    it("all Hero section links have text content", async () => {
      const { HeroSection } = await import("@/components/landing/hero-section")
      const { container } = render(<HeroSection />)

      const interactiveElements = container.querySelectorAll("a, button")
      expect(interactiveElements.length).toBeGreaterThan(0)
      interactiveElements.forEach((el) => {
        const hasText = (el.textContent?.trim().length ?? 0) > 0
        const hasAriaLabel = el.getAttribute("aria-label") !== null
        expect(hasText || hasAriaLabel).toBe(true)
      })
    })
  })

  describe("Focus indicators", () => {
    it("CTA button has focus-visible classes", async () => {
      const { CTASection } = await import("@/components/landing/cta-section")
      const { container } = render(<CTASection />)

      const links = container.querySelectorAll("a")
      links.forEach((link) => {
        expect(link.className).toContain("focus-visible:")
      })
    })

    it("Hero section links have focus-visible or btn-primary-app classes", async () => {
      const { HeroSection } = await import("@/components/landing/hero-section")
      const { container } = render(<HeroSection />)

      const links = container.querySelectorAll("a")
      links.forEach((link) => {
        const hasFocusVisible = link.className.includes("focus-visible:")
        const hasBtnPrimary = link.className.includes("btn-primary-app")
        const hasLinkMuted = link.className.includes("link-muted")
        // Interactive elements should have either explicit focus-visible classes
        // or use component classes (btn-primary-app, link-muted) that include focus styles
        expect(hasFocusVisible || hasBtnPrimary || hasLinkMuted).toBe(true)
      })
    })
  })

  describe("Decorative elements", () => {
    it("CTA section decorative background has aria-hidden", async () => {
      const { CTASection } = await import("@/components/landing/cta-section")
      const { container } = render(<CTASection />)

      const decorative = container.querySelector("[aria-hidden='true']")
      expect(decorative).not.toBeNull()
    })

    it("Navbar logo icon has aria-hidden", async () => {
      const { LandingNavbar } = await import("@/components/landing/landing-navbar")
      const { container } = render(<LandingNavbar />)

      const svgs = container.querySelectorAll("svg")
      svgs.forEach((svg) => {
        expect(svg.getAttribute("aria-hidden")).toBe("true")
      })
    })

    it("WorkflowSection SVG icons have aria-hidden", async () => {
      const { WorkflowSection } = await import("@/components/landing/workflow-section")
      const { container } = render(<WorkflowSection />)

      const svgs = container.querySelectorAll("svg")
      svgs.forEach((svg) => {
        expect(svg.getAttribute("aria-hidden")).toBe("true")
      })
    })

    it("FeatureShowcase connecting lines SVG has aria-hidden", async () => {
      const { FeatureShowcase } = await import("@/components/landing/feature-showcase")
      const { container } = render(<FeatureShowcase />)

      const svgs = container.querySelectorAll("svg[aria-hidden='true']")
      expect(svgs.length).toBeGreaterThan(0)
    })
  })

  describe("Heading hierarchy", () => {
    it("HeroSection contains an h2 heading", async () => {
      const { HeroSection } = await import("@/components/landing/hero-section")
      const { container } = render(<HeroSection />)

      const heading = container.querySelector("h2")
      expect(heading).not.toBeNull()
      expect(heading?.textContent?.trim().length).toBeGreaterThan(0)
    })

    it("PhilosophySection contains an h2 heading", async () => {
      const { PhilosophySection } = await import("@/components/landing/philosophy-section")
      const { container } = render(<PhilosophySection />)

      const heading = container.querySelector("h2")
      expect(heading).not.toBeNull()
      expect(heading?.textContent?.trim().length).toBeGreaterThan(0)
    })

    it("FeatureShowcase contains an h2 heading", async () => {
      const { FeatureShowcase } = await import("@/components/landing/feature-showcase")
      const { container } = render(<FeatureShowcase />)

      const heading = container.querySelector("h2")
      expect(heading).not.toBeNull()
      expect(heading?.textContent?.trim().length).toBeGreaterThan(0)
    })

    it("WorkflowSection contains an h2 heading", async () => {
      const { WorkflowSection } = await import("@/components/landing/workflow-section")
      const { container } = render(<WorkflowSection />)

      const heading = container.querySelector("h2")
      expect(heading).not.toBeNull()
      expect(heading?.textContent?.trim().length).toBeGreaterThan(0)
    })

    it("CTASection contains an h2 heading", async () => {
      const { CTASection } = await import("@/components/landing/cta-section")
      const { container } = render(<CTASection />)

      const heading = container.querySelector("h2")
      expect(heading).not.toBeNull()
      expect(heading?.textContent?.trim().length).toBeGreaterThan(0)
    })
  })

  describe("Navigation links have valid hrefs", () => {
    it("HeroSection links have valid href attributes", async () => {
      const { HeroSection } = await import("@/components/landing/hero-section")
      const { container } = render(<HeroSection />)

      const links = container.querySelectorAll("a")
      expect(links.length).toBeGreaterThan(0)
      links.forEach((link) => {
        const href = link.getAttribute("href")
        expect(href).not.toBeNull()
        expect(href!.length).toBeGreaterThan(0)
      })
    })

    it("CTASection links have valid href attributes", async () => {
      const { CTASection } = await import("@/components/landing/cta-section")
      const { container } = render(<CTASection />)

      const links = container.querySelectorAll("a")
      expect(links.length).toBeGreaterThan(0)
      links.forEach((link) => {
        const href = link.getAttribute("href")
        expect(href).not.toBeNull()
        expect(href!.length).toBeGreaterThan(0)
      })
    })
  })

  describe("Touch targets", () => {
    it("Navbar interactive elements have min-h-[44px] class", async () => {
      const { LandingNavbar } = await import("@/components/landing/landing-navbar")
      const { container } = render(<LandingNavbar />)

      const links = container.querySelectorAll("a")
      links.forEach((link) => {
        expect(link.className).toContain("min-h-[44px]")
      })
    })

    it("CTA button has min-h-[44px] class", async () => {
      const { CTASection } = await import("@/components/landing/cta-section")
      const { container } = render(<CTASection />)

      const links = container.querySelectorAll("a")
      links.forEach((link) => {
        if (link.className.includes("btn-primary-app")) {
          expect(link.className).toContain("min-h-[44px]")
        }
      })
    })

    it("Hero section CTA buttons have min-h-[44px] class", async () => {
      const { HeroSection } = await import("@/components/landing/hero-section")
      const { container } = render(<HeroSection />)

      const links = container.querySelectorAll("a")
      links.forEach((link) => {
        expect(link.className).toContain("min-h-[44px]")
      })
    })

    it("Footer links have min-h-[44px] class", async () => {
      const { LandingFooter } = await import("@/components/landing/landing-footer")
      const { container } = render(<LandingFooter />)

      const links = container.querySelectorAll("a")
      links.forEach((link) => {
        expect(link.className).toContain("min-h-[44px]")
      })
    })
  })
})
