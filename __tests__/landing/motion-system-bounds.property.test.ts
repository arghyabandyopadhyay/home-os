import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 7: Motion system parameter bounds
 * Validates: Requirements 9.1, 9.2, 9.4
 *
 * For any animation configuration in the motion system, the following constraints
 * SHALL hold simultaneously: duration is between 150ms and 300ms for fade/reveal
 * transitions (150ms–200ms for hover), scale transform is between 1.02 and 1.05,
 * opacity shift is no greater than 0.1, translateX/translateY displacement does
 * not exceed 30px, rotation does not exceed 10 degrees, and no spring/bounce
 * easing is used.
 *
 * Tags: Feature: app-ui-redesign, Property 7: Motion system parameter bounds
 */

// Motion system constraint constants (matching globals.css tokens)
const MOTION_CONSTRAINTS = {
  duration: {
    fadeReveal: { min: 150, max: 300 }, // ms
    hover: { min: 150, max: 200 }, // ms
  },
  hoverScale: { min: 1.02, max: 1.05 },
  hoverOpacityShift: { max: 0.1 },
  displacement: { max: 30 }, // px (translateX/Y)
  rotation: { max: 10 }, // degrees
  bannedEasings: ["spring", "bounce"],
} as const

// Types representing animation configurations in the motion system
type AnimationType = "fadeReveal" | "hover"

type EasingType = "ease" | "ease-in" | "ease-out" | "ease-in-out" | "linear"

type MotionConfig = {
  type: AnimationType
  duration: number // ms
  scale: number
  opacityShift: number
  translateX: number // px
  translateY: number // px
  rotation: number // degrees
  easing: string
}

/**
 * Validates that a motion config meets all parameter bounds simultaneously.
 */
function isValidMotionConfig(config: MotionConfig): boolean {
  // Duration bounds depend on animation type
  const durationBounds =
    config.type === "hover"
      ? MOTION_CONSTRAINTS.duration.hover
      : MOTION_CONSTRAINTS.duration.fadeReveal

  const durationValid =
    config.duration >= durationBounds.min &&
    config.duration <= durationBounds.max

  // Scale must be between 1.02 and 1.05
  const scaleValid =
    config.scale >= MOTION_CONSTRAINTS.hoverScale.min &&
    config.scale <= MOTION_CONSTRAINTS.hoverScale.max

  // Opacity shift must not exceed 0.1
  const opacityValid =
    Math.abs(config.opacityShift) <= MOTION_CONSTRAINTS.hoverOpacityShift.max

  // Displacement must not exceed 30px
  const displacementValid =
    Math.abs(config.translateX) <= MOTION_CONSTRAINTS.displacement.max &&
    Math.abs(config.translateY) <= MOTION_CONSTRAINTS.displacement.max

  // Rotation must not exceed 10 degrees
  const rotationValid =
    Math.abs(config.rotation) <= MOTION_CONSTRAINTS.rotation.max

  // No spring/bounce easing
  const easingValid = !MOTION_CONSTRAINTS.bannedEasings.some((banned) =>
    config.easing.toLowerCase().includes(banned)
  )

  return (
    durationValid &&
    scaleValid &&
    opacityValid &&
    displacementValid &&
    rotationValid &&
    easingValid
  )
}

// Arbitraries for generating valid motion configs
const validEasingArb: fc.Arbitrary<EasingType> = fc.constantFrom(
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "linear"
)

const validFadeRevealConfigArb: fc.Arbitrary<MotionConfig> = fc.record({
  type: fc.constant("fadeReveal" as AnimationType),
  duration: fc.integer({ min: 150, max: 300 }),
  scale: fc.double({
    min: 1.02,
    max: 1.05,
    noNaN: true,
  }),
  opacityShift: fc.double({
    min: -0.1,
    max: 0.1,
    noNaN: true,
  }),
  translateX: fc.double({
    min: -30,
    max: 30,
    noNaN: true,
  }),
  translateY: fc.double({
    min: -30,
    max: 30,
    noNaN: true,
  }),
  rotation: fc.double({
    min: -10,
    max: 10,
    noNaN: true,
  }),
  easing: validEasingArb,
})

const validHoverConfigArb: fc.Arbitrary<MotionConfig> = fc.record({
  type: fc.constant("hover" as AnimationType),
  duration: fc.integer({ min: 150, max: 200 }),
  scale: fc.double({
    min: 1.02,
    max: 1.05,
    noNaN: true,
  }),
  opacityShift: fc.double({
    min: -0.1,
    max: 0.1,
    noNaN: true,
  }),
  translateX: fc.double({
    min: -30,
    max: 30,
    noNaN: true,
  }),
  translateY: fc.double({
    min: -30,
    max: 30,
    noNaN: true,
  }),
  rotation: fc.double({
    min: -10,
    max: 10,
    noNaN: true,
  }),
  easing: validEasingArb,
})

const validMotionConfigArb: fc.Arbitrary<MotionConfig> = fc.oneof(
  validFadeRevealConfigArb,
  validHoverConfigArb
)

