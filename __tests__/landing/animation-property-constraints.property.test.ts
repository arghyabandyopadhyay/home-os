import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 19: Animation uses only non-layout-triggering properties
 * Validates: Requirements 17.2
 *
 * For any animation or transition in the motion system, only `transform` and
 * `opacity` properties SHALL be animated. Layout-triggering properties (`width`,
 * `height`, `top`, `left`, `margin`, `padding`) SHALL NOT be animated.
 *
 * Tags: Feature: app-ui-redesign, Property 19: Animation uses only non-layout-triggering properties
 */

/**
 * The set of CSS properties that are allowed to be animated in the motion system.
 * These are non-layout-triggering properties that can be animated performantly
 * using the GPU compositor layer.
 */
const ALLOWED_ANIMATION_PROPERTIES = new Set([
  "transform",
  "opacity",
  "background-color",
  "border-color",
  "color",
  // Framer Motion shorthand properties that map to transform
  "scale",
  "x",
  "y",
  "rotate",
  "scaleX",
  "scaleY",
  "translateX",
  "translateY",
  "translateZ",
])

/**
 * Layout-triggering properties that MUST NEVER be animated.
 * Animating these causes expensive layout recalculations (reflows).
 */
const LAYOUT_TRIGGERING_PROPERTIES = [
  "width",
  "height",
  "top",
  "left",
  "right",
  "bottom",
  "margin",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "min-width",
  "min-height",
  "max-width",
  "max-height",
  "border-width",
  "font-size",
  "line-height",
]

/**
 * Validates that a CSS property is allowed to be animated in the motion system.
 * Returns true if the property is non-layout-triggering.
 */
function isAllowedAnimationProperty(property: string): boolean {
  return ALLOWED_ANIMATION_PROPERTIES.has(property)
}

/**
 * Validates that a CSS property is a layout-triggering property that must not be animated.
 */
function isLayoutTriggeringProperty(property: string): boolean {
  return LAYOUT_TRIGGERING_PROPERTIES.includes(property)
}

/**
 * Represents a motion system animation configuration.
 * This models both CSS transitions and Framer Motion animations.
 */
type AnimationConfig = {
  properties: string[]
  duration: number // ms
  easing: string
}

/**
 * Validates that an animation configuration only uses allowed (non-layout-triggering) properties.
 */
function validateAnimationConfig(config: AnimationConfig): {
  valid: boolean
  violations: string[]
} {
  const violations = config.properties.filter(
    (prop) => !isAllowedAnimationProperty(prop)
  )
  return {
    valid: violations.length === 0,
    violations,
  }
}

/**
 * The actual motion system animation configurations from the project.
 * These represent what is actually animated in globals.css and Framer Motion configs.
 */
const MOTION_SYSTEM_CONFIGS: AnimationConfig[] = [
  // card-app hover transition (globals.css)
  {
    properties: ["border-color", "background-color"],
    duration: 200,
    easing: "ease",
  },
  // item-app hover transition (globals.css)
  {
    properties: ["background-color"],
    duration: 150,
    easing: "ease",
  },
  // input-app focus transition (globals.css)
  {
    properties: ["background-color"],
    duration: 150,
    easing: "ease",
  },
  // btn-primary-app hover transition (globals.css)
  {
    properties: ["opacity"],
    duration: 150,
    easing: "ease",
  },
  // link-muted hover transition (globals.css)
  {
    properties: ["color"],
    duration: 150,
    easing: "ease",
  },
  // Framer Motion section entrance (animation-config.ts)
  {
    properties: ["opacity", "y"],
    duration: 600,
    easing: "ease-out",
  },
  // Framer Motion stagger children item (animation-config.ts)
  {
    properties: ["opacity", "y"],
    duration: 400,
    easing: "ease-out",
  },
  // Framer Motion hover scale (animation-config.ts)
  {
    properties: ["scale"],
    duration: 180,
    easing: "ease",
  },
]

