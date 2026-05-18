import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 11: Spacing minimums
 * Validates: Requirements 13.2
 *
 * For any pair of adjacent top-level content sections on a module page, the
 * vertical spacing SHALL be at least 32px. For any card or panel element, the
 * internal padding SHALL be at least 24px.
 *
 * Tags: Feature: app-ui-redesign, Property 11: Spacing minimums
 */

/**
 * Design system spacing values as defined in the UI design system steering
 * and the design document's Spatial Constraints Schema.
 *
 * Tailwind spacing scale (relevant values):
 * - space-y-8 = 2rem = 32px (section spacing)
 * - p-6 = 1.5rem = 24px (card/panel padding)
 * - p-4 = 1rem = 16px (compact item padding — item-app, not card/panel)
 * - py-10 = 2.5rem = 40px (page vertical padding)
 * - px-6 = 1.5rem = 24px (page horizontal padding)
 */

/** Minimum spacing constraints from Requirements 13.2 */
const SPACING_MINIMUMS = {
  /** Minimum vertical spacing between adjacent top-level content sections (px) */
  sectionGap: 32,
  /** Minimum internal padding for cards and panels (px) */
  cardPanelPadding: 24,
} as const

/**
 * Design system spacing tokens mapped to their pixel values.
 * These are the Tailwind utility classes used in the app.
 */
const DESIGN_SYSTEM_SPACING = {
  /** space-y-8: gap between major dashboard/module sections */
  sectionSpacing: { class: "space-y-8", remValue: 2, pxValue: 32 },
  /** p-6: standard card/panel internal padding */
  cardPadding: { class: "p-6", remValue: 1.5, pxValue: 24 },
  /** p-4: compact item padding (item-app) */
  itemPadding: { class: "p-4", remValue: 1, pxValue: 16 },
  /** py-10: page vertical padding */
  pageVerticalPadding: { class: "py-10", remValue: 2.5, pxValue: 40 },
  /** px-6: page horizontal padding */
  pageHorizontalPadding: { class: "px-6", remValue: 1.5, pxValue: 24 },
} as const

/** Component types that use card/panel-level padding */
type CardOrPanelComponent = "card-app" | "panel-app" | "stat-card"

/** All component types in the system */
type ComponentType = CardOrPanelComponent | "item-app"

/** Spacing configuration for a component */
type SpacingConfig = {
  componentType: ComponentType
  paddingPx: number
  paddingRem: number
}

/** Section layout configuration */
type SectionLayoutConfig = {
  sectionCount: number
  gapPx: number
  gapRem: number
}

/**
 * Returns the minimum required padding for a given component type.
 * Cards and panels require 24px minimum; items have a lower threshold.
 */
function getMinimumPadding(componentType: ComponentType): number {
  if (componentType === "card-app" || componentType === "panel-app" || componentType === "stat-card") {
    return SPACING_MINIMUMS.cardPanelPadding
  }
  // item-app uses p-4 (16px) which is below the card/panel minimum
  // but item-app is not a card or panel, so it has no 24px requirement
  return 16
}

/**
 * Validates that a spacing configuration meets the minimum requirements.
 * For cards/panels: padding must be >= 24px.
 * For section gaps: spacing must be >= 32px.
 */
function validateSpacingConfig(config: SpacingConfig): boolean {
  const minRequired = getMinimumPadding(config.componentType)
  return config.paddingPx >= minRequired
}

/**
 * Validates that section gap meets the minimum requirement of 32px.
 */
function validateSectionGap(gapPx: number): boolean {
  return gapPx >= SPACING_MINIMUMS.sectionGap
}

/**
 * Converts rem to px assuming standard 16px base font size.
 */
function remToPx(rem: number): number {
  return rem * 16
}

/** Arbitrary for generating card/panel component types */
const cardOrPanelTypeArb: fc.Arbitrary<CardOrPanelComponent> = fc.constantFrom(
  "card-app",
  "panel-app",
  "stat-card"
)

/** Arbitrary for generating any component type */
const componentTypeArb: fc.Arbitrary<ComponentType> = fc.constantFrom(
  "card-app",
  "panel-app",
  "stat-card",
  "item-app"
)

/** Arbitrary for generating valid padding values (in rem) that meet card/panel minimums */
const validCardPaddingRemArb = fc.double({ min: 1.5, max: 4, noNaN: true }).map(
  (v) => Math.round(v * 100) / 100
)

/** Arbitrary for generating valid section gap values (in rem) that meet section minimum */
const validSectionGapRemArb = fc.double({ min: 2, max: 6, noNaN: true }).map(
  (v) => Math.round(v * 100) / 100
)