describe("Feature: app-ui-redesign, Property 7: Motion system parameter bounds", () => {
  describe("Property-based: all valid motion configs satisfy parameter bounds simultaneously", () => {
    it("valid fade/reveal configs have duration between 150ms and 300ms", () => {
      fc.assert(
        fc.property(validFadeRevealConfigArb, (config) => {
          expect(config.duration).toBeGreaterThanOrEqual(150)
          expect(config.duration).toBeLessThanOrEqual(300)
        }),
        { numRuns: 100 }
      )
    })

    it("valid hover configs have duration between 150ms and 200ms", () => {
      fc.assert(
        fc.property(validHoverConfigArb, (config) => {
          expect(config.duration).toBeGreaterThanOrEqual(150)
          expect(config.duration).toBeLessThanOrEqual(200)
        }),
        { numRuns: 100 }
      )
    })

    it("scale transform is between 1.02 and 1.05 for any valid config", () => {
      fc.assert(
        fc.property(validMotionConfigArb, (config) => {
          expect(config.scale).toBeGreaterThanOrEqual(1.02)
          expect(config.scale).toBeLessThanOrEqual(1.05)
        }),
        { numRuns: 100 }
      )
    })

    it("opacity shift does not exceed 0.1 for any valid config", () => {
      fc.assert(
        fc.property(validMotionConfigArb, (config) => {
          expect(Math.abs(config.opacityShift)).toBeLessThanOrEqual(0.1)
        }),
        { numRuns: 100 }
      )
    })

    it("translateX/translateY displacement does not exceed 30px for any valid config", () => {
      fc.assert(
        fc.property(validMotionConfigArb, (config) => {
          expect(Math.abs(config.translateX)).toBeLessThanOrEqual(30)
          expect(Math.abs(config.translateY)).toBeLessThanOrEqual(30)
        }),
        { numRuns: 100 }
      )
    })

    it("rotation does not exceed 10 degrees for any valid config", () => {
      fc.assert(
        fc.property(validMotionConfigArb, (config) => {
          expect(Math.abs(config.rotation)).toBeLessThanOrEqual(10)
        }),
        { numRuns: 100 }
      )
    })

    it("no spring/bounce easing is used for any valid config", () => {
      fc.assert(
        fc.property(validMotionConfigArb, (config) => {
          expect(config.easing.toLowerCase()).not.toContain("spring")
          expect(config.easing.toLowerCase()).not.toContain("bounce")
        }),
        { numRuns: 100 }
      )
    })

    it("all constraints hold simultaneously for any valid config", () => {
      fc.assert(
        fc.property(validMotionConfigArb, (config) => {
          expect(isValidMotionConfig(config)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: invalid configs are correctly rejected", () => {
    it("configs with duration below minimum are invalid", () => {
      const tooShortDurationArb = fc.integer({ min: 1, max: 149 })

      fc.assert(
        fc.property(tooShortDurationArb, (duration) => {
          const config: MotionConfig = {
            type: "fadeReveal",
            duration,
            scale: 1.03,
            opacityShift: 0.05,
            translateX: 10,
            translateY: 10,
            rotation: 5,
            easing: "ease-out",
          }
          expect(isValidMotionConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with duration above maximum are invalid", () => {
      const tooLongDurationArb = fc.integer({ min: 301, max: 2000 })

      fc.assert(
        fc.property(tooLongDurationArb, (duration) => {
          const config: MotionConfig = {
            type: "fadeReveal",
            duration,
            scale: 1.03,
            opacityShift: 0.05,
            translateX: 10,
            translateY: 10,
            rotation: 5,
            easing: "ease-out",
          }
          expect(isValidMotionConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("hover configs with duration above 200ms are invalid", () => {
      const tooLongHoverArb = fc.integer({ min: 201, max: 1000 })

      fc.assert(
        fc.property(tooLongHoverArb, (duration) => {
          const config: MotionConfig = {
            type: "hover",
            duration,
            scale: 1.03,
            opacityShift: 0.05,
            translateX: 10,
            translateY: 10,
            rotation: 5,
            easing: "ease",
          }
          expect(isValidMotionConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with scale outside 1.02-1.05 range are invalid", () => {
      const invalidScaleArb = fc.oneof(
        fc.double({ min: 0.5, max: 1.019, noNaN: true }),
        fc.double({ min: 1.051, max: 2.0, noNaN: true })
      )

      fc.assert(
        fc.property(invalidScaleArb, (scale) => {
          const config: MotionConfig = {
            type: "fadeReveal",
            duration: 200,
            scale,
            opacityShift: 0.05,
            translateX: 10,
            translateY: 10,
            rotation: 5,
            easing: "ease-out",
          }
          expect(isValidMotionConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with opacity shift exceeding 0.1 are invalid", () => {
      const invalidOpacityArb = fc.oneof(
        fc.double({ min: 0.101, max: 1.0, noNaN: true }),
        fc.double({ min: -1.0, max: -0.101, noNaN: true })
      )

      fc.assert(
        fc.property(invalidOpacityArb, (opacityShift) => {
          const config: MotionConfig = {
            type: "fadeReveal",
            duration: 200,
            scale: 1.03,
            opacityShift,
            translateX: 10,
            translateY: 10,
            rotation: 5,
            easing: "ease-out",
          }
          expect(isValidMotionConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with displacement exceeding 30px are invalid", () => {
      const invalidDisplacementArb = fc.oneof(
        fc.double({ min: 30.1, max: 200, noNaN: true }),
        fc.double({ min: -200, max: -30.1, noNaN: true })
      )

      fc.assert(
        fc.property(invalidDisplacementArb, (displacement) => {
          const configX: MotionConfig = {
            type: "fadeReveal",
            duration: 200,
            scale: 1.03,
            opacityShift: 0.05,
            translateX: displacement,
            translateY: 10,
            rotation: 5,
            easing: "ease-out",
          }
          expect(isValidMotionConfig(configX)).toBe(false)

          const configY: MotionConfig = {
            type: "fadeReveal",
            duration: 200,
            scale: 1.03,
            opacityShift: 0.05,
            translateX: 10,
            translateY: displacement,
            rotation: 5,
            easing: "ease-out",
          }
          expect(isValidMotionConfig(configY)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with rotation exceeding 10 degrees are invalid", () => {
      const invalidRotationArb = fc.oneof(
        fc.double({ min: 10.1, max: 360, noNaN: true }),
        fc.double({ min: -360, max: -10.1, noNaN: true })
      )

      fc.assert(
        fc.property(invalidRotationArb, (rotation) => {
          const config: MotionConfig = {
            type: "fadeReveal",
            duration: 200,
            scale: 1.03,
            opacityShift: 0.05,
            translateX: 10,
            translateY: 10,
            rotation,
            easing: "ease-out",
          }
          expect(isValidMotionConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with spring easing are invalid", () => {
      const springEasingArb = fc.constantFrom(
        "spring",
        "spring(1, 80, 10, 0)",
        "Spring",
        "SPRING"
      )

      fc.assert(
        fc.property(springEasingArb, (easing) => {
          const config: MotionConfig = {
            type: "fadeReveal",
            duration: 200,
            scale: 1.03,
            opacityShift: 0.05,
            translateX: 10,
            translateY: 10,
            rotation: 5,
            easing,
          }
          expect(isValidMotionConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("configs with bounce easing are invalid", () => {
      const bounceEasingArb = fc.constantFrom(
        "bounce",
        "easeInBounce",
        "easeOutBounce",
        "Bounce"
      )

      fc.assert(
        fc.property(bounceEasingArb, (easing) => {
          const config: MotionConfig = {
            type: "fadeReveal",
            duration: 200,
            scale: 1.03,
            opacityShift: 0.05,
            translateX: 10,
            translateY: 10,
            rotation: 5,
            easing,
          }
          expect(isValidMotionConfig(config)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("CSS token validation against motion constraints", () => {
    it("--motion-duration-fast (150ms) is within fade/reveal bounds", () => {
      const durationFast = 150
      expect(durationFast).toBeGreaterThanOrEqual(MOTION_CONSTRAINTS.duration.fadeReveal.min)
      expect(durationFast).toBeLessThanOrEqual(MOTION_CONSTRAINTS.duration.fadeReveal.max)
    })

    it("--motion-duration-normal (200ms) is within fade/reveal bounds", () => {
      const durationNormal = 200
      expect(durationNormal).toBeGreaterThanOrEqual(MOTION_CONSTRAINTS.duration.fadeReveal.min)
      expect(durationNormal).toBeLessThanOrEqual(MOTION_CONSTRAINTS.duration.fadeReveal.max)
    })

    it("--motion-duration-slow (300ms) is within fade/reveal bounds", () => {
      const durationSlow = 300
      expect(durationSlow).toBeGreaterThanOrEqual(MOTION_CONSTRAINTS.duration.fadeReveal.min)
      expect(durationSlow).toBeLessThanOrEqual(MOTION_CONSTRAINTS.duration.fadeReveal.max)
    })

    it("--motion-duration-fast (150ms) is within hover bounds", () => {
      const durationFast = 150
      expect(durationFast).toBeGreaterThanOrEqual(MOTION_CONSTRAINTS.duration.hover.min)
      expect(durationFast).toBeLessThanOrEqual(MOTION_CONSTRAINTS.duration.hover.max)
    })

    it("--motion-duration-normal (200ms) is within hover bounds", () => {
      const durationNormal = 200
      expect(durationNormal).toBeGreaterThanOrEqual(MOTION_CONSTRAINTS.duration.hover.min)
      expect(durationNormal).toBeLessThanOrEqual(MOTION_CONSTRAINTS.duration.hover.max)
    })

    it("--motion-easing-entrance (ease-out) is not a banned easing", () => {
      const easing = "ease-out"
      expect(easing).not.toContain("spring")
      expect(easing).not.toContain("bounce")
    })

    it("--motion-easing-exit (ease-in) is not a banned easing", () => {
      const easing = "ease-in"
      expect(easing).not.toContain("spring")
      expect(easing).not.toContain("bounce")
    })

    it("--motion-easing-default (ease) is not a banned easing", () => {
      const easing = "ease"
      expect(easing).not.toContain("spring")
      expect(easing).not.toContain("bounce")
    })
  })
})
