import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import {
  SECTION_ANIMATION,
  STAGGER_CHILDREN,
} from "@/components/landing/animation-config"

/**
 * Property 3: Section entrance animation configuration
 * Validates: Requirements 11.1, 11.2
 *
 * For any major section component (Hero, Philosophy, Feature Showcase, Workflow,
 * Emotional Hook, CTA), its Framer Motion entrance animation SHALL use opacity
 * transition from 0 to 1 and vertical translateY from a positive value to 0,
 * with a total duration between 300 and 800 milliseconds, and SHALL trigger only
 * once when 20% of the section enters the viewport.
 *
 * Tags: Feature: landing-page, Property 3: Section entrance animation configuration
 */

type AnimationConfig = {
  initial: { opacity: number; y: number }
  animate: { opacity: number; y: number }
  viewport: { once: boolean; amount: number }
  transition: { duration: number }
}

/**
 * Validates that an animation config meets the section entrance animation requirements.
 */
function isValidSectionAnimationConfig(config: AnimationConfig): boolean {
  return (
    config.initial.opacity === 0 &&
    config.animate.opacity === 1 &&
    config.initial.y > 0 &&
    config.animate.y === 0 &&
    config.transition.duration >= 0.3 &&
    config.transition.duration <= 0.8 &&
    config.viewport.once === true &&
    config.viewport.amount === 0.2
  )
}

