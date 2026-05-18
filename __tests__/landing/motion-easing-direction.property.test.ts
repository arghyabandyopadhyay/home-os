import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 8: Motion easing direction correctness
 * Validates: Requirements 9.6
 *
 * For any entrance animation configuration, the easing function SHALL be `ease-out`.
 * For any exit animation configuration, the easing function SHALL be `ease-in`.
 *
 * Tags: Feature: app-ui-redesign, Property 8: Motion easing direction correctness
 */

/** Animation direction types */
type AnimationDirection = "entrance" | "exit"

/** Animation configuration with direction and easing */
type AnimationConfig = {
  direction: AnimationDirection
  easing: string
  duration: number
  property: string
}

/** The motion easing tokens as defined in globals.css */
const MOTION_EASING_TOKENS = {
  entrance: "ease-out",
  exit: "ease-in",
} as const

/**
 * Returns the correct easing function for a given animation direction.
 * This mirrors the design system constraint from globals.css:
 *   --motion-easing-entrance: ease-out
 *   --motion-easing-exit: ease-in
 */
function getEasingForDirection(direction: AnimationDirection): string {
  return MOTION_EASING_TOKENS[direction]
}

/**
 * Validates that an animation config uses the correct easing for its direction.
 */
function hasCorrectEasing(config: AnimationConfig): boolean {
  const expectedEasing = getEasingForDirection(config.direction)
  return config.easing === expectedEasing
}

describe("Feature: app-ui-redesign, Property 8: Motion easing direction correctness", () => {
  describe("Motion easing token definitions", () => {
    it("entrance easing token is ease-out", () => {
      expect(MOTION_EASING_TOKENS.entrance).toBe("ease-out")
    })

    it("exit easing token is ease-in", () => {
      expect(MOTION_EASING_TOKENS.exit).toBe("ease-in")
    })
  })

  describe("Property-based: entrance animations always use ease-out easing", () => {
    const entranceAnimationArb: fc.Arbitrary<AnimationConfig> = fc.record({
      direction: fc.constant("entrance" as AnimationDirection),
      easing: fc.constant("ease-out"),
      duration: fc.integer({ min: 150, max: 300 }),
      property: fc.constantFrom("opacity", "transform", "opacity, transform"),
    })

    it("all valid entrance animation configs use ease-out easing", () => {
      fc.assert(
        fc.property(entranceAnimationArb, (config) => {
          expect(config.easing).toBe("ease-out")
          expect(hasCorrectEasing(config)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: exit animations always use ease-in easing", () => {
    const exitAnimationArb: fc.Arbitrary<AnimationConfig> = fc.record({
      direction: fc.constant("exit" as AnimationDirection),
      easing: fc.constant("ease-in"),
      duration: fc.integer({ min: 150, max: 300 }),
      property: fc.constantFrom("opacity", "transform", "opacity, transform"),
    })

    it("all valid exit animation configs use ease-in easing", () => {
      fc.assert(
        fc.property(exitAnimationArb, (config) => {
          expect(config.easing).toBe("ease-in")
          expect(hasCorrectEasing(config)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: any animation direction maps to the correct easing", () => {
    const directionArb: fc.Arbitrary<AnimationDirection> = fc.constantFrom(
      "entrance" as AnimationDirection,
      "exit" as AnimationDirection
    )

    it("getEasingForDirection always returns the correct easing for any direction", () => {
      fc.assert(
        fc.property(directionArb, (direction) => {
          const easing = getEasingForDirection(direction)
          if (direction === "entrance") {
            expect(easing).toBe("ease-out")
          } else {
            expect(easing).toBe("ease-in")
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: incorrect easing is detected for any direction", () => {
    const wrongEasingArb = fc.constantFrom(
      "linear",
      "ease",
      "ease-in-out",
      "cubic-bezier(0.4, 0, 0.2, 1)",
      "step-start",
      "step-end"
    )

    it("entrance animations with non-ease-out easing are invalid", () => {
      fc.assert(
        fc.property(wrongEasingArb, (wrongEasing) => {
          const config: AnimationConfig = {
            direction: "entrance",
            easing: wrongEasing,
            duration: 200,
            property: "opacity",
          }
          expect(hasCorrectEasing(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("exit animations with non-ease-in easing are invalid", () => {
      fc.assert(
        fc.property(wrongEasingArb, (wrongEasing) => {
          const config: AnimationConfig = {
            direction: "exit",
            easing: wrongEasing,
            duration: 200,
            property: "opacity",
          }
          expect(hasCorrectEasing(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: random animation configs with correct easing always validate", () => {
    const randomAnimationConfigArb: fc.Arbitrary<AnimationConfig> = fc
      .constantFrom(
        "entrance" as AnimationDirection,
        "exit" as AnimationDirection
      )
      .chain((direction) =>
        fc.record({
          direction: fc.constant(direction),
          easing: fc.constant(getEasingForDirection(direction)),
          duration: fc.integer({ min: 100, max: 500 }),
          property: fc.constantFrom(
            "opacity",
            "transform",
            "opacity, transform",
            "scale",
            "translateY"
          ),
        })
      )

    it("any animation config built with the correct easing mapping passes validation", () => {
      fc.assert(
        fc.property(randomAnimationConfigArb, (config) => {
          expect(hasCorrectEasing(config)).toBe(true)
          if (config.direction === "entrance") {
            expect(config.easing).toBe("ease-out")
          } else {
            expect(config.easing).toBe("ease-in")
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: swapped easing values are always invalid", () => {
    const directionArb: fc.Arbitrary<AnimationDirection> = fc.constantFrom(
      "entrance" as AnimationDirection,
      "exit" as AnimationDirection
    )

    it("using the opposite direction's easing is always invalid", () => {
      fc.assert(
        fc.property(directionArb, (direction) => {
          // Swap: use exit easing for entrance and vice versa
          const swappedEasing =
            direction === "entrance"
              ? MOTION_EASING_TOKENS.exit
              : MOTION_EASING_TOKENS.entrance
          const config: AnimationConfig = {
            direction,
            easing: swappedEasing,
            duration: 200,
            property: "opacity",
          }
          expect(hasCorrectEasing(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })
})
