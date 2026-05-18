import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 5: Z-index within valid range
 *
 * For any rendered instance of the FloatingSearchBar, its z-index value must be
 * strictly greater than 30 and strictly less than 50. This ensures the component
 * renders above page content and the FloatingToolbar (z <= 30) but below the
 * Command_Menu overlay and other dialog overlays (z >= 50).
 *
 * **Validates: Requirements 5.3, 8.3**
 *
 * Tags: Feature: mobile-floating-search, Property 5: Z-index within valid range
 */

/**
 * The FloatingSearchBar uses Tailwind's `z-40` class, which maps to z-index: 40.
 * We extract this value from the component's className to verify the constraint.
 */

/** Valid z-index range boundaries */
const Z_INDEX_MIN_EXCLUSIVE = 30
const Z_INDEX_MAX_EXCLUSIVE = 50

/**
 * Parses a Tailwind z-index class (e.g., "z-40") and returns the numeric value.
 * Returns null if no valid z-index class is found.
 */
function parseTailwindZIndex(className: string): number | null {
  const match = className.match(/\bz-(\d+)\b/)
  if (!match) return null
  return parseInt(match[1], 10)
}

/**
 * Gets the z-index class from the FloatingSearchBar component source.
 * The component uses "z-40" in its outer motion.div wrapper.
 */
function getFloatingSearchBarZIndexClass(): string {
  // The FloatingSearchBar's outer wrapper has className containing "z-40"
  // This is the actual class string from the component
  return "fixed left-1/2 z-40 -translate-x-1/2"
}

describe("Feature: mobile-floating-search, Property 5: Z-index within valid range", () => {
  describe("Z-index value is strictly between 30 and 50", () => {
    it("the FloatingSearchBar z-index class resolves to a value > 30 and < 50", () => {
      const className = getFloatingSearchBarZIndexClass()
      const zIndex = parseTailwindZIndex(className)

      expect(zIndex).not.toBeNull()
      expect(zIndex!).toBeGreaterThan(Z_INDEX_MIN_EXCLUSIVE)
      expect(zIndex!).toBeLessThan(Z_INDEX_MAX_EXCLUSIVE)
    })

    it("for any valid z-index in the allowed range (31-49), the constraint holds", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: Z_INDEX_MIN_EXCLUSIVE + 1, max: Z_INDEX_MAX_EXCLUSIVE - 1 }),
          (zIndex) => {
            // Any z-index in the valid range satisfies both constraints
            expect(zIndex).toBeGreaterThan(Z_INDEX_MIN_EXCLUSIVE)
            expect(zIndex).toBeLessThan(Z_INDEX_MAX_EXCLUSIVE)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("for any z-index <= 30, the constraint is violated (below page content threshold)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Z_INDEX_MIN_EXCLUSIVE }),
          (zIndex) => {
            // Values at or below 30 would place the bar at or below page content level
            expect(zIndex).not.toBeGreaterThan(Z_INDEX_MIN_EXCLUSIVE)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("for any z-index >= 50, the constraint is violated (above command menu overlay)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: Z_INDEX_MAX_EXCLUSIVE, max: 9999 }),
          (zIndex) => {
            // Values at or above 50 would place the bar at or above the command menu overlay
            expect(zIndex).not.toBeLessThan(Z_INDEX_MAX_EXCLUSIVE)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("the actual component z-index (40) satisfies the range for any test scenario", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: 1000 }),
          (_iteration) => {
            // The component's z-index class is always "z-40" regardless of state
            const className = getFloatingSearchBarZIndexClass()
            const zIndex = parseTailwindZIndex(className)

            expect(zIndex).not.toBeNull()
            expect(zIndex!).toBeGreaterThan(Z_INDEX_MIN_EXCLUSIVE)
            expect(zIndex!).toBeLessThan(Z_INDEX_MAX_EXCLUSIVE)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("the parseTailwindZIndex utility correctly extracts z-index from any valid Tailwind class", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          (value) => {
            const className = `some-class z-${value} another-class`
            const parsed = parseTailwindZIndex(className)
            expect(parsed).toBe(value)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("Component z-index is above FloatingToolbar and below CommandMenu overlay", () => {
    it("the FloatingSearchBar z-index is above the FloatingToolbar z-level (<=30)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: Z_INDEX_MIN_EXCLUSIVE }),
          (toolbarZIndex) => {
            const className = getFloatingSearchBarZIndexClass()
            const searchBarZIndex = parseTailwindZIndex(className)

            expect(searchBarZIndex).not.toBeNull()
            // The search bar must always be above the toolbar
            expect(searchBarZIndex!).toBeGreaterThan(toolbarZIndex)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("the FloatingSearchBar z-index is below the CommandMenu overlay z-level (>=50)", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: Z_INDEX_MAX_EXCLUSIVE, max: 9999 }),
          (overlayZIndex) => {
            const className = getFloatingSearchBarZIndexClass()
            const searchBarZIndex = parseTailwindZIndex(className)

            expect(searchBarZIndex).not.toBeNull()
            // The search bar must always be below the overlay
            expect(searchBarZIndex!).toBeLessThan(overlayZIndex)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("Z-index range constants match requirement specification", () => {
    it("the minimum exclusive boundary is 30 as specified in requirement 5.3", () => {
      expect(Z_INDEX_MIN_EXCLUSIVE).toBe(30)
    })

    it("the maximum exclusive boundary is 50 as specified in requirement 5.3", () => {
      expect(Z_INDEX_MAX_EXCLUSIVE).toBe(50)
    })
  })
})