describe("Feature: landing-page, Property 3: Section entrance animation configuration", () => {
  describe("SECTION_ANIMATION constant validation", () => {
    it("initial opacity is 0 (fade from invisible)", () => {
      expect(SECTION_ANIMATION.initial.opacity).toBe(0)
    })

    it("animate opacity is 1 (fade to fully visible)", () => {
      expect(SECTION_ANIMATION.animate.opacity).toBe(1)
    })

    it("initial y is positive (translateY starts below final position)", () => {
      expect(SECTION_ANIMATION.initial.y).toBeGreaterThan(0)
    })

    it("animate y is 0 (translateY ends at final position)", () => {
      expect(SECTION_ANIMATION.animate.y).toBe(0)
    })

    it("transition duration is between 300ms and 800ms (0.3-0.8s)", () => {
      expect(SECTION_ANIMATION.transition.duration).toBeGreaterThanOrEqual(0.3)
      expect(SECTION_ANIMATION.transition.duration).toBeLessThanOrEqual(0.8)
    })

    it("viewport.once is true (triggers only once)", () => {
      expect(SECTION_ANIMATION.viewport.once).toBe(true)
    })

    it("viewport.amount is 0.2 (triggers at 20% visibility)", () => {
      expect(SECTION_ANIMATION.viewport.amount).toBe(0.2)
    })
  })

  describe("STAGGER_CHILDREN item variant validation", () => {
    it("item hidden opacity is 0 (fade from invisible)", () => {
      expect(STAGGER_CHILDREN.item.hidden).toHaveProperty("opacity", 0)
    })

    it("item visible opacity is 1 (fade to fully visible)", () => {
      expect(STAGGER_CHILDREN.item.visible).toHaveProperty("opacity", 1)
    })

    it("item hidden y is positive (translateY starts below final position)", () => {
      const hidden = STAGGER_CHILDREN.item.hidden as { y: number }
      expect(hidden.y).toBeGreaterThan(0)
    })

    it("item visible y is 0 (translateY ends at final position)", () => {
      const visible = STAGGER_CHILDREN.item.visible as { y: number }
      expect(visible.y).toBe(0)
    })

    it("item transition duration is between 300ms and 800ms (0.3-0.8s)", () => {
      const visible = STAGGER_CHILDREN.item.visible as {
        transition: { duration: number }
      }
      expect(visible.transition.duration).toBeGreaterThanOrEqual(0.3)
      expect(visible.transition.duration).toBeLessThanOrEqual(0.8)
    })
  })

  describe("Property-based: validation logic correctly identifies valid/invalid configs", () => {
    const validAnimationConfigArb: fc.Arbitrary<AnimationConfig> = fc.record({
      initial: fc.record({
        opacity: fc.constant(0),
        y: fc.integer({ min: 1, max: 100 }),
      }),
      animate: fc.record({
        opacity: fc.constant(1),
        y: fc.constant(0),
      }),
      viewport: fc.record({
        once: fc.constant(true as boolean),
        amount: fc.constant(0.2),
      }),
      transition: fc.record({
        duration: fc.double({ min: 0.3, max: 0.8, noNaN: true }),
      }),
    })

    it("all valid animation configs pass validation", () => {
      fc.assert(
        fc.property(validAnimationConfigArb, (config) => {
          expect(isValidSectionAnimationConfig(config)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with non-zero initial opacity are invalid", () => {
      const invalidOpacityArb = fc.double({
        min: 0.01,
        max: 1,
        noNaN: true,
      })

      fc.assert(
        fc.property(invalidOpacityArb, (opacity) => {
          const config: AnimationConfig = {
            initial: { opacity, y: 30 },
            animate: { opacity: 1, y: 0 },
            viewport: { once: true, amount: 0.2 },
            transition: { duration: 0.6 },
          }
          expect(isValidSectionAnimationConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with non-one animate opacity are invalid", () => {
      const invalidOpacityArb = fc.double({
        min: 0,
        max: 0.99,
        noNaN: true,
      })

      fc.assert(
        fc.property(invalidOpacityArb, (opacity) => {
          const config: AnimationConfig = {
            initial: { opacity: 0, y: 30 },
            animate: { opacity, y: 0 },
            viewport: { once: true, amount: 0.2 },
            transition: { duration: 0.6 },
          }
          expect(isValidSectionAnimationConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with non-positive initial y are invalid", () => {
      const invalidYArb = fc.integer({ min: -100, max: 0 })

      fc.assert(
        fc.property(invalidYArb, (y) => {
          const config: AnimationConfig = {
            initial: { opacity: 0, y },
            animate: { opacity: 1, y: 0 },
            viewport: { once: true, amount: 0.2 },
            transition: { duration: 0.6 },
          }
          expect(isValidSectionAnimationConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with non-zero animate y are invalid", () => {
      const invalidYArb = fc
        .integer({ min: -100, max: 100 })
        .filter((y) => y !== 0)

      fc.assert(
        fc.property(invalidYArb, (y) => {
          const config: AnimationConfig = {
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y },
            viewport: { once: true, amount: 0.2 },
            transition: { duration: 0.6 },
          }
          expect(isValidSectionAnimationConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with duration outside 300-800ms range are invalid", () => {
      const tooShortArb = fc.double({ min: 0.01, max: 0.29, noNaN: true })
      const tooLongArb = fc.double({ min: 0.81, max: 5.0, noNaN: true })
      const invalidDurationArb = fc.oneof(tooShortArb, tooLongArb)

      fc.assert(
        fc.property(invalidDurationArb, (duration) => {
          const config: AnimationConfig = {
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            viewport: { once: true, amount: 0.2 },
            transition: { duration },
          }
          expect(isValidSectionAnimationConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with viewport.once=false are invalid", () => {
      fc.assert(
        fc.property(fc.constant(false), (once) => {
          const config: AnimationConfig = {
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            viewport: { once, amount: 0.2 },
            transition: { duration: 0.6 },
          }
          expect(isValidSectionAnimationConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with viewport.amount != 0.2 are invalid", () => {
      const invalidAmountArb = fc
        .double({ min: 0, max: 1, noNaN: true })
        .filter((a) => Math.abs(a - 0.2) > 0.001)

      fc.assert(
        fc.property(invalidAmountArb, (amount) => {
          const config: AnimationConfig = {
            initial: { opacity: 0, y: 30 },
            animate: { opacity: 1, y: 0 },
            viewport: { once: true, amount },
            transition: { duration: 0.6 },
          }
          expect(isValidSectionAnimationConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("the actual SECTION_ANIMATION config passes validation", () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          expect(
            isValidSectionAnimationConfig(
              SECTION_ANIMATION as unknown as AnimationConfig
            )
          ).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })
})
