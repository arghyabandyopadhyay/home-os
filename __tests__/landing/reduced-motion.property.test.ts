import { render, screen } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import * as fc from "fast-check"
import React from "react"

/**
 * Property 4: Reduced motion compliance
 * Validates: Requirements 11.7
 *
 * For any animated element on the landing page, when the user's system has
 * `prefers-reduced-motion: reduce` enabled, the element SHALL render in its
 * final visible state immediately without any animation delay or transition.
 *
 * Tags: Feature: landing-page, Property 4: Reduced motion compliance
 */

// Mock framer-motion with useReducedMotion always returning true
vi.mock("framer-motion", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactModule = require("react")
  const MotionDiv = ReactModule.forwardRef(
    (
      {
        children,
        className,
        initial,
        whileInView,
        viewport,
        transition,
        ...rest
      }: Record<string, unknown> & { children?: React.ReactNode },
      ref: React.Ref<HTMLDivElement>
    ) =>
      ReactModule.createElement(
        "div",
        {
          ref,
          className,
          "data-testid": "motion-div",
          "data-initial": JSON.stringify(initial),
          "data-while-in-view": JSON.stringify(whileInView),
          "data-viewport": JSON.stringify(viewport),
          "data-transition": JSON.stringify(transition),
          ...rest,
        },
        children
      ),
  )
  MotionDiv.displayName = "MotionDiv"
  return {
    motion: { div: MotionDiv },
    useReducedMotion: () => true,
  }
})

// Mock window.innerWidth for mobile detection in SectionReveal
Object.defineProperty(window, "innerWidth", {
  writable: true,
  configurable: true,
  value: 1024,
})

describe("Feature: landing-page, Property 4: Reduced motion compliance", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Property-based: SectionReveal renders without animation for any props when reduced motion is enabled", () => {
    // Arbitrary for SectionReveal props
    const sectionRevealPropsArb = fc.record({
      delay: fc.float({ min: Math.fround(0), max: Math.fround(2), noNaN: true }),
      distance: fc.integer({ min: 0, max: 200 }),
      duration: fc.float({ min: Math.fround(0.1), max: Math.fround(3), noNaN: true }),
      direction: fc.constantFrom("up" as const, "none" as const),
      className: fc.option(
        fc.string({ minLength: 1, maxLength: 30 }).filter((s) => s.trim().length > 0),
        { nil: undefined }
      ),
    })

    it("renders a plain div (not motion.div) regardless of delay/distance/duration props", async () => {
      const { SectionReveal } = await import(
        "@/components/landing/section-reveal"
      )

      fc.assert(
        fc.property(sectionRevealPropsArb, (props) => {
          const { container, unmount } = render(
            React.createElement(
              SectionReveal,
              { ...props },
              React.createElement("span", { "data-testid": "child-content" }, "Test content")
            )
          )

          // Should NOT have a motion.div (data-testid="motion-div")
          const motionDiv = container.querySelector('[data-testid="motion-div"]')
          expect(motionDiv).toBeNull()

          // Content should be visible in the DOM
          const content = screen.getByTestId("child-content")
          expect(content).toBeDefined()
          expect(content.textContent).toBe("Test content")

          unmount()
        }),
        { numRuns: 100 }
      )
    })

    it("does not apply animation data attributes regardless of props", async () => {
      const { SectionReveal } = await import(
        "@/components/landing/section-reveal"
      )

      fc.assert(
        fc.property(sectionRevealPropsArb, (props) => {
          const { container, unmount } = render(
            React.createElement(
              SectionReveal,
              { ...props },
              React.createElement("p", null, "Animated content")
            )
          )

          // No element should have animation-related data attributes
          const animatedEl = container.querySelector("[data-initial]")
          expect(animatedEl).toBeNull()

          const transitionEl = container.querySelector("[data-transition]")
          expect(transitionEl).toBeNull()

          const whileInViewEl = container.querySelector("[data-while-in-view]")
          expect(whileInViewEl).toBeNull()

          unmount()
        }),
        { numRuns: 100 }
      )
    })

    it("preserves className on the plain div wrapper", async () => {
      const { SectionReveal } = await import(
        "@/components/landing/section-reveal"
      )

      const classNameArb = fc
        .string({ minLength: 1, maxLength: 30 })
        .filter((s) => /^[a-zA-Z][\w-]*$/.test(s))

      fc.assert(
        fc.property(classNameArb, (className) => {
          const { container, unmount } = render(
            React.createElement(
              SectionReveal,
              { className },
              React.createElement("span", null, "Content")
            )
          )

          // The wrapper div should have the className applied
          const wrapper = container.firstElementChild as HTMLElement
          expect(wrapper).toBeDefined()
          expect(wrapper.className).toContain(className)

          unmount()
        }),
        { numRuns: 100 }
      )
    })

    it("content is immediately visible (no opacity:0 or transform styles) for any configuration", async () => {
      const { SectionReveal } = await import(
        "@/components/landing/section-reveal"
      )

      fc.assert(
        fc.property(sectionRevealPropsArb, (props) => {
          const { container, unmount } = render(
            React.createElement(
              SectionReveal,
              { ...props },
              React.createElement("div", { "data-testid": "visible-content" }, "Visible")
            )
          )

          const wrapper = container.firstElementChild as HTMLElement
          expect(wrapper).toBeDefined()

          // The wrapper should not have inline styles that hide content
          const style = wrapper.getAttribute("style") || ""
          expect(style).not.toContain("opacity: 0")
          expect(style).not.toContain("opacity:0")
          expect(style).not.toContain("transform")

          // Content should be in the DOM and accessible
          const content = screen.getByTestId("visible-content")
          expect(content.textContent).toBe("Visible")

          unmount()
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Section components render content visibly with reduced motion", () => {
    it("HeroSection renders all content without animation wrappers", async () => {
      const { HeroSection } = await import(
        "@/components/landing/hero-section"
      )

      const { container } = render(React.createElement(HeroSection))

      // No motion.div elements should be present
      const motionDivs = container.querySelectorAll('[data-testid="motion-div"]')
      expect(motionDivs.length).toBe(0)

      // Content should be visible - check for heading
      const heading = container.querySelector("h2")
      expect(heading).toBeDefined()
      expect(heading?.textContent?.length).toBeGreaterThan(0)
    })

    it("PhilosophySection renders all content without animation wrappers", async () => {
      const { PhilosophySection } = await import(
        "@/components/landing/philosophy-section"
      )

      const { container } = render(React.createElement(PhilosophySection))

      // No motion.div elements should be present
      const motionDivs = container.querySelectorAll('[data-testid="motion-div"]')
      expect(motionDivs.length).toBe(0)

      // Content should be visible - check for heading and paragraphs
      const heading = container.querySelector("h2")
      expect(heading).toBeDefined()
      expect(heading?.textContent?.length).toBeGreaterThan(0)

      const paragraphs = container.querySelectorAll("p")
      expect(paragraphs.length).toBeGreaterThanOrEqual(2)
    })

    it("EmotionalHook renders narrative content without animation wrappers", async () => {
      const { EmotionalHook } = await import(
        "@/components/landing/emotional-hook"
      )

      const { container } = render(React.createElement(EmotionalHook))

      // No motion.div elements should be present
      const motionDivs = container.querySelectorAll('[data-testid="motion-div"]')
      expect(motionDivs.length).toBe(0)

      // Narrative content should be visible
      const narrative = container.querySelector("p")
      expect(narrative).toBeDefined()
      expect(narrative?.textContent?.length).toBeGreaterThan(0)
    })
  })
})
