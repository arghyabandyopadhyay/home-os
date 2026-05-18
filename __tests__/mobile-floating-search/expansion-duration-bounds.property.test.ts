import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

import {
  expandTransition,
  collapseTransition,
} from "@/components/layout/floating-search-bar"

/**
 * Property 3: Expansion and collapse duration within bounds
 * Validates: Requirements 3.1, 3.5
 *
 * For any expansion or collapse animation config used by the FloatingSearchBar,
 * the duration must be between 150ms and 200ms inclusive.
 * The expansion must use ease-out easing and the collapse must use ease-in easing.
 *
 * Tags: Feature: mobile-floating-search, Property 3: Expansion and collapse duration within bounds
 */

/** Duration bounds in seconds (150–200ms) */
const MIN_DURATION_S = 0.15
const MAX_DURATION_S = 0.2

/** Expected easing values */
const EXPAND_EASING = "easeOut"
const COLLAPSE_EASING = "easeIn"

/**
 * Validates that a duration value (in seconds) is within the allowed bounds.
 */
function isDurationWithinBounds(duration: number): boolean {
  return duration >= MIN_DURATION_S && duration <= MAX_DURATION_S
}

/**
 * Validates that the expand transition config satisfies all constraints.
 */
function isValidExpandTransition(transition: {
  duration: number
  ease: string
}): boolean {
  return (
    isDurationWithinBounds(transition.duration) &&
    transition.ease === EXPAND_EASING
  )
}

/**
 * Validates that the collapse transition config satisfies all constraints.
 */
function isValidCollapseTransition(transition: {
  duration: number
  ease: string
}): boolean {
  return (
    isDurationWithinBounds(transition.duration) &&
    transition.ease === COLLAPSE_EASING
  )
}

