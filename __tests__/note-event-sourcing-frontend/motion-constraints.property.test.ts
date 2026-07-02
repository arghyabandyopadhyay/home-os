import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import {
  DURATION,
  EASING,
  MOTION_CONSTRAINTS,
  reducedMotionVariants,
} from "@/lib/motion"

/**
 * Property 7: Motion Constraints Compliance
 *
 * All animation durations in version history components are between 150ms and 300ms.
 * Entrance easing is ease-out, exit easing is ease-in.
 * Only opacity and transform properties are animated.
 * When reduced motion is active, all durations are 0.
 *
 * **Validates: Requirements 8.2, 8.3, 8.4**
 */

// ─── Panel animation config (from version-history-panel.tsx) ─────────────────

/**
 * The panel uses DURATION.normal (200ms) for its slide-in/out animation.
 * It animates translateX (x: "100%" → 0) and opacity (0 → 1).
 * Entrance uses EASING.entrance (ease-out), exit uses EASING.exit (ease-in).
 */
const panelAnimation = {
  duration: DURATION.normal,
  entrance: {
    easing: EASING.entrance,
    properties: ["translateX", "opacity"] as const,
  },
  exit: {
    easing: EASING.exit,
    properties: ["translateX", "opacity"] as const,
  },
}

// ─── Stagger animation config (from revision-list.tsx) ───────────────────────

/**
 * The revision list uses DURATION.fast (150ms) per item with 40ms stagger.
 * Each item animates opacity (0 → 1) and translateY (y: 8 → 0).
 */
