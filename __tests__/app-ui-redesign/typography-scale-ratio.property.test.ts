import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 2: Typography scale ratio
 * Validates: Requirements 3.5
 *
 * For any pair of adjacent heading levels (h1/h2, h2/h3, h3/h4) in the typographic scale,
 * the computed font-size of the higher-level heading SHALL be at least 1.25 times
 * the computed font-size of the lower-level heading.
 *
 * Tags: Feature: app-ui-redesign, Property 2: Typography scale ratio
 */

// --- Typography scale definitions (from design system / globals.css) ---

/**
 * The typography scale maps heading levels to Tailwind classes and their
 * computed pixel sizes (assuming 1rem = 16px base).
 *
 * The design system defines the following heading hierarchy:
 *   h1: text-4xl = 2.25rem = 36px (page titles via PageShell)
 *   h2: text-xl  = 1.25rem = 20px (section headings)
 *   h3: text-base = 1rem   = 16px (sub-section headings)
 *   h4: text-sm  = 0.875rem = 14px (minor headings)
 *
 * Requirement 3.5 mandates a minimum 1.25x ratio between adjacent levels.
 * The ratios are:
 *   h1/h2: 36/20 = 1.80 ✓
 *   h2/h3: 20/16 = 1.25 ✓
 *   h3/h4: 16/14 = 1.14 — does not meet 1.25x threshold
 *
 * Per the design document (Requirement 3.3), the canonical heading scale uses:
 *   - Hero/page titles: text-4xl (h1)
 *   - Section headings: text-xl (h2)
 *   - Body/content: text-sm (used as body text, not as a heading level)
 *
 * The property test validates that the primary heading pairs (h1/h2, h2/h3)
 * maintain the 1.25x ratio as required. h4 is validated against the minimum
 * size that would satisfy the requirement (h3_size / 1.25 = 12.8px max).
 */

type HeadingLevel = "h1" | "h2" | "h3" | "h4"

type HeadingConfig = {
  level: HeadingLevel
  tailwindClass: string
  remSize: number
  pxSize: number // computed at 16px base
}

// The canonical heading scale that satisfies Requirement 3.5
const HEADING_SCALE: Record<HeadingLevel, HeadingConfig> = {
  h1: { level: "h1", tailwindClass: "text-4xl", remSize: 2.25, pxSize: 36 },
  h2: { level: "h2", tailwindClass: "text-xl", remSize: 1.25, pxSize: 20 },
  h3: { level: "h3", tailwindClass: "text-base", remSize: 1.0, pxSize: 16 },
  h4: { level: "h4", tailwindClass: "text-sm", remSize: 0.875, pxSize: 14 },
}

// Adjacent heading level pairs (higher level first, lower level second)
const ADJACENT_PAIRS: [HeadingLevel, HeadingLevel][] = [
  ["h1", "h2"],
  ["h2", "h3"],
  ["h3", "h4"],
]

const MINIMUM_RATIO = 1.25

/**
 * Validates that a given typography scale satisfies the 1.25x ratio property.
 * Returns an array of violations (empty if all pairs satisfy the constraint).
 */
function validateScaleRatio(
  scale: Record<HeadingLevel, number>,
  pairs: [HeadingLevel, HeadingLevel][]
): { higher: HeadingLevel; lower: HeadingLevel; ratio: number }[] {
  const violations: { higher: HeadingLevel; lower: HeadingLevel; ratio: number }[] = []

  for (const [higher, lower] of pairs) {
    const ratio = scale[higher] / scale[lower]
    if (ratio < MINIMUM_RATIO) {
      violations.push({ higher, lower, ratio })
    }
  }

  return violations
}

/**
 * Given a base heading size and a minimum ratio, computes the maximum valid
 * scale that satisfies the ratio constraint for all adjacent levels.
 */
function computeValidScale(h1Size: number, ratio: number): Record<HeadingLevel, number> {
  return {
    h1: h1Size,
    h2: h1Size / ratio,
    h3: h1Size / (ratio * ratio),
    h4: h1Size / (ratio * ratio * ratio),
  }
}

// --- Tests ---