describe("Feature: mobile-floating-search, Property 3: Expansion and collapse duration within bounds", () => {
  describe("Expand transition static validation", () => {
    it("expandTransition duration is between 150ms and 200ms", () => {
      const duration = expandTransition.duration as number
      expect(duration).toBeGreaterThanOrEqual(MIN_DURATION_S)
      expect(duration).toBeLessThanOrEqual(MAX_DURATION_S)
    })

    it("expandTransition uses ease-out easing", () => {
      expect(expandTransition.ease).toBe(EXPAND_EASING)
    })
  })

  describe("Collapse transition static validation", () => {
    it("collapseTransition duration is between 150ms and 200ms", () => {
      const duration = collapseTransition.duration as number
      expect(duration).toBeGreaterThanOrEqual(MIN_DURATION_S)
      expect(duration).toBeLessThanOrEqual(MAX_DURATION_S)
    })

    it("collapseTransition uses ease-in easing", () => {
      expect(collapseTransition.ease).toBe(COLLAPSE_EASING)
    })
  })

  describe("Property-based: expansion duration always within bounds across scale factors", () => {
    const scaleFactorArb = fc.double({ min: 1.0, max: 3.0, noNaN: true })

    it("expand transition duration remains within bounds regardless of scale factor", () => {
      fc.assert(
        fc.property(scaleFactorArb, (_scaleFactor) => {
          // The transition config is static — regardless of what scale factor
          // is applied to the animation, the duration must stay within bounds
          const duration = expandTransition.duration as number
          expect(duration).toBeGreaterThanOrEqual(MIN_DURATION_S)
          expect(duration).toBeLessThanOrEqual(MAX_DURATION_S)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: collapse duration always within bounds across scale factors", () => {
    const scaleFactorArb = fc.double({ min: 0.1, max: 2.0, noNaN: true })

    it("collapse transition duration remains within bounds regardless of scale factor", () => {
      fc.assert(
        fc.property(scaleFactorArb, (_scaleFactor) => {
          const duration = collapseTransition.duration as number
          expect(duration).toBeGreaterThanOrEqual(MIN_DURATION_S)
          expect(duration).toBeLessThanOrEqual(MAX_DURATION_S)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: expansion always uses ease-out easing", () => {
    const randomParamsArb = fc.record({
      viewportWidth: fc.integer({ min: 320, max: 767 }),
      activationCount: fc.integer({ min: 1, max: 50 }),
    })

    it("expand transition easing is always ease-out for any mobile viewport scenario", () => {
      fc.assert(
        fc.property(randomParamsArb, (_params) => {
          expect(expandTransition.ease).toBe(EXPAND_EASING)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: collapse always uses ease-in easing", () => {
    const randomParamsArb = fc.record({
      viewportWidth: fc.integer({ min: 320, max: 767 }),
      activationCount: fc.integer({ min: 1, max: 50 }),
    })

    it("collapse transition easing is always ease-in for any mobile viewport scenario", () => {
      fc.assert(
        fc.property(randomParamsArb, (_params) => {
          expect(collapseTransition.ease).toBe(COLLAPSE_EASING)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: valid duration values are correctly identified", () => {
    const validDurationArb = fc.double({
      min: MIN_DURATION_S,
      max: MAX_DURATION_S,
      noNaN: true,
    })

    it("any duration within 150–200ms range is valid", () => {
      fc.assert(
        fc.property(validDurationArb, (duration) => {
          expect(isDurationWithinBounds(duration)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: invalid duration values are correctly rejected", () => {
    const tooShortDurationArb = fc.double({
      min: 0.001,
      max: 0.149,
      noNaN: true,
    })
    const tooLongDurationArb = fc.double({
      min: 0.201,
      max: 1.0,
      noNaN: true,
    })

    it("any duration below 150ms is invalid", () => {
      fc.assert(
        fc.property(tooShortDurationArb, (duration) => {
          expect(isDurationWithinBounds(duration)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("any duration above 200ms is invalid", () => {
      fc.assert(
        fc.property(tooLongDurationArb, (duration) => {
          expect(isDurationWithinBounds(duration)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: expand transition config is always valid", () => {
    const scenarioArb = fc.record({
      viewportWidth: fc.integer({ min: 320, max: 767 }),
      tapX: fc.integer({ min: 0, max: 400 }),
      tapY: fc.integer({ min: 0, max: 800 }),
    })

    it("expand transition satisfies all constraints for any interaction scenario", () => {
      fc.assert(
        fc.property(scenarioArb, (_scenario) => {
          expect(
            isValidExpandTransition(
              expandTransition as { duration: number; ease: string }
            )
          ).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: collapse transition config is always valid", () => {
    const scenarioArb = fc.record({
      viewportWidth: fc.integer({ min: 320, max: 767 }),
      menuOpenDuration: fc.integer({ min: 100, max: 10000 }),
    })

    it("collapse transition satisfies all constraints for any interaction scenario", () => {
      fc.assert(
        fc.property(scenarioArb, (_scenario) => {
          expect(
            isValidCollapseTransition(
              collapseTransition as { duration: number; ease: string }
            )
          ).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: incorrect easing values are detected", () => {
    const wrongEasingArb = fc.constantFrom(
      "linear",
      "ease",
      "easeInOut",
      "easeIn", // wrong for expand
      "circIn",
      "backOut"
    )

    it("expand transition with non-easeOut easing is invalid", () => {
      fc.assert(
        fc.property(wrongEasingArb, (wrongEasing) => {
          const fakeTransition = {
            duration: 0.18,
            ease: wrongEasing,
          }
          expect(isValidExpandTransition(fakeTransition)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    const wrongCollapseEasingArb = fc.constantFrom(
      "linear",
      "ease",
      "easeInOut",
      "easeOut", // wrong for collapse
      "circOut",
      "backIn"
    )

    it("collapse transition with non-easeIn easing is invalid", () => {
      fc.assert(
        fc.property(wrongCollapseEasingArb, (wrongEasing) => {
          const fakeTransition = {
            duration: 0.18,
            ease: wrongEasing,
          }
          expect(isValidCollapseTransition(fakeTransition)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })
})
