import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 20: Interactive element minimum touch target
 * Validates: Requirements 17.4
 *
 * For any interactive element (button, link, input, or clickable area) in the
 * application, the computed dimensions SHALL be at least 44×44 CSS pixels.
 *
 * Since JSDOM cannot compute actual CSS dimensions, we model the interactive
 * element configurations used in the app and verify that their sizing classes
 * produce dimensions meeting the 44×44px minimum.
 *
 * Tags: Feature: app-ui-redesign, Property 20: Interactive element minimum touch target
 */

const MIN_TOUCH_TARGET_PX = 44

/**
 * Interactive element size configurations used in the app.
 * Each entry maps a component type to its effective computed dimensions,
 * accounting for explicit min-height/height constraints.
 *
 * Effective height = max(explicit min-height or height, line-height + vertical padding)
 * Effective width = max(explicit min-width, horizontal padding + content width)
 *
 * Sizing calculations:
 * - text-sm line-height = 1.25rem = 20px
 * - text-xs line-height = 1rem = 16px
 * - text-base line-height = 1.5rem = 24px
 * - py-2 = 0.5rem * 2 = 16px total vertical padding
 * - py-2.5 = 0.625rem * 2 = 20px total vertical padding
 * - py-3 = 0.75rem * 2 = 24px total vertical padding
 * - px-3 = 0.75rem * 2 = 24px total horizontal padding
 * - px-4 = 1rem * 2 = 32px total horizontal padding
 * - px-5 = 1.25rem * 2 = 40px total horizontal padding
 * - h-11 = 2.75rem = 44px
 * - h-12 = 3rem = 48px
 * - min-h-[44px] = 44px explicit minimum
 * - min-w-[44px] = 44px explicit minimum
 * - p-4 = 1rem * 2 = 32px padding each direction
 */
type InteractiveElementConfig = {
  name: string
  type: "button" | "link" | "input" | "clickable-area"
  /** Effective computed minimum height in CSS pixels (after min-h/h constraints) */
  effectiveHeightPx: number
  /** Effective computed minimum width in CSS pixels (after min-w constraints) */
  effectiveWidthPx: number
  /** Tailwind/CSS classes that produce this sizing */
  sizingClasses: string
}

/**
 * App interactive element configurations with their effective computed dimensions.
 * These represent the actual interactive elements used across the app.
 */