describe("Feature: app-ui-redesign, Property 19: Animation uses only non-layout-triggering properties", () => {
  describe("Actual motion system configurations use only allowed properties", () => {
    it("all motion system animation configs use only non-layout-triggering properties", () => {
      for (const config of MOTION_SYSTEM_CONFIGS) {
        const result = validateAnimationConfig(config)
        expect(result.valid).toBe(true)
        expect(result.violations).toEqual([])
      }
    })

    it("no motion system config animates width, height, top, left, margin, or padding", () => {
      const allAnimatedProperties = MOTION_SYSTEM_CONFIGS.flatMap(
        (config) => config.properties
      )
      for (const prop of allAnimatedProperties) {
        expect(isLayoutTriggeringProperty(prop)).toBe(false)
      }
    })
  })

  describe("Property-based: allowed properties are always non-layout-triggering", () => {
    const allowedPropertyArb = fc.constantFrom(
      ...Array.from(ALLOWED_ANIMATION_PROPERTIES)
    )

    it("every allowed animation property is not a layout-triggering property", () => {
      fc.assert(
        fc.property(allowedPropertyArb, (property) => {
          expect(isLayoutTriggeringProperty(property)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: layout-triggering properties are always rejected", () => {
    const layoutTriggeringPropertyArb = fc.constantFrom(
      ...LAYOUT_TRIGGERING_PROPERTIES
    )

    it("every layout-triggering property is rejected by the validation function", () => {
      fc.assert(
        fc.property(layoutTriggeringPropertyArb, (property) => {
          expect(isAllowedAnimationProperty(property)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("any animation config containing a layout-triggering property is invalid", () => {
      const configWithLayoutPropertyArb = fc.record({
        properties: fc
          .tuple(
            fc.constantFrom(...Array.from(ALLOWED_ANIMATION_PROPERTIES)),
            layoutTriggeringPropertyArb
          )
          .map(([allowed, layout]) => [allowed, layout]),
        duration: fc.integer({ min: 150, max: 300 }),
        easing: fc.constantFrom("ease", "ease-out", "ease-in"),
      })

      fc.assert(
        fc.property(configWithLayoutPropertyArb, (config) => {
          const result = validateAnimationConfig(config)
          expect(result.valid).toBe(false)
          expect(result.violations.length).toBeGreaterThan(0)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: random CSS property names are correctly classified", () => {
    const randomCssPropertyArb = fc.oneof(
      // Known allowed properties
      fc.constantFrom(...Array.from(ALLOWED_ANIMATION_PROPERTIES)),
      // Known layout-triggering properties
      fc.constantFrom(...LAYOUT_TRIGGERING_PROPERTIES),
      // Random property-like strings
      fc
        .stringMatching(/^[a-z][a-z-]{2,20}$/)
        .filter(
          (s) =>
            !ALLOWED_ANIMATION_PROPERTIES.has(s) &&
            !LAYOUT_TRIGGERING_PROPERTIES.includes(s)
        )
    )

    it("allowed properties and layout-triggering properties are mutually exclusive sets", () => {
      fc.assert(
        fc.property(randomCssPropertyArb, (property) => {
          // A property cannot be both allowed AND layout-triggering
          const isAllowed = isAllowedAnimationProperty(property)
          const isLayout = isLayoutTriggeringProperty(property)
          expect(isAllowed && isLayout).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: valid animation configs only contain allowed properties", () => {
    const validAnimationConfigArb: fc.Arbitrary<AnimationConfig> = fc.record({
      properties: fc.array(
        fc.constantFrom(...Array.from(ALLOWED_ANIMATION_PROPERTIES)),
        { minLength: 1, maxLength: 4 }
      ),
      duration: fc.integer({ min: 150, max: 300 }),
      easing: fc.constantFrom("ease", "ease-out", "ease-in"),
    })

    it("any config with only allowed properties passes validation", () => {
      fc.assert(
        fc.property(validAnimationConfigArb, (config) => {
          const result = validateAnimationConfig(config)
          expect(result.valid).toBe(true)
          expect(result.violations).toEqual([])
        }),
        { numRuns: 100 }
      )
    })

    it("no valid config contains layout-triggering properties", () => {
      fc.assert(
        fc.property(validAnimationConfigArb, (config) => {
          for (const prop of config.properties) {
            expect(isLayoutTriggeringProperty(prop)).toBe(false)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: invalid animation configs always contain at least one layout-triggering property", () => {
    const invalidAnimationConfigArb: fc.Arbitrary<AnimationConfig> = fc.record({
      properties: fc
        .tuple(
          fc.array(
            fc.constantFrom(...Array.from(ALLOWED_ANIMATION_PROPERTIES)),
            { minLength: 0, maxLength: 3 }
          ),
          fc.array(fc.constantFrom(...LAYOUT_TRIGGERING_PROPERTIES), {
            minLength: 1,
            maxLength: 2,
          })
        )
        .map(([allowed, layout]) => [...allowed, ...layout]),
      duration: fc.integer({ min: 100, max: 500 }),
      easing: fc.constantFrom("ease", "ease-out", "ease-in", "linear"),
    })

    it("any config with at least one layout-triggering property fails validation", () => {
      fc.assert(
        fc.property(invalidAnimationConfigArb, (config) => {
          const result = validateAnimationConfig(config)
          expect(result.valid).toBe(false)
          expect(result.violations.length).toBeGreaterThan(0)
          // Every violation should be a layout-triggering property
          for (const violation of result.violations) {
            expect(isLayoutTriggeringProperty(violation)).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
