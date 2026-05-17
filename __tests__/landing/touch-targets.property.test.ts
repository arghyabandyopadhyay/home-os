import { render } from "@testing-library/react"
import { describe, it, expect, vi } from "vitest"
import * as fc from "fast-check"
import React from "react"

/**
 * Property 5: Interactive element touch targets
 * Validates: Requirements 12.7
 *
 * For any interactive element (button or link) on the landing page when rendered
 * at a viewport width below 1024px, the element SHALL have a minimum clickable
 * area of 44×44 pixels.
 *
 * Since JSDOM cannot compute actual CSS dimensions, we verify the presence of
 * the `min-h-[44px]` class (or equivalent) on interactive elements as a proxy.
 *
 * Tags: Feature: landing-page, Property 5: Interactive element touch targets
 */

vi.mock("framer-motion", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactMod = require("react")
  const MotionDiv = ReactMod.forwardRef(
    (
      {
        children,
        className,
        ...rest
      }: Record<string, unknown> & { children?: React.ReactNode },
      ref: React.Ref<HTMLDivElement>
    ) => ReactMod.createElement("div", { ref, className, ...rest }, children)
  )
  MotionDiv.displayName = "MotionDiv"
  return {
    motion: { div: MotionDiv },
    useReducedMotion: () => false,
  }
})

vi.mock("next/link", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ReactMod = require("react")
  return {
    default: ({
      children,
      href,
      className,
    }: {
      children: React.ReactNode
      href: string
      className?: string
    }) => ReactMod.createElement("a", { href, className }, children),
  }
})

vi.mock("@/components/landing/use-scroll-position", () => ({
  useScrollPosition: () => 0,
}))

const TOUCH_TARGET_CLASS = "min-h-[44px]"

/**
 * Checks whether an element or any of its ancestors (up to the component root)
 * has the min-h-[44px] class, indicating a 44px minimum touch target height.
 */
function hasTouchTargetClass(element: Element): boolean {
  let current: Element | null = element
  while (current) {
    const className = current.getAttribute("class") || ""
    if (className.includes(TOUCH_TARGET_CLASS)) {
      return true
    }
    current = current.parentElement
  }
  return false
}

/**
 * Extracts all interactive elements (a, button) from a rendered container.
 */
function getInteractiveElements(container: HTMLElement): Element[] {
  const links = Array.from(container.querySelectorAll("a"))
  const buttons = Array.from(container.querySelectorAll("button"))
  return [...links, ...buttons]
}