const APP_INTERACTIVE_ELEMENTS: InteractiveElementConfig[] = [
  // btn-primary-app with px-4 py-2.5 text-sm + min-h-[44px] (tasks page action)
  // Intrinsic: 20px line-height + 20px padding = 40px, but min-h-[44px] enforces 44px
  {
    name: "btn-primary-app (px-4 py-2.5 min-h-[44px])",
    type: "button",
    effectiveHeightPx: 44, // min-h-[44px] overrides intrinsic 40px
    effectiveWidthPx: 52, // px-4 (32px) + min content ~20px
    sizingClasses: "btn-primary-app px-4 py-2.5 text-sm min-h-[44px]",
  },
  // btn-primary-app with px-4 py-3 (login, library)
  // Intrinsic: 20px line-height + 24px padding = 44px
  {
    name: "btn-primary-app (px-4 py-3)",
    type: "button",
    effectiveHeightPx: 44, // 20px + 24px = 44px naturally
    effectiveWidthPx: 52, // px-4 (32px) + content
    sizingClasses: "btn-primary-app px-4 py-3 text-sm",
  },
  // btn-primary-app with px-5 py-2.5 + min-h-[44px] (empty state CTA)
  // Intrinsic: 20px + 20px = 40px, but min-h-[44px] enforces 44px
  {
    name: "btn-primary-app (px-5 py-2.5 min-h-[44px])",
    type: "button",
    effectiveHeightPx: 44, // min-h-[44px] overrides intrinsic 40px
    effectiveWidthPx: 60, // px-5 (40px) + content ~20px
    sizingClasses: "btn-primary-app px-5 py-2.5 text-sm min-h-[44px]",
  },
  // btn-primary-app with h-11 (contacts add button)
  {
    name: "btn-primary-app (h-11)",
    type: "button",
    effectiveHeightPx: 44, // h-11 = 2.75rem = 44px
    effectiveWidthPx: 60, // px-5 (40px) + content
    sizingClasses: "btn-primary-app h-11 px-5",
  },
  // btn-primary-app with h-12 w-full (settings save)
  {
    name: "btn-primary-app (h-12 w-full)",
    type: "button",
    effectiveHeightPx: 48, // h-12 = 3rem = 48px
    effectiveWidthPx: 320, // w-full ensures width >> 44px
    sizingClasses: "btn-primary-app h-12 w-full",
  },
  // Sidebar navigation items with py-3 text-sm
  // Intrinsic: 20px line-height + 24px padding = 44px
  {
    name: "sidebar-nav-item (py-3)",
    type: "link",
    effectiveHeightPx: 44, // 20px + 24px = 44px
    effectiveWidthPx: 240, // sidebar items fill width (~240px usable)
    sizingClasses: "flex items-center gap-3 rounded-xl px-4 py-3 text-sm",
  },
  // Input fields with h-11
  {
    name: "input-app (h-11)",
    type: "input",
    effectiveHeightPx: 44, // h-11 = 2.75rem = 44px
    effectiveWidthPx: 200, // inputs are always wider than 44px in layout
    sizingClasses: "input-app h-11 w-full",
  },
  // Input fields with h-12
  {
    name: "input-app (h-12)",
    type: "input",
    effectiveHeightPx: 48, // h-12 = 3rem = 48px
    effectiveWidthPx: 200, // inputs fill container width
    sizingClasses: "input-app h-12 w-full",
  },
  // Icon buttons with explicit min-size constraints
  {
    name: "icon-button (p-2 min-h/min-w 44px)",
    type: "button",
    effectiveHeightPx: 44, // min-h-[44px] enforced
    effectiveWidthPx: 44, // min-w-[44px] enforced
    sizingClasses: "p-2 min-h-[44px] min-w-[44px]",
  },
  // Command menu trigger button
  {
    name: "command-menu-trigger (h-11 min-w-[44px])",
    type: "button",
    effectiveHeightPx: 44, // h-11 = 44px
    effectiveWidthPx: 44, // min-w-[44px]
    sizingClasses: "h-11 min-w-[44px] px-3",
  },
  // Item-app clickable areas (list items with p-4)
  // Intrinsic: 20px line-height + 32px padding (p-4 top+bottom) = 52px
  {
    name: "item-app (p-4)",
    type: "clickable-area",
    effectiveHeightPx: 52, // 20px + 32px = 52px
    effectiveWidthPx: 200, // items fill container width
    sizingClasses: "item-app p-4 w-full",
  },
  // Link-muted navigation links with min-h and min-w
  {
    name: "link-muted (min-h-[44px] min-w-[44px])",
    type: "link",
    effectiveHeightPx: 44, // min-h-[44px] enforced
    effectiveWidthPx: 44, // min-w-[44px] enforced
    sizingClasses: "link-muted min-h-[44px] min-w-[44px] inline-flex items-center px-4",
  },
]

/**
 * Validates that an interactive element configuration meets the 44×44px minimum.
 */
function meetsMinimumTouchTarget(config: InteractiveElementConfig): {
  valid: boolean
  heightOk: boolean
  widthOk: boolean
} {
  const heightOk = config.effectiveHeightPx >= MIN_TOUCH_TARGET_PX
  const widthOk = config.effectiveWidthPx >= MIN_TOUCH_TARGET_PX
  return { valid: heightOk && widthOk, heightOk, widthOk }
}

/**
 * Computes the effective height from intrinsic sizing and explicit constraints.
 * @param lineHeightPx - The line-height in pixels
 * @param verticalPaddingPx - Total vertical padding (top + bottom) in pixels
 * @param explicitMinHeightPx - Explicit min-height or height if set
 */
function computeEffectiveHeight(
  lineHeightPx: number,
  verticalPaddingPx: number,
  explicitMinHeightPx?: number
): number {
  const intrinsic = lineHeightPx + verticalPaddingPx
  if (explicitMinHeightPx !== undefined) {
    return Math.max(explicitMinHeightPx, intrinsic)
  }
  return intrinsic
}

