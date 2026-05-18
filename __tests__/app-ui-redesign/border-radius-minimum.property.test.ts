import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import * as fs from "fs"
import * as path from "path"

/**
 * Property 3: Content container border-radius minimum
 * Validates: Requirements 4.3
 *
 * For any content container element rendered by the component system
 * (card-app, item-app, panel-app, input-app, or any visible surface element),
 * the computed border-radius SHALL be at least 0.75rem (12px) with no 0px
 * or sharp 90-degree corners.
 *
 * Tags: Feature: app-ui-redesign, Property 3: Content container border-radius minimum
 */

/**
 * Component class definitions with their expected border-radius values in rem.
 * These are extracted from the @layer components section in globals.css.
 */
const COMPONENT_BORDER_RADIUS: Record<string, number> = {
  "card-app": 1, // 1rem
  "item-app": 0.75, // 0.75rem
  "panel-app": 1.5, // 1.5rem
  "input-app": 0.75, // 0.75rem
  "stat-card": 1, // 1rem
  "btn-primary-app": 0.75, // 0.75rem
}

const MINIMUM_BORDER_RADIUS_REM = 0.75
const REM_TO_PX = 16 // 1rem = 16px
const MINIMUM_BORDER_RADIUS_PX = MINIMUM_BORDER_RADIUS_REM * REM_TO_PX // 12px

/**
 * Parses border-radius value from a CSS rule string.
 * Returns the value in rem, or null if not found.
 */
function parseBorderRadiusRem(value: string): number | null {
  const remMatch = value.match(/([\d.]+)rem/)
  if (remMatch) return parseFloat(remMatch[1])

  const pxMatch = value.match(/([\d.]+)px/)
  if (pxMatch) return parseFloat(pxMatch[1]) / REM_TO_PX

  return null
}

/**
 * Extracts border-radius values from globals.css for component classes.
 */
function extractBorderRadiusFromCSS(): Record<string, number> {
  const cssPath = path.resolve(__dirname, "../../app/globals.css")
  const cssContent = fs.readFileSync(cssPath, "utf-8")

  const result: Record<string, number> = {}

  // Match component class definitions with their border-radius
  for (const className of Object.keys(COMPONENT_BORDER_RADIUS)) {
    // Match the class definition and extract border-radius
    const classRegex = new RegExp(
      `\\.${className.replace("-", "\\-")}\\s*\\{[^}]*border-radius:\\s*([^;]+);`,
      "m"
    )
    const match = cssContent.match(classRegex)
    if (match) {
      const radius = parseBorderRadiusRem(match[1])
      if (radius !== null) {
        result[className] = radius
      }
    }
  }

  return result
}

/**
 * Validates that a border-radius value meets the minimum requirement.
 */
function isValidBorderRadius(radiusRem: number): boolean {
  return radiusRem >= MINIMUM_BORDER_RADIUS_REM
}

/**
 * Validates that a border-radius value is not 0 (no sharp corners).
 */
function hasNoSharpCorners(radiusRem: number): boolean {
  return radiusRem > 0
}

describe("Feature: app-ui-redesign, Property 3: Content container border-radius minimum", () => {
  const componentClasses = Object.keys(COMPONENT_BORDER_RADIUS)
  const componentClassArb = fc.constantFrom(...componentClasses)

  describe("CSS source validation", () => {
    const extractedRadii = extractBorderRadiusFromCSS()

    it("all component classes have border-radius defined in globals.css", () => {
      for (const className of componentClasses) {
        expect(
          extractedRadii[className],
          `${className} should have border-radius defined in globals.css`
        ).toBeDefined()
      }
    })

    it("all extracted border-radius values match expected values", () => {
      for (const className of componentClasses) {
        if (extractedRadii[className] !== undefined) {
          expect(
            extractedRadii[className],
            `${className} border-radius should be ${COMPONENT_BORDER_RADIUS[className]}rem`
          ).toBe(COMPONENT_BORDER_RADIUS[className])
        }
      }
    })
  })

  describe("Property-based: border-radius minimum constraint", () => {
    it("for any component class, border-radius is at least 0.75rem (12px)", () => {
      fc.assert(
        fc.property(componentClassArb, (className) => {
          const radiusRem = COMPONENT_BORDER_RADIUS[className]
          expect(
            isValidBorderRadius(radiusRem),
            `${className} has border-radius ${radiusRem}rem (${radiusRem * REM_TO_PX}px), ` +
              `which is less than minimum ${MINIMUM_BORDER_RADIUS_REM}rem (${MINIMUM_BORDER_RADIUS_PX}px)`
          ).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("for any component class, border-radius is never 0px (no sharp corners)", () => {
      fc.assert(
        fc.property(componentClassArb, (className) => {
          const radiusRem = COMPONENT_BORDER_RADIUS[className]
          expect(
            hasNoSharpCorners(radiusRem),
            `${className} has border-radius 0 (sharp 90-degree corners)`
          ).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("for any randomly generated border-radius below minimum, validation correctly rejects it", () => {
      const invalidRadiusArb = fc.double({
        min: 0,
        max: 0.74,
        noNaN: true,
      })

      fc.assert(
        fc.property(invalidRadiusArb, (radius) => {
          expect(isValidBorderRadius(radius)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("for any randomly generated border-radius at or above minimum, validation correctly accepts it", () => {
      const validRadiusArb = fc.double({
        min: 0.75,
        max: 5.0,
        noNaN: true,
      })

      fc.assert(
        fc.property(validRadiusArb, (radius) => {
          expect(isValidBorderRadius(radius)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("border-radius of exactly 0 is rejected (sharp corners)", () => {
      fc.assert(
        fc.property(fc.constant(0), (radius) => {
          expect(hasNoSharpCorners(radius)).toBe(false)
          expect(isValidBorderRadius(radius)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: CSS source border-radius validation", () => {
    const extractedRadii = extractBorderRadiusFromCSS()

    it("for any component class selected at random, the CSS-defined border-radius meets the minimum", () => {
      fc.assert(
        fc.property(componentClassArb, (className) => {
          const radiusRem = extractedRadii[className]
          expect(
            radiusRem,
            `${className} should have border-radius defined in CSS`
          ).toBeDefined()
          expect(
            isValidBorderRadius(radiusRem),
            `${className} CSS border-radius ${radiusRem}rem is below minimum ${MINIMUM_BORDER_RADIUS_REM}rem`
          ).toBe(true)
          expect(
            hasNoSharpCorners(radiusRem),
            `${className} CSS border-radius is 0 (sharp corners)`
          ).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("for any component class, the pixel equivalent is at least 12px", () => {
      fc.assert(
        fc.property(componentClassArb, (className) => {
          const radiusRem = extractedRadii[className]
          const radiusPx = radiusRem * REM_TO_PX
          expect(
            radiusPx,
            `${className} border-radius ${radiusPx}px is below minimum ${MINIMUM_BORDER_RADIUS_PX}px`
          ).toBeGreaterThanOrEqual(MINIMUM_BORDER_RADIUS_PX)
        }),
        { numRuns: 100 }
      )
    })
  })
})