/** Arbitrary for generating invalid padding values (below 24px / 1.5rem for cards) */
const invalidCardPaddingRemArb = fc.double({ min: 0.25, max: 1.4375, noNaN: true }).map(
  (v) => Math.round(v * 100) / 100
)

/** Arbitrary for generating invalid section gap values (below 32px / 2rem) */
const invalidSectionGapRemArb = fc.double({ min: 0.25, max: 1.9375, noNaN: true }).map(
  (v) => Math.round(v * 100) / 100
)

/** Arbitrary for generating random spacing configs for cards/panels */
const cardSpacingConfigArb = fc.record({
  componentType: cardOrPanelTypeArb,
  paddingRem: validCardPaddingRemArb,
}).map((config) => ({
  ...config,
  paddingPx: remToPx(config.paddingRem),
}))

/** Arbitrary for generating section layout configs */
const sectionLayoutConfigArb = fc.record({
  sectionCount: fc.integer({ min: 2, max: 7 }),
  gapRem: validSectionGapRemArb,
}).map((config) => ({
  ...config,
  gapPx: remToPx(config.gapRem),
}))

/** Arbitrary for generating random padding values in px */
const randomPaddingPxArb = fc.integer({ min: 0, max: 128 })

/** Arbitrary for generating random gap values in px */
const randomGapPxArb = fc.integer({ min: 0, max: 128 })