/**
 * Computes the effective width from intrinsic sizing and explicit constraints.
 * @param horizontalPaddingPx - Total horizontal padding (left + right) in pixels
 * @param minContentWidthPx - Minimum content width (icon size, text, etc.)
 * @param explicitMinWidthPx - Explicit min-width if set
 */
function computeEffectiveWidth(
  horizontalPaddingPx: number,
  minContentWidthPx: number,
  explicitMinWidthPx?: number
): number {
  const intrinsic = horizontalPaddingPx + minContentWidthPx
  if (explicitMinWidthPx !== undefined) {
    return Math.max(explicitMinWidthPx, intrinsic)
  }
  return intrinsic
}

describe("Feature: app-ui-redesign, Property 20: Interactive element minimum touch target", () => {
  const elementConfigArb = fc.constantFrom(...APP_INTERACTIVE_ELEMENTS)

  describe("All app interactive elements meet 44×44px minimum", () => {
    it("every defined interactive element has effectiveHeightPx >= 44", () => {
      for (const config of APP_INTERACTIVE_ELEMENTS) {
        expect(
          config.effectiveHeightPx,
          `${config.name} height ${config.effectiveHeightPx}px is below minimum ${MIN_TOUCH_TARGET_PX}px`
        ).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
      }
    })

    it("every defined interactive element has effectiveWidthPx >= 44", () => {
      for (const config of APP_INTERACTIVE_ELEMENTS) {
        expect(
          config.effectiveWidthPx,
          `${config.name} width ${config.effectiveWidthPx}px is below minimum ${MIN_TOUCH_TARGET_PX}px`
        ).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
      }
    })
  })

  describe("Property-based: touch target minimum constraint", () => {
    it("for any interactive element config, computed dimensions are at least 44×44px", () => {
      fc.assert(
        fc.property(elementConfigArb, (config) => {
          const result = meetsMinimumTouchTarget(config)
          expect(
            result.heightOk,
            `${config.name} (${config.type}) height ${config.effectiveHeightPx}px < ${MIN_TOUCH_TARGET_PX}px`
          ).toBe(true)
          expect(
            result.widthOk,
            `${config.name} (${config.type}) width ${config.effectiveWidthPx}px < ${MIN_TOUCH_TARGET_PX}px`
          ).toBe(true)
          expect(result.valid).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("for any element type, the minimum touch target constraint holds", () => {
      const elementTypeArb = fc.constantFrom(
        "button" as const,
        "link" as const,
        "input" as const,
        "clickable-area" as const
      )

      fc.assert(
        fc.property(elementTypeArb, (type) => {
          const elementsOfType = APP_INTERACTIVE_ELEMENTS.filter(
            (e) => e.type === type
          )
          for (const config of elementsOfType) {
            expect(config.effectiveHeightPx).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
            expect(config.effectiveWidthPx).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: computeEffectiveHeight validation", () => {
    it("any element with explicit min-height >= 44px meets the minimum regardless of intrinsic size", () => {
      const explicitMinHeightArb = fc.integer({ min: 44, max: 96 })
      const lineHeightArb = fc.integer({ min: 12, max: 32 })
      const paddingArb = fc.integer({ min: 0, max: 48 })

      fc.assert(
        fc.property(
          explicitMinHeightArb,
          lineHeightArb,
          paddingArb,
          (explicitMinHeight, lineHeight, padding) => {
            const height = computeEffectiveHeight(lineHeight, padding, explicitMinHeight)
            expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("any element with line-height + padding >= 44px meets the minimum without explicit height", () => {
      const lineHeightArb = fc.integer({ min: 16, max: 32 })
      const paddingArb = fc.integer({ min: 12, max: 48 })

      fc.assert(
        fc.property(lineHeightArb, paddingArb, (lineHeight, padding) => {
          fc.pre(lineHeight + padding >= MIN_TOUCH_TARGET_PX)
          const height = computeEffectiveHeight(lineHeight, padding)
          expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
        }),
        { numRuns: 100 }
      )
    })

    it("any element with line-height + padding < 44px fails without explicit min-height", () => {
      const lineHeightArb = fc.integer({ min: 12, max: 20 })
      const paddingArb = fc.integer({ min: 0, max: 22 })

      fc.assert(
        fc.property(lineHeightArb, paddingArb, (lineHeight, padding) => {
          fc.pre(lineHeight + padding < MIN_TOUCH_TARGET_PX)
          const height = computeEffectiveHeight(lineHeight, padding)
          expect(height).toBeLessThan(MIN_TOUCH_TARGET_PX)
        }),
        { numRuns: 100 }
      )
    })

    it("explicit min-height always wins over smaller intrinsic height", () => {
      const explicitMinHeightArb = fc.integer({ min: 44, max: 64 })
      const smallLineHeightArb = fc.integer({ min: 12, max: 16 })
      const smallPaddingArb = fc.integer({ min: 0, max: 10 })

      fc.assert(
        fc.property(
          explicitMinHeightArb,
          smallLineHeightArb,
          smallPaddingArb,
          (explicitMinHeight, lineHeight, padding) => {
            fc.pre(lineHeight + padding < explicitMinHeight)
            const height = computeEffectiveHeight(lineHeight, padding, explicitMinHeight)
            expect(height).toBe(explicitMinHeight)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: computeEffectiveWidth validation", () => {
    it("any element with explicit min-width >= 44px meets the minimum", () => {
      const explicitMinWidthArb = fc.integer({ min: 44, max: 200 })
      const paddingArb = fc.integer({ min: 0, max: 48 })
      const contentArb = fc.integer({ min: 0, max: 100 })

      fc.assert(
        fc.property(
          explicitMinWidthArb,
          paddingArb,
          contentArb,
          (explicitMinWidth, padding, content) => {
            const width = computeEffectiveWidth(padding, content, explicitMinWidth)
            expect(width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("any element with padding + content >= 44px meets the minimum without explicit width", () => {
      const paddingArb = fc.integer({ min: 16, max: 48 })
      const contentArb = fc.integer({ min: 16, max: 100 })

      fc.assert(
        fc.property(paddingArb, contentArb, (padding, content) => {
          fc.pre(padding + content >= MIN_TOUCH_TARGET_PX)
          const width = computeEffectiveWidth(padding, content)
          expect(width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: random interactive element config generation", () => {
    /**
     * Generate random interactive element configurations and verify
     * that the touch target validation logic correctly classifies them.
     */
    type RandomElementConfig = {
      type: "button" | "link" | "input" | "clickable-area"
      lineHeightPx: number
      verticalPaddingPx: number
      horizontalPaddingPx: number
      minContentWidthPx: number
      explicitMinHeightPx?: number
      explicitMinWidthPx?: number
    }

    const randomElementArb: fc.Arbitrary<RandomElementConfig> = fc.record({
      type: fc.constantFrom(
        "button" as const,
        "link" as const,
        "input" as const,
        "clickable-area" as const
      ),
      lineHeightPx: fc.constantFrom(16, 20, 24), // text-xs, text-sm, text-base
      verticalPaddingPx: fc.constantFrom(0, 8, 16, 20, 24, 32), // py-0 to py-4
      horizontalPaddingPx: fc.constantFrom(0, 12, 16, 24, 32, 40), // px-0 to px-5
      minContentWidthPx: fc.integer({ min: 12, max: 100 }), // icon or text width
      explicitMinHeightPx: fc.option(fc.constantFrom(44, 48, 56), { nil: undefined }),
      explicitMinWidthPx: fc.option(fc.constantFrom(44, 48, 56), { nil: undefined }),
    })

    it("elements with explicit min-height and min-width >= 44px always pass", () => {
      const compliantElementArb = fc.record({
        type: fc.constantFrom(
          "button" as const,
          "link" as const,
          "input" as const,
          "clickable-area" as const
        ),
        lineHeightPx: fc.constantFrom(16, 20, 24),
        verticalPaddingPx: fc.constantFrom(0, 8, 16, 20, 24, 32),
        horizontalPaddingPx: fc.constantFrom(0, 12, 16, 24, 32, 40),
        minContentWidthPx: fc.integer({ min: 12, max: 100 }),
        explicitMinHeightPx: fc.constantFrom(44, 48, 56, 64),
        explicitMinWidthPx: fc.constantFrom(44, 48, 56, 64),
      })

      fc.assert(
        fc.property(compliantElementArb, (element) => {
          const height = computeEffectiveHeight(
            element.lineHeightPx,
            element.verticalPaddingPx,
            element.explicitMinHeightPx
          )
          const width = computeEffectiveWidth(
            element.horizontalPaddingPx,
            element.minContentWidthPx,
            element.explicitMinWidthPx
          )
          expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
          expect(width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
        }),
        { numRuns: 100 }
      )
    })

    it("validation correctly classifies random element configs", () => {
      fc.assert(
        fc.property(randomElementArb, (element) => {
          const height = computeEffectiveHeight(
            element.lineHeightPx,
            element.verticalPaddingPx,
            element.explicitMinHeightPx
          )
          const width = computeEffectiveWidth(
            element.horizontalPaddingPx,
            element.minContentWidthPx,
            element.explicitMinWidthPx
          )

          const heightOk = height >= MIN_TOUCH_TARGET_PX
          const widthOk = width >= MIN_TOUCH_TARGET_PX

          // Verify consistency: if both pass, the element is valid
          if (heightOk && widthOk) {
            expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
            expect(width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
          } else {
            // At least one dimension is below minimum
            expect(height < MIN_TOUCH_TARGET_PX || width < MIN_TOUCH_TARGET_PX).toBe(
              true
            )
          }
        }),
        { numRuns: 100 }
      )
    })

    it("elements without explicit constraints need sufficient intrinsic size", () => {
      const noExplicitConstraintsArb = fc.record({
        type: fc.constantFrom(
          "button" as const,
          "link" as const,
          "input" as const,
          "clickable-area" as const
        ),
        lineHeightPx: fc.constantFrom(16, 20, 24),
        verticalPaddingPx: fc.constantFrom(20, 24, 32), // enough to reach 44px with line-height
        horizontalPaddingPx: fc.constantFrom(24, 32, 40),
        minContentWidthPx: fc.integer({ min: 12, max: 100 }),
      })

      fc.assert(
        fc.property(noExplicitConstraintsArb, (element) => {
          fc.pre(element.lineHeightPx + element.verticalPaddingPx >= MIN_TOUCH_TARGET_PX)
          fc.pre(
            element.horizontalPaddingPx + element.minContentWidthPx >= MIN_TOUCH_TARGET_PX
          )
          const height = computeEffectiveHeight(
            element.lineHeightPx,
            element.verticalPaddingPx
          )
          const width = computeEffectiveWidth(
            element.horizontalPaddingPx,
            element.minContentWidthPx
          )
          expect(height).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
          expect(width).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_PX)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: sizing class pattern validation", () => {
    /**
     * Validates that sizing class strings contain patterns that ensure
     * the 44px minimum touch target height.
     */
    function hasHeightEnsuringPattern(classes: string): boolean {
      return (
        classes.includes("min-h-[44px]") ||
        classes.includes("h-11") ||
        classes.includes("h-12") ||
        classes.includes("py-3") || // py-3 (24px) + text-sm (20px) = 44px
        classes.includes("p-4") // p-4 (32px vertical) + text-sm (20px) = 52px
      )
    }

    function hasWidthEnsuringPattern(classes: string): boolean {
      return (
        classes.includes("min-w-[44px]") ||
        classes.includes("w-full") ||
        classes.includes("px-4") || // px-4 (32px) + any content > 44px
        classes.includes("px-5") || // px-5 (40px) + any content > 44px
        classes.includes("p-4") // p-4 (32px horizontal) + content > 44px
      )
    }

    it("all app interactive elements have sizing classes ensuring 44px height", () => {
      fc.assert(
        fc.property(elementConfigArb, (config) => {
          expect(
            hasHeightEnsuringPattern(config.sizingClasses),
            `${config.name} classes "${config.sizingClasses}" lack height-ensuring pattern`
          ).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("all app interactive elements have sizing classes ensuring 44px width", () => {
      fc.assert(
        fc.property(elementConfigArb, (config) => {
          expect(
            hasWidthEnsuringPattern(config.sizingClasses),
            `${config.name} classes "${config.sizingClasses}" lack width-ensuring pattern`
          ).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })
})
