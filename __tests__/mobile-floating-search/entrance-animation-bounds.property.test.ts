import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import {
  entranceVariants,
  entranceTransition,
} from "@/components/layout/floating-search-bar"

/**
 * Property 4: Entrance animation config within bounds
 * **Validates: Requirements 6.1**
 *
 * For any entrance animation config used by the FloatingSearchBar, the initial
 * state must have opacity 0 and translateY of 12px, the final state must have
 * opacity 1 and translateY of 0px, the duration must be between 150ms and 300ms
 * inclusive, and the easing must be ease-out.
 *
 * Tags: Feature: mobile-floating-search, Property 4: Entrance animation config within bounds
 */

type EntranceConfig = {
  hidden: { opacity: number; y: number }
  visible: { opacity: number; y: number }
  duration: number
  ease: string
}

/**
 * Validates that an entrance animation config meets the requirements.
 */
function isValidEntranceConfig(config: EntranceConfig): boolean {
  return (
    config.hidden.opacity === 0 &&
    config.hidden.y === 12 &&
    config.visible.opacity === 1 &&
    config.visible.y === 0 &&
    config.duration >= 0.15 &&
    config.duration <= 0.3 &&
    config.ease === "easeOut"
  )
}

describe("Feature: mobile-floating-search, Property 4: Entrance animation config within bounds", () => {
  describe("entranceVariants constant validation", () => {
    it("hidden state has opacity 0", () => {
      const hidden = entranceVariants.hidden as { opacity: number }
      expect(hidden.opacity).toBe(0)
    })

    it("hidden state has y (translateY) of 12", () => {
      const hidden = entranceVariants.hidden as { y: number }
      expect(hidden.y).toBe(12)
    })

    it("visible state has opacity 1", () => {
      const visible = entranceVariants.visible as { opacity: number }
      expect(visible.opacity).toBe(1)
    })

    it("visible state has y (translateY) of 0", () => {
      const visible = entranceVariants.visible as { y: number }
      expect(visible.y).toBe(0)
    })
  })

  describe("entranceTransition constant validation", () => {
    it("duration is between 150ms and 300ms (0.15-0.3s)", () => {
      const transition = entranceTransition as { duration: number }
      expect(transition.duration).toBeGreaterThanOrEqual(0.15)
      expect(transition.duration).toBeLessThanOrEqual(0.3)
    })

    it("easing is ease-out", () => {
      const transition = entranceTransition as { ease: string }
      expect(transition.ease).toBe("easeOut")
    })
  })

  describe("Property-based: validation logic correctly identifies valid/invalid configs", () => {
    const validEntranceConfigArb: fc.Arbitrary<EntranceConfig> = fc.record({
      hidden: fc.record({
        opacity: fc.constant(0),
        y: fc.constant(12),
      }),
      visible: fc.record({
        opacity: fc.constant(1),
        y: fc.constant(0),
      }),
      duration: fc.double({ min: 0.15, max: 0.3, noNaN: true }),
      ease: fc.constant("easeOut"),
    })

    it("all valid entrance configs pass validation", () => {
      fc.assert(
        fc.property(validEntranceConfigArb, (config) => {
          expect(isValidEntranceConfig(config)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with non-zero hidden opacity are invalid", () => {
      const invalidOpacityArb = fc.double({
        min: 0.01,
        max: 1,
        noNaN: true,
      })

      fc.assert(
        fc.property(invalidOpacityArb, (opacity) => {
          const config: EntranceConfig = {
            hidden: { opacity, y: 12 },
            visible: { opacity: 1, y: 0 },
            duration: 0.2,
            ease: "easeOut",
          }
          expect(isValidEntranceConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with hidden y != 12 are invalid", () => {
      const invalidYArb = fc
        .integer({ min: -50, max: 50 })
        .filter((y) => y !== 12)

      fc.assert(
        fc.property(invalidYArb, (y) => {
          const config: EntranceConfig = {
            hidden: { opacity: 0, y },
            visible: { opacity: 1, y: 0 },
            duration: 0.2,
            ease: "easeOut",
          }
          expect(isValidEntranceConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with non-one visible opacity are invalid", () => {
      const invalidOpacityArb = fc.double({
        min: 0,
        max: 0.99,
        noNaN: true,
      })

      fc.assert(
        fc.property(invalidOpacityArb, (opacity) => {
          const config: EntranceConfig = {
            hidden: { opacity: 0, y: 12 },
            visible: { opacity, y: 0 },
            duration: 0.2,
            ease: "easeOut",
          }
          expect(isValidEntranceConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with non-zero visible y are invalid", () => {
      const invalidYArb = fc
        .integer({ min: -50, max: 50 })
        .filter((y) => y !== 0)

      fc.assert(
        fc.property(invalidYArb, (y) => {
          const config: EntranceConfig = {
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y },
            duration: 0.2,
            ease: "easeOut",
          }
          expect(isValidEntranceConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with duration outside 150-300ms range are invalid", () => {
      const tooShortArb = fc.double({ min: 0.01, max: 0.14, noNaN: true })
      const tooLongArb = fc.double({ min: 0.31, max: 2.0, noNaN: true })
      const invalidDurationArb = fc.oneof(tooShortArb, tooLongArb)

      fc.assert(
        fc.property(invalidDurationArb, (duration) => {
          const config: EntranceConfig = {
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0 },
            duration,
            ease: "easeOut",
          }
          expect(isValidEntranceConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with non-easeOut easing are invalid", () => {
      const invalidEaseArb = fc
        .constantFrom("easeIn", "easeInOut", "linear", "spring")

      fc.assert(
        fc.property(invalidEaseArb, (ease) => {
          const config: EntranceConfig = {
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0 },
            duration: 0.2,
            ease,
          }
          expect(isValidEntranceConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("the actual entrance config passes validation", () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const config: EntranceConfig = {
            hidden: entranceVariants.hidden as { opacity: number; y: number },
            visible: entranceVariants.visible as { opacity: number; y: number },
            duration: (entranceTransition as { duration: number }).duration,
            ease: (entranceTransition as { ease: string }).ease,
          }
          expect(isValidEntranceConfig(config)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })
})
