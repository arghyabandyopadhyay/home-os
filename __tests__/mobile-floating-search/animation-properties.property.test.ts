import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

import {
  expandCollapseVariants,
  entranceVariants,
} from "@/components/layout/floating-search-bar"

/**
 * Property 2: All animations only use transform and opacity
 * **Validates: Requirements 3.2, 6.2**
 *
 * For any animation variant or transition config defined in the FloatingSearchBar
 * component (entrance, expansion, collapse), the only CSS properties being animated
 * are `transform` and `opacity` — no layout-triggering properties (width, height,
 * margin, padding, top, left, etc.) are animated.
 *
 * Tags: Feature: mobile-floating-search, Property 2: All animations only use transform and opacity
 */

/** Allowed animated properties: transform sub-properties and opacity */
const ALLOWED_PROPERTIES = new Set([
  "scaleX",
  "scaleY",
  "scale",
  "opacity",
  "x",
  "y",
  "rotate",
  "translateX",
  "translateY",
])

/** Layout-triggering properties that must NOT be present in animation variants */
const FORBIDDEN_PROPERTIES = new Set([
  "width",
  "height",
  "margin",
  "marginTop",
  "marginBottom",
  "marginLeft",
  "marginRight",
  "padding",
  "paddingTop",
  "paddingBottom",
  "paddingLeft",
  "paddingRight",
  "top",
  "left",
  "right",
  "bottom",
  "fontSize",
  "lineHeight",
])

/**
 * Extracts all animated property keys from a Framer Motion variant object.
 * Filters out non-animated metadata keys like `transition`.
 */
function getAnimatedProperties(variant: Record<string, unknown>): string[] {
  const metadataKeys = new Set(["transition", "transitionEnd", "when", "delayChildren", "staggerChildren"])
  return Object.keys(variant).filter((key) => !metadataKeys.has(key))
}

/**
 * Checks whether all properties in a variant are within the allowed set.
 */
function onlyUsesAllowedProperties(properties: string[]): boolean {
  return properties.every((prop) => ALLOWED_PROPERTIES.has(prop))
}

/**
 * Checks whether any property in a variant is a forbidden layout-triggering property.
 */
function containsForbiddenProperty(properties: string[]): boolean {
  return properties.some((prop) => FORBIDDEN_PROPERTIES.has(prop))
}

/** All exported variant objects to test */
const ALL_VARIANTS = {
  expandCollapseVariants,
  entranceVariants,
} as const

/** Collect all variant keys across all variant objects */
const allVariantEntries: Array<{ variantSetName: string; variantKey: string; variant: Record<string, unknown> }> = []

for (const [variantSetName, variantSet] of Object.entries(ALL_VARIANTS)) {
  for (const [variantKey, variant] of Object.entries(variantSet)) {
    allVariantEntries.push({
      variantSetName,
      variantKey,
      variant: variant as Record<string, unknown>,
    })
  }
}

describe("Feature: mobile-floating-search, Property 2: All animations only use transform and opacity", () => {
  describe("Direct verification: all exported variants only animate allowed properties", () => {
    it.each(allVariantEntries)(
      "$variantSetName.$variantKey only uses transform/opacity properties",
      ({ variant }) => {
        const properties = getAnimatedProperties(variant)
        expect(onlyUsesAllowedProperties(properties)).toBe(true)
        expect(containsForbiddenProperty(properties)).toBe(false)
      }
    )
  })

  describe("Property-based: randomly selected variant keys only contain allowed properties", () => {
    const variantEntryArb = fc.constantFrom(...allVariantEntries)

    it("for any variant entry, all animated properties are in the allowed set", () => {
      fc.assert(
        fc.property(variantEntryArb, ({ variant }) => {
          const properties = getAnimatedProperties(variant)
          expect(onlyUsesAllowedProperties(properties)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("for any variant entry, no forbidden layout-triggering properties are present", () => {
      fc.assert(
        fc.property(variantEntryArb, ({ variant }) => {
          const properties = getAnimatedProperties(variant)
          expect(containsForbiddenProperty(properties)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: allowed properties are always accepted by the validator", () => {
    const allowedPropertyArb = fc.constantFrom(...ALLOWED_PROPERTIES)

    it("any single allowed property passes the onlyUsesAllowedProperties check", () => {
      fc.assert(
        fc.property(allowedPropertyArb, (prop) => {
          expect(onlyUsesAllowedProperties([prop])).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("any combination of allowed properties passes the check", () => {
      const allowedSubsetArb = fc.subarray([...ALLOWED_PROPERTIES], { minLength: 1 })

      fc.assert(
        fc.property(allowedSubsetArb, (props) => {
          expect(onlyUsesAllowedProperties(props)).toBe(true)
          expect(containsForbiddenProperty(props)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: forbidden properties are always rejected by the validator", () => {
    const forbiddenPropertyArb = fc.constantFrom(...FORBIDDEN_PROPERTIES)

    it("any single forbidden property fails the onlyUsesAllowedProperties check", () => {
      fc.assert(
        fc.property(forbiddenPropertyArb, (prop) => {
          expect(onlyUsesAllowedProperties([prop])).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("any forbidden property mixed with allowed properties is detected", () => {
      const allowedSubsetArb = fc.subarray([...ALLOWED_PROPERTIES], { minLength: 0 })

      fc.assert(
        fc.property(
          fc.tuple(forbiddenPropertyArb, allowedSubsetArb),
          ([forbidden, allowed]) => {
            const combined = [...allowed, forbidden]
            expect(containsForbiddenProperty(combined)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: variant values are numeric (transform/opacity are numeric in Framer Motion)", () => {
    const variantEntryArb = fc.constantFrom(...allVariantEntries)

    it("all animated property values in exported variants are numbers", () => {
      fc.assert(
        fc.property(variantEntryArb, ({ variant }) => {
          const properties = getAnimatedProperties(variant)
          for (const prop of properties) {
            const value = variant[prop]
            expect(typeof value).toBe("number")
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