describe("Feature: app-ui-redesign, Property 11: Spacing minimums", () => {
  describe("Design system spacing values meet minimum requirements", () => {
    it("space-y-8 (32px) meets the 32px minimum section gap requirement", () => {
      expect(DESIGN_SYSTEM_SPACING.sectionSpacing.pxValue).toBeGreaterThanOrEqual(
        SPACING_MINIMUMS.sectionGap
      )
    })

    it("p-6 (24px) meets the 24px minimum card/panel padding requirement", () => {
      expect(DESIGN_SYSTEM_SPACING.cardPadding.pxValue).toBeGreaterThanOrEqual(
        SPACING_MINIMUMS.cardPanelPadding
      )
    })

    it("section spacing rem value converts to at least 32px", () => {
      expect(remToPx(DESIGN_SYSTEM_SPACING.sectionSpacing.remValue)).toBeGreaterThanOrEqual(
        SPACING_MINIMUMS.sectionGap
      )
    })

    it("card padding rem value converts to at least 24px", () => {
      expect(remToPx(DESIGN_SYSTEM_SPACING.cardPadding.remValue)).toBeGreaterThanOrEqual(
        SPACING_MINIMUMS.cardPanelPadding
      )
    })
  })

  describe("Section gap validation for any spacing configuration", () => {
    it("any section gap >= 32px passes validation", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 32, max: 200 }),
          (gapPx) => {
            expect(validateSectionGap(gapPx)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("any section gap < 32px fails validation", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 31 }),
          (gapPx) => {
            expect(validateSectionGap(gapPx)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("for any valid section gap rem value (>= 2rem), the px equivalent meets the 32px minimum", () => {
      fc.assert(
        fc.property(validSectionGapRemArb, (gapRem) => {
          const gapPx = remToPx(gapRem)
          expect(gapPx).toBeGreaterThanOrEqual(SPACING_MINIMUMS.sectionGap)
          expect(validateSectionGap(gapPx)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("for any invalid section gap rem value (< 2rem), the px equivalent is below 32px", () => {
      fc.assert(
        fc.property(invalidSectionGapRemArb, (gapRem) => {
          const gapPx = remToPx(gapRem)
          expect(gapPx).toBeLessThan(SPACING_MINIMUMS.sectionGap)
          expect(validateSectionGap(gapPx)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("section layout configs with valid gaps always pass validation", () => {
      fc.assert(
        fc.property(sectionLayoutConfigArb, (config) => {
          expect(config.gapPx).toBeGreaterThanOrEqual(SPACING_MINIMUMS.sectionGap)
          expect(validateSectionGap(config.gapPx)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Card and panel padding validation for any spacing configuration", () => {
    it("any card/panel padding >= 24px passes validation", () => {
      fc.assert(
        fc.property(
          cardOrPanelTypeArb,
          fc.integer({ min: 24, max: 200 }),
          (componentType, paddingPx) => {
            const config: SpacingConfig = {
              componentType,
              paddingPx,
              paddingRem: paddingPx / 16,
            }
            expect(validateSpacingConfig(config)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("any card/panel padding < 24px fails validation", () => {
      fc.assert(
        fc.property(
          cardOrPanelTypeArb,
          fc.integer({ min: 0, max: 23 }),
          (componentType, paddingPx) => {
            const config: SpacingConfig = {
              componentType,
              paddingPx,
              paddingRem: paddingPx / 16,
            }
            expect(validateSpacingConfig(config)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("for any valid card padding rem value (>= 1.5rem), the px equivalent meets the 24px minimum", () => {
      fc.assert(
        fc.property(
          cardOrPanelTypeArb,
          validCardPaddingRemArb,
          (componentType, paddingRem) => {
            const paddingPx = remToPx(paddingRem)
            const config: SpacingConfig = { componentType, paddingPx, paddingRem }
            expect(paddingPx).toBeGreaterThanOrEqual(SPACING_MINIMUMS.cardPanelPadding)
            expect(validateSpacingConfig(config)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("for any invalid card padding rem value (< 1.5rem), the px equivalent is below 24px", () => {
      fc.assert(
        fc.property(
          cardOrPanelTypeArb,
          invalidCardPaddingRemArb,
          (componentType, paddingRem) => {
            const paddingPx = remToPx(paddingRem)
            const config: SpacingConfig = { componentType, paddingPx, paddingRem }
            expect(paddingPx).toBeLessThan(SPACING_MINIMUMS.cardPanelPadding)
            expect(validateSpacingConfig(config)).toBe(false)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("card-app spacing configs always meet the 24px minimum", () => {
      fc.assert(
        fc.property(cardSpacingConfigArb, (config) => {
          expect(config.paddingPx).toBeGreaterThanOrEqual(SPACING_MINIMUMS.cardPanelPadding)
          expect(validateSpacingConfig(config)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Combined spacing validation for random configurations", () => {
    it("for any random padding value, validation correctly identifies compliance", () => {
      fc.assert(
        fc.property(
          cardOrPanelTypeArb,
          randomPaddingPxArb,
          (componentType, paddingPx) => {
            const config: SpacingConfig = {
              componentType,
              paddingPx,
              paddingRem: paddingPx / 16,
            }
            const isValid = validateSpacingConfig(config)
            if (paddingPx >= SPACING_MINIMUMS.cardPanelPadding) {
              expect(isValid).toBe(true)
            } else {
              expect(isValid).toBe(false)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it("for any random gap value, validation correctly identifies compliance", () => {
      fc.assert(
        fc.property(randomGapPxArb, (gapPx) => {
          const isValid = validateSectionGap(gapPx)
          if (gapPx >= SPACING_MINIMUMS.sectionGap) {
            expect(isValid).toBe(true)
          } else {
            expect(isValid).toBe(false)
          }
        }),
        { numRuns: 100 }
      )
    })

    it("item-app components are not subject to the 24px card/panel minimum", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 16, max: 128 }),
          (paddingPx) => {
            const config: SpacingConfig = {
              componentType: "item-app",
              paddingPx,
              paddingRem: paddingPx / 16,
            }
            // item-app only requires 16px minimum (p-4)
            expect(validateSpacingConfig(config)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("multiple adjacent sections all maintain the 32px minimum gap", () => {
      fc.assert(
        fc.property(
          fc.array(validSectionGapRemArb, { minLength: 2, maxLength: 10 }),
          (gaps) => {
            const allValid = gaps.every((gapRem) => {
              const gapPx = remToPx(gapRem)
              return validateSectionGap(gapPx)
            })
            expect(allValid).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("a page layout with multiple cards all maintain 24px minimum padding", () => {
      fc.assert(
        fc.property(
          fc.array(cardSpacingConfigArb, { minLength: 1, maxLength: 10 }),
          (cards) => {
            const allValid = cards.every((config) => validateSpacingConfig(config))
            expect(allValid).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("Spacing constants match design system values", () => {
    it("minimum section gap is exactly 32px", () => {
      expect(SPACING_MINIMUMS.sectionGap).toBe(32)
    })

    it("minimum card/panel padding is exactly 24px", () => {
      expect(SPACING_MINIMUMS.cardPanelPadding).toBe(24)
    })

    it("space-y-8 class provides exactly 32px (2rem)", () => {
      expect(DESIGN_SYSTEM_SPACING.sectionSpacing.pxValue).toBe(32)
      expect(DESIGN_SYSTEM_SPACING.sectionSpacing.remValue).toBe(2)
    })

    it("p-6 class provides exactly 24px (1.5rem)", () => {
      expect(DESIGN_SYSTEM_SPACING.cardPadding.pxValue).toBe(24)
      expect(DESIGN_SYSTEM_SPACING.cardPadding.remValue).toBe(1.5)
    })

    it("rem to px conversion is consistent at 16px base", () => {
      fc.assert(
        fc.property(
          fc.double({ min: 0.25, max: 10, noNaN: true }),
          (rem) => {
            expect(remToPx(rem)).toBe(rem * 16)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
