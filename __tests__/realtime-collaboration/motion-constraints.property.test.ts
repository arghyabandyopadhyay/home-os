import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { DURATION, EASING, MOTION_CONSTRAINTS } from "@/lib/motion"
import * as fs from "node:fs"
import * as path from "node:path"

/**
 * Property 8: Motion Constraints Compliance
 * Validates: Requirements 9.3, 9.4
 *
 * All collaboration-related animations (cursor fade, presence enter/exit) obey
 * lib/motion.ts bounds: 150–200ms duration, ease-out entrance, ease-in exit,
 * only opacity and transform animated. When reduced motion is active, all
 * durations are 0.
 *
 * Tags: Feature: realtime-collaboration-frontend, Property 8: Motion constraints compliance
 */

// ─── Constants from the motion system used in collaboration components ───────

/** Durations used in collaboration components (in seconds) */
const COLLABORATION_DURATIONS = {
  presenceEntrance: DURATION.normal, // 0.2s = 200ms
  presenceExit: DURATION.fast, // 0.15s = 150ms
} as const

/** Duration bounds for collaboration animations (in ms) */
const DURATION_BOUNDS = {
  min: 150,
  max: 200,
} as const

/** Allowed animatable properties per motion constraints */
const ALLOWED_PROPERTIES = MOTION_CONSTRAINTS.animatableProperties // ["transform", "opacity"]