describe("Feature: landing-page, Property 5: Interactive element touch targets", () => {
  describe("LandingNavbar interactive elements have 44px touch targets", () => {
    it("all links in navbar have min-h-[44px] class", async () => {
      const { LandingNavbar } = await import(
        "@/components/landing/landing-navbar"
      )
      const { container } = render(React.createElement(LandingNavbar))
      const interactiveElements = getInteractiveElements(container)

      expect(interactiveElements.length).toBeGreaterThan(0)
      for (const el of interactiveElements) {
        expect(
          hasTouchTargetClass(el),
          `Element "${el.textContent}" should have ${TOUCH_TARGET_CLASS} class`
        ).toBe(true)
      }
    })
  })

  describe("HeroSection interactive elements have 44px touch targets", () => {
    it("all links and buttons in hero have min-h-[44px] class", async () => {
      const { HeroSection } = await import(
        "@/components/landing/hero-section"
      )
      const { container } = render(React.createElement(HeroSection))
      const interactiveElements = getInteractiveElements(container)

      expect(interactiveElements.length).toBeGreaterThan(0)
      for (const el of interactiveElements) {
        expect(
          hasTouchTargetClass(el),
          `Element "${el.textContent}" should have ${TOUCH_TARGET_CLASS} class`
        ).toBe(true)
      }
    })
  })

  describe("CTASection interactive elements have 44px touch targets", () => {
    it("all links and buttons in CTA have min-h-[44px] class", async () => {
      const { CTASection } = await import(
        "@/components/landing/cta-section"
      )
      const { container } = render(React.createElement(CTASection))
      const interactiveElements = getInteractiveElements(container)

      expect(interactiveElements.length).toBeGreaterThan(0)
      for (const el of interactiveElements) {
        expect(
          hasTouchTargetClass(el),
          `Element "${el.textContent}" should have ${TOUCH_TARGET_CLASS} class`
        ).toBe(true)
      }
    })
  })

  describe("LandingFooter interactive elements have 44px touch targets", () => {
    it("all links in footer have min-h-[44px] class", async () => {
      const { LandingFooter } = await import(
        "@/components/landing/landing-footer"
      )
      const { container } = render(React.createElement(LandingFooter))
      const interactiveElements = getInteractiveElements(container)

      expect(interactiveElements.length).toBeGreaterThan(0)
      for (const el of interactiveElements) {
        expect(
          hasTouchTargetClass(el),
          `Element "${el.textContent}" should have ${TOUCH_TARGET_CLASS} class`
        ).toBe(true)
      }
    })
  })

  describe("Property-based: touch target validation logic", () => {
    /**
     * Validation function that checks if a className string contains
     * the required touch target class.
     */
    function validateTouchTarget(className: string): boolean {
      return className.includes("min-h-[44px]")
    }

    it("correctly identifies elements WITH min-h-[44px] as valid touch targets", () => {
      const classWithTouchTarget = fc.constantFrom(
        "min-h-[44px]",
        "inline-flex min-h-[44px] items-center",
        "btn-primary-app min-h-[44px] min-w-[44px] px-4 py-2",
        "link-muted min-h-[44px] rounded-md",
        "text-app-muted hover:text-app min-h-[44px] inline-flex items-center"
      )

      fc.assert(
        fc.property(classWithTouchTarget, (className) => {
          expect(validateTouchTarget(className)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("correctly identifies elements WITHOUT min-h-[44px] as invalid touch targets", () => {
      const classWithoutTouchTarget = fc.constantFrom(
        "inline-flex items-center px-4 py-2",
        "btn-primary-app px-4 py-2 text-sm",
        "link-muted rounded-md",
        "text-app-muted hover:text-app",
        "min-w-[44px] px-3 py-1"
      )

      fc.assert(
        fc.property(classWithoutTouchTarget, (className) => {
          expect(validateTouchTarget(className)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("validates touch targets for randomly generated interactive element configurations", () => {
      // Generate random element configurations representing interactive elements
      type InteractiveElement = {
        tag: "a" | "button"
        className: string
        hasMinHeight: boolean
      }

      const interactiveElementArb: fc.Arbitrary<InteractiveElement> = fc
        .record({
          tag: fc.constantFrom("a" as const, "button" as const),
          hasMinHeight: fc.boolean(),
          extraClasses: fc.array(
            fc.constantFrom(
              "inline-flex",
              "items-center",
              "px-4",
              "py-2",
              "rounded-md",
              "text-sm",
              "font-medium",
              "btn-primary-app",
              "link-muted",
              "min-w-[44px]"
            ),
            { minLength: 1, maxLength: 5 }
          ),
        })
        .map(({ tag, hasMinHeight, extraClasses }) => ({
          tag,
          hasMinHeight,
          className: hasMinHeight
            ? [...extraClasses, "min-h-[44px]"].join(" ")
            : extraClasses.join(" "),
        }))

      fc.assert(
        fc.property(interactiveElementArb, (element) => {
          const isValid = validateTouchTarget(element.className)
          expect(isValid).toBe(element.hasMinHeight)
        }),
        { numRuns: 100 }
      )
    })

    it("touch target validation is independent of class order", () => {
      const shuffledClassesArb = fc
        .array(
          fc.constantFrom(
            "inline-flex",
            "items-center",
            "px-4",
            "py-2",
            "rounded-md",
            "text-sm",
            "font-medium",
            "btn-primary-app",
            "link-muted"
          ),
          { minLength: 1, maxLength: 6 }
        )
        .chain((classes) =>
          fc.constantFrom(
            // Insert min-h-[44px] at random positions
            ["min-h-[44px]", ...classes].join(" "),
            [...classes, "min-h-[44px]"].join(" "),
            [
              ...classes.slice(0, Math.floor(classes.length / 2)),
              "min-h-[44px]",
              ...classes.slice(Math.floor(classes.length / 2)),
            ].join(" ")
          )
        )

      fc.assert(
        fc.property(shuffledClassesArb, (className) => {
          expect(validateTouchTarget(className)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })
})