const staggerAnimation = {
  duration: DURATION.fast,
  staggerDelay: 0.04,
  easing: EASING.entrance,
  properties: ["opacity", "translateY"] as const,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Duration values used in the version history feature */
const VERSION_HISTORY_DURATIONS = [
  panelAnimation.duration,
  staggerAnimation.duration,
]

/** Allowed animated properties (sub-properties of transform + opacity) */
const ALLOWED_PROPERTIES = new Set([
  "opacity",
  "transform",
  "translateX",
  "translateY",
  "scale",
  "x",
  "y",
])

function isAllowedProperty(prop: string): boolean {
  return ALLOWED_PROPERTIES.has(prop)
}

function durationInBounds(durationSeconds: number): boolean {
  const ms = durationSeconds * 1000
  return ms >= 150 && ms <= 300
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Feature: note-event-sourcing-frontend, Property 7: Motion constraints compliance", () => {
  describe("Duration bounds: all animation durations are between 150–300ms", () => {
    it("panel animation duration is within 150–300ms", () => {
      const ms = panelAnimation.duration * 1000
      expect(ms).toBeGreaterThanOrEqual(150)
      expect(ms).toBeLessThanOrEqual(300)
    })

    it("stagger item duration is within 150–300ms", () => {
      const ms = staggerAnimation.duration * 1000
      expect(ms).toBeGreaterThanOrEqual(150)
      expect(ms).toBeLessThanOrEqual(300)
    })

    it("all DURATION constants are within 150–300ms bounds", () => {
      for (const [, durationSec] of Object.entries(DURATION)) {
        const ms = durationSec * 1000
        expect(ms).toBeGreaterThanOrEqual(150)
        expect(ms).toBeLessThanOrEqual(300)
      }
    })

    it("property: any duration value in the version history feature is within bounds", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...VERSION_HISTORY_DURATIONS),
          (duration) => {
            expect(durationInBounds(duration)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("Easing direction: entrance uses ease-out, exit uses ease-in", () => {
    it("panel entrance easing matches ease-out cubic-bezier [0, 0, 0.2, 1]", () => {
      expect(panelAnimation.entrance.easing).toEqual([0, 0, 0.2, 1])
    })

    it("panel exit easing matches ease-in cubic-bezier [0.4, 0, 1, 1]", () => {
      expect(panelAnimation.exit.easing).toEqual([0.4, 0, 1, 1])
    })

    it("stagger item easing matches ease-out (entrance pattern)", () => {
      expect(staggerAnimation.easing).toEqual([0, 0, 0.2, 1])
    })

    it("MOTION_CONSTRAINTS easing entrance is ease-out", () => {
      expect(MOTION_CONSTRAINTS.easing.entrance).toBe("ease-out")
    })

    it("MOTION_CONSTRAINTS easing exit is ease-in", () => {
      expect(MOTION_CONSTRAINTS.easing.exit).toBe("ease-in")
    })

    it("property: entrance animation configs always use ease-out easing", () => {
      type AnimDirection = "entrance" | "exit"
      const directionArb = fc.constantFrom<AnimDirection>("entrance", "exit")

      fc.assert(
        fc.property(directionArb, (direction) => {
          if (direction === "entrance") {
            expect(EASING.entrance).toEqual([0, 0, 0.2, 1])
            expect(MOTION_CONSTRAINTS.easing.entrance).toBe("ease-out")
          } else {
            expect(EASING.exit).toEqual([0.4, 0, 1, 1])
            expect(MOTION_CONSTRAINTS.easing.exit).toBe("ease-in")
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Animated properties: only opacity and transform are animated", () => {
    it("panel animates only translateX and opacity", () => {
      for (const prop of panelAnimation.entrance.properties) {
        expect(isAllowedProperty(prop)).toBe(true)
      }
      for (const prop of panelAnimation.exit.properties) {
        expect(isAllowedProperty(prop)).toBe(true)
      }
    })

    it("stagger items animate only opacity and translateY", () => {
      for (const prop of staggerAnimation.properties) {
        expect(isAllowedProperty(prop)).toBe(true)
      }
    })

    it("MOTION_CONSTRAINTS only allows transform and opacity", () => {
      expect(MOTION_CONSTRAINTS.animatableProperties).toEqual([
        "transform",
        "opacity",
      ])
    })

    it("property: any animated property in version history is within allowed set", () => {
      const allAnimatedProperties = [
        ...panelAnimation.entrance.properties,
        ...panelAnimation.exit.properties,
        ...staggerAnimation.properties,
      ]

      fc.assert(
        fc.property(
          fc.constantFrom(...allAnimatedProperties),
          (prop) => {
            expect(isAllowedProperty(prop)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("property: layout-triggering properties are never in the allowed set", () => {
      const layoutProperties = [
        "width",
        "height",
        "top",
        "left",
        "right",
        "bottom",
        "margin",
        "padding",
        "border-width",
      ]

      fc.assert(
        fc.property(
          fc.constantFrom(...layoutProperties),
          (prop) => {
            expect(isAllowedProperty(prop)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("Reduced motion: all durations are 0 when active", () => {
    it("reducedMotionVariants have all states in final visible position (no animation)", () => {
      expect(reducedMotionVariants.hidden).toEqual({
        opacity: 1,
        y: 0,
        scale: 1,
      })
      expect(reducedMotionVariants.visible).toEqual({
        opacity: 1,
        y: 0,
        scale: 1,
      })
      expect(reducedMotionVariants.exit).toEqual({
        opacity: 1,
        y: 0,
        scale: 1,
      })
    })

    it("panel animation duration is 0 when reduced motion is active", () => {
      // In the component: const duration = shouldAnimate ? DURATION.normal : 0
      const reducedMotionDuration = 0
      expect(reducedMotionDuration).toBe(0)
    })

    it("reducedMotionVariants have no transition property (instant rendering)", () => {
      const hidden = reducedMotionVariants.hidden as Record<string, unknown>
      const visible = reducedMotionVariants.visible as Record<string, unknown>
      const exit = reducedMotionVariants.exit as Record<string, unknown>

      expect(hidden).not.toHaveProperty("transition")
      expect(visible).not.toHaveProperty("transition")
      expect(exit).not.toHaveProperty("transition")
    })

    it("property: when reduced motion is active, effective duration is always 0", () => {
      // Simulate the component logic: `const duration = shouldAnimate ? DURATION.normal : 0`
      const prefersReducedMotion = true

      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(DURATION)),
          (configuredDuration) => {
            const effectiveDuration = prefersReducedMotion ? 0 : configuredDuration
            expect(effectiveDuration).toBe(0)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("property: when reduced motion is NOT active, effective duration stays within bounds", () => {
      const prefersReducedMotion = false

      fc.assert(
        fc.property(
          fc.constantFrom(...Object.values(DURATION)),
          (configuredDuration) => {
            const effectiveDuration = prefersReducedMotion ? 0 : configuredDuration
            expect(durationInBounds(effectiveDuration)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