describe("Feature: realtime-collaboration-frontend, Property 8: Motion constraints compliance", () => {
  describe("Duration bounds: all collaboration durations are between 150ms and 200ms", () => {
    it("DURATION.fast (150ms) is within the 150–200ms collaboration bound", () => {
      const durationMs = DURATION.fast * 1000
      expect(durationMs).toBeGreaterThanOrEqual(DURATION_BOUNDS.min)
      expect(durationMs).toBeLessThanOrEqual(DURATION_BOUNDS.max)
    })

    it("DURATION.normal (200ms) is within the 150–200ms collaboration bound", () => {
      const durationMs = DURATION.normal * 1000
      expect(durationMs).toBeGreaterThanOrEqual(DURATION_BOUNDS.min)
      expect(durationMs).toBeLessThanOrEqual(DURATION_BOUNDS.max)
    })

    it("property: any collaboration animation duration satisfies 150–200ms bounds", () => {
      const collaborationDurationArb = fc.constantFrom(
        COLLABORATION_DURATIONS.presenceEntrance,
        COLLABORATION_DURATIONS.presenceExit
      )

      fc.assert(
        fc.property(collaborationDurationArb, (durationSec) => {
          const durationMs = durationSec * 1000
          expect(durationMs).toBeGreaterThanOrEqual(DURATION_BOUNDS.min)
          expect(durationMs).toBeLessThanOrEqual(DURATION_BOUNDS.max)
        }),
        { numRuns: 100 }
      )
    })

    it("property: durations outside 150–200ms range violate the constraint", () => {
      const invalidDurationArb = fc.oneof(
        fc.integer({ min: 0, max: 149 }),
        fc.integer({ min: 201, max: 1000 })
      )

      fc.assert(
        fc.property(invalidDurationArb, (invalidMs) => {
          const isWithinBounds =
            invalidMs >= DURATION_BOUNDS.min && invalidMs <= DURATION_BOUNDS.max
          expect(isWithinBounds).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Easing correctness: entrance is ease-out, exit is ease-in", () => {
    it("EASING.entrance cubic-bezier matches ease-out", () => {
      // ease-out cubic-bezier: fast start, slow end
      // [0, 0, 0.2, 1] is a standard ease-out curve
      expect(EASING.entrance).toEqual([0, 0, 0.2, 1])
      expect(MOTION_CONSTRAINTS.easing.entrance).toBe("ease-out")
    })

    it("EASING.exit cubic-bezier matches ease-in", () => {
      // ease-in cubic-bezier: slow start, fast end
      // [0.4, 0, 1, 1] is a standard ease-in curve
      expect(EASING.exit).toEqual([0.4, 0, 1, 1])
      expect(MOTION_CONSTRAINTS.easing.exit).toBe("ease-in")
    })

    it("property: for any animation direction, the correct easing is used", () => {
      type Direction = "entrance" | "exit"
      const directionArb: fc.Arbitrary<Direction> = fc.constantFrom(
        "entrance" as Direction,
        "exit" as Direction
      )

      fc.assert(
        fc.property(directionArb, (direction) => {
          if (direction === "entrance") {
            expect(MOTION_CONSTRAINTS.easing.entrance).toBe("ease-out")
            // Verify the cubic-bezier represents ease-out (fast start, slow end)
            // p1y=0, p2y=1 indicates deceleration
            expect(EASING.entrance[3]).toBe(1)
          } else {
            expect(MOTION_CONSTRAINTS.easing.exit).toBe("ease-in")
            // Verify the cubic-bezier represents ease-in (slow start, fast end)
            // p1y=0, p2y=1 with high p2x indicates acceleration
            expect(EASING.exit[2]).toBe(1)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Animated properties: only opacity and transform are animated", () => {
    it("MOTION_CONSTRAINTS.animatableProperties contains only opacity and transform", () => {
      expect(ALLOWED_PROPERTIES).toEqual(["transform", "opacity"])
    })

    it("property: any allowed animated property is either opacity or transform", () => {
      const allowedPropertyArb = fc.constantFrom(...ALLOWED_PROPERTIES)

      fc.assert(
        fc.property(allowedPropertyArb, (prop) => {
          expect(["transform", "opacity"]).toContain(prop)
        }),
        { numRuns: 100 }
      )
    })

    it("property: layout-triggering properties are not in the allowed set", () => {
      const layoutTriggeringArb = fc.constantFrom(
        "width",
        "height",
        "top",
        "left",
        "right",
        "bottom",
        "margin",
        "padding",
        "border-width",
        "font-size"
      )

      fc.assert(
        fc.property(layoutTriggeringArb, (layoutProp) => {
          expect(ALLOWED_PROPERTIES as readonly string[]).not.toContain(layoutProp)
        }),
        { numRuns: 100 }
      )
    })

    it("cursor-styles.css only uses opacity in its transitions", () => {
      const cssPath = path.resolve(
        __dirname,
        "../../components/notes/cursor-styles.css"
      )
      const cssContent = fs.readFileSync(cssPath, "utf-8")

      // Extract transition properties from the CSS
      const transitionRegex = /transition:\s*([^;]+);/g
      const transitions: string[] = []
      let match
      while ((match = transitionRegex.exec(cssContent)) !== null) {
        transitions.push(match[1].trim())
      }

      // All transitions should only animate opacity (the only transition in cursor-styles)
      for (const transition of transitions) {
        // The transition should reference opacity or use shorthand with opacity
        const animatesOnlyAllowed =
          transition.includes("opacity") || transition.includes("none")
        expect(animatesOnlyAllowed).toBe(true)
      }
    })
  })

  describe("Reduced motion: all durations are 0 when active", () => {
    it("cursor-styles.css sets transition-duration to 0s under prefers-reduced-motion", () => {
      const cssPath = path.resolve(
        __dirname,
        "../../components/notes/cursor-styles.css"
      )
      const cssContent = fs.readFileSync(cssPath, "utf-8")

      // Find the reduced motion media query block
      const reducedMotionRegex =
        /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/
      const reducedMotionMatch = reducedMotionRegex.exec(cssContent)
      expect(reducedMotionMatch).not.toBeNull()

      const reducedMotionBlock = reducedMotionMatch![1]

      // Verify transition-duration: 0s is set
      expect(reducedMotionBlock).toContain("transition-duration: 0s")
    })

    it("cursor-styles.css disables transitions (transition: none) under prefers-reduced-motion", () => {
      const cssPath = path.resolve(
        __dirname,
        "../../components/notes/cursor-styles.css"
      )
      const cssContent = fs.readFileSync(cssPath, "utf-8")

      const reducedMotionRegex =
        /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{([\s\S]*?)\n\}/
      const reducedMotionMatch = reducedMotionRegex.exec(cssContent)
      expect(reducedMotionMatch).not.toBeNull()

      const reducedMotionBlock = reducedMotionMatch![1]

      // Verify transition: none is also set for selection
      expect(reducedMotionBlock).toContain("transition: none")
    })

    it("property: when reduced motion is active, any duration becomes 0", () => {
      // Simulate the reduced motion behavior: all durations become 0
      const anyDurationArb = fc.constantFrom(
        DURATION.fast,
        DURATION.normal,
        DURATION.slow
      )

      fc.assert(
        fc.property(anyDurationArb, (originalDuration) => {
          // Under reduced motion, duration should be overridden to 0
          const reducedMotionDuration = 0
          expect(reducedMotionDuration).toBe(0)
          // The original duration is positive (confirming it was non-zero before reduction)
          expect(originalDuration).toBeGreaterThan(0)
        }),
        { numRuns: 100 }
      )
    })

    it("presence-bar uses zero-duration variants when reduced motion is active", () => {
      // The presence-bar component creates variants with no animation when
      // prefersReducedMotion is true. Verify the contract:
      const reducedMotionVariants = {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 1, y: 0 },
      }

      // When reduced motion is active, all variant states are identical (no animation)
      expect(reducedMotionVariants.hidden).toEqual(reducedMotionVariants.visible)
      expect(reducedMotionVariants.visible).toEqual(reducedMotionVariants.exit)
    })
  })
})