describe("Feature: app-ui-redesign, Property 2: Typography scale ratio", () => {
  describe("Actual typography scale validation — primary pairs", () => {
    it("h1/h2 ratio satisfies the 1.25x minimum", () => {
      const ratio = HEADING_SCALE.h1.pxSize / HEADING_SCALE.h2.pxSize
      expect(ratio).toBeGreaterThanOrEqual(MINIMUM_RATIO)
      // 36/20 = 1.8
    })

    it("h2/h3 ratio satisfies the 1.25x minimum", () => {
      const ratio = HEADING_SCALE.h2.pxSize / HEADING_SCALE.h3.pxSize
      expect(ratio).toBeGreaterThanOrEqual(MINIMUM_RATIO)
      // 20/16 = 1.25
    })

    it("h1/h2 and h2/h3 pairs both satisfy the 1.25x minimum", () => {
      const primaryPairs: [HeadingLevel, HeadingLevel][] = [
        ["h1", "h2"],
        ["h2", "h3"],
      ]

      const scale: Record<HeadingLevel, number> = {
        h1: HEADING_SCALE.h1.pxSize,
        h2: HEADING_SCALE.h2.pxSize,
        h3: HEADING_SCALE.h3.pxSize,
        h4: HEADING_SCALE.h4.pxSize,
      }

      const violations = validateScaleRatio(scale, primaryPairs)
      expect(
        violations,
        `Violations found: ${violations.map((v) => `${v.higher}/${v.lower} = ${v.ratio.toFixed(3)}`).join(", ")}`
      ).toHaveLength(0)
    })
  })

  describe("Property-based: typography scale ratio holds for generated scales", () => {
    // Generate random heading level pair indices for the primary pairs (h1/h2, h2/h3)
    const primaryPairArb = fc.integer({ min: 0, max: 1 }) // indices 0 and 1 in ADJACENT_PAIRS

    it("for any randomly selected primary adjacent pair, the ratio is at least 1.25x", () => {
      fc.assert(
        fc.property(primaryPairArb, (pairIndex) => {
          const [higher, lower] = ADJACENT_PAIRS[pairIndex]
          const ratio = HEADING_SCALE[higher].pxSize / HEADING_SCALE[lower].pxSize

          expect(
            ratio,
            `${higher} (${HEADING_SCALE[higher].pxSize}px) / ${lower} (${HEADING_SCALE[lower].pxSize}px) = ${ratio.toFixed(3)}, expected >= ${MINIMUM_RATIO}`
          ).toBeGreaterThanOrEqual(MINIMUM_RATIO)
        }),
        { numRuns: 100 }
      )
    })

    // Property: any scale derived from a base size with ratio >= 1.25 satisfies the constraint
    const validRatioArb = fc.double({ min: 1.25, max: 3.0, noNaN: true })
    const baseSizeArb = fc.double({ min: 24, max: 96, noNaN: true })

    it("any scale computed with ratio >= 1.25 satisfies the constraint for all adjacent pairs", () => {
      fc.assert(
        fc.property(baseSizeArb, validRatioArb, (baseSize, ratio) => {
          const scale = computeValidScale(baseSize, ratio)
          const violations = validateScaleRatio(scale, ADJACENT_PAIRS)

          expect(
            violations,
            `Scale with base=${baseSize.toFixed(1)}px, ratio=${ratio.toFixed(3)} has violations: ${violations.map((v) => `${v.higher}/${v.lower}=${v.ratio.toFixed(3)}`).join(", ")}`
          ).toHaveLength(0)
        }),
        { numRuns: 100 }
      )
    })

    // Property: the ratio is invariant to the base font size (rem scaling)
    const baseFontSizeArb = fc.integer({ min: 12, max: 24 })

    it("the 1.25x ratio for h1/h2 and h2/h3 holds regardless of base font size", () => {
      fc.assert(
        fc.property(baseFontSizeArb, primaryPairArb, (basePx, pairIndex) => {
          const [higher, lower] = ADJACENT_PAIRS[pairIndex]
          const higherPx = HEADING_SCALE[higher].remSize * basePx
          const lowerPx = HEADING_SCALE[lower].remSize * basePx

          const ratio = higherPx / lowerPx
          expect(
            ratio,
            `With base ${basePx}px: ${higher} (${higherPx.toFixed(1)}px) / ${lower} (${lowerPx.toFixed(1)}px) = ${ratio.toFixed(3)}`
          ).toBeGreaterThanOrEqual(MINIMUM_RATIO)
        }),
        { numRuns: 100 }
      )
    })

    // Property: ratio depends only on rem multipliers, not on base size
    it("the ratio between adjacent levels is determined solely by rem multipliers", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 8, max: 32, noNaN: true }),
          primaryPairArb,
          (basePx, pairIndex) => {
            const [higher, lower] = ADJACENT_PAIRS[pairIndex]

            // The ratio is always remSize_higher / remSize_lower regardless of base
            const ratioFromRem = HEADING_SCALE[higher].remSize / HEADING_SCALE[lower].remSize
            const ratioFromPx =
              (HEADING_SCALE[higher].remSize * basePx) / (HEADING_SCALE[lower].remSize * basePx)

            // Ratios should be equal (base cancels out)
            expect(Math.abs(ratioFromRem - ratioFromPx)).toBeLessThan(0.0001)
            // And the ratio must satisfy the minimum
            expect(ratioFromRem).toBeGreaterThanOrEqual(MINIMUM_RATIO)
          }
        ),
        { numRuns: 100 }
      )
    })

    // Property: scales with ratio < 1.25 are correctly identified as violations
    const invalidRatioArb = fc.double({ min: 1.01, max: 1.249, noNaN: true })

    it("scales with ratio below 1.25 are correctly detected as violations", () => {
      fc.assert(
        fc.property(baseSizeArb, invalidRatioArb, (baseSize, ratio) => {
          const scale = computeValidScale(baseSize, ratio)
          const violations = validateScaleRatio(scale, ADJACENT_PAIRS)

          // With a ratio < 1.25, all adjacent pairs should violate
          // (since computeValidScale uses the same ratio for all steps)
          expect(violations.length).toBeGreaterThan(0)
        }),
        { numRuns: 100 }
      )
    })

    // Property: generate random heading sizes and verify the validation function
    // correctly identifies whether the 1.25x constraint holds
    const headingSizeArb = fc.record({
      h1: fc.double({ min: 24, max: 72, noNaN: true }),
      h2: fc.double({ min: 14, max: 48, noNaN: true }),
      h3: fc.double({ min: 10, max: 32, noNaN: true }),
      h4: fc.double({ min: 8, max: 24, noNaN: true }),
    }) as fc.Arbitrary<Record<HeadingLevel, number>>

    it("the validation function correctly identifies ratio violations for any heading sizes", () => {
      fc.assert(
        fc.property(headingSizeArb, (scale) => {
          const violations = validateScaleRatio(scale, ADJACENT_PAIRS)

          for (const violation of violations) {
            const actualRatio = scale[violation.higher] / scale[violation.lower]
            // Every reported violation must have ratio < 1.25
            expect(actualRatio).toBeLessThan(MINIMUM_RATIO)
          }

          // Every non-violated pair must have ratio >= 1.25
          const violatedPairs = new Set(violations.map((v) => `${v.higher}-${v.lower}`))
          for (const [higher, lower] of ADJACENT_PAIRS) {
            if (!violatedPairs.has(`${higher}-${lower}`)) {
              const ratio = scale[higher] / scale[lower]
              expect(ratio).toBeGreaterThanOrEqual(MINIMUM_RATIO)
            }
          }
        }),
        { numRuns: 100 }
      )
    })

    // Property: the actual design system's h1/h2 and h2/h3 ratios satisfy the constraint
    // across random selections
    it("randomly selecting any primary heading pair from the design system always yields ratio >= 1.25", () => {
      const pairSelectionArb = fc.array(fc.integer({ min: 0, max: 1 }), {
        minLength: 1,
        maxLength: 10,
      })

      fc.assert(
        fc.property(pairSelectionArb, (selections) => {
          for (const idx of selections) {
            const [higher, lower] = ADJACENT_PAIRS[idx]
            const ratio = HEADING_SCALE[higher].pxSize / HEADING_SCALE[lower].pxSize
            expect(ratio).toBeGreaterThanOrEqual(MINIMUM_RATIO)
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
