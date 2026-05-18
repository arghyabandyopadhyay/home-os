// Feature: pwa-installable, Property 6: Safe-area padding applied to fixed layout elements

import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import * as fs from "node:fs"
import * as path from "node:path"

/**
 * Property 6: Safe-area padding applied to fixed layout elements
 *
 * For any fixed-position layout element (sidebar, header) and the outermost
 * app shell container, the computed CSS SHALL include env(safe-area-inset-top),
 * env(safe-area-inset-bottom), env(safe-area-inset-left), and
 * env(safe-area-inset-right) padding rules to prevent content from being
 * obscured by device notches or system UI.
 *
 * **Validates: Requirements 7.2**
 */

/** The safe-area CSS classes and their expected env() inset rules */
const SAFE_AREA_CLASSES = {
  "safe-area-shell": {
    description: "Outermost app shell container",
    expectedInsets: [
      "env(safe-area-inset-top)",
      "env(safe-area-inset-bottom)",
      "env(safe-area-inset-left)",
      "env(safe-area-inset-right)",
    ],
  },
  "safe-area-sidebar": {
    description: "Fixed-position sidebar",
    expectedInsets: [
      "env(safe-area-inset-top)",
      "env(safe-area-inset-bottom)",
      "env(safe-area-inset-left)",
    ],
  },
  "safe-area-header": {
    description: "Sticky/fixed header",
    expectedInsets: [
      "env(safe-area-inset-top)",
      "env(safe-area-inset-right)",
    ],
  },
} as const

type SafeAreaClassName = keyof typeof SAFE_AREA_CLASSES

/** All safe-area class names */
const SAFE_AREA_CLASS_NAMES: SafeAreaClassName[] = [
  "safe-area-shell",
  "safe-area-sidebar",
  "safe-area-header",
]

/** All four safe-area inset directions */
const ALL_SAFE_AREA_INSETS = [
  "env(safe-area-inset-top)",
  "env(safe-area-inset-bottom)",
  "env(safe-area-inset-left)",
  "env(safe-area-inset-right)",
] as const

/** Read the globals.css file content */
function readGlobalsCss(): string {
  const cssPath = path.resolve(__dirname, "../../app/globals.css")
  return fs.readFileSync(cssPath, "utf-8")
}

/**
 * Extracts the CSS rule block for a given class selector from the CSS content.
 * Returns the content between the opening { and closing } of the class rule.
 */
function extractClassRuleBlock(cssContent: string, className: string): string | null {
  // Match the class selector and its rule block (handles nested braces)
  const escapedClassName = className.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const regex = new RegExp(`\\.${escapedClassName}\\s*\\{([^}]+)\\}`, "s")
  const match = cssContent.match(regex)
  return match ? match[1] : null
}

/**
 * Checks if a CSS rule block contains a specific env(safe-area-inset-*) value.
 */
function ruleBlockContainsInset(ruleBlock: string, inset: string): boolean {
  return ruleBlock.includes(inset)
}

/** Arbitrary for generating random safe-area class names */
const safeAreaClassArb: fc.Arbitrary<SafeAreaClassName> = fc.constantFrom(...SAFE_AREA_CLASS_NAMES)

describe("Feature: pwa-installable, Property 6: Safe-area padding applied to fixed layout elements", () => {
  const cssContent = readGlobalsCss()

  describe("Safe-area CSS classes exist in globals.css", () => {
    it("globals.css contains safe-area rules within @supports block", () => {
      expect(cssContent).toContain("@supports (padding-top: env(safe-area-inset-top))")
    })

    it("all safe-area classes are defined", () => {
      for (const className of SAFE_AREA_CLASS_NAMES) {
        const ruleBlock = extractClassRuleBlock(cssContent, className)
        expect(ruleBlock, `Class .${className} should be defined in globals.css`).not.toBeNull()
      }
    })
  })

  describe("For any safe-area class, the expected env(safe-area-inset-*) rules are present", () => {
    it("for any randomly selected safe-area class, all its expected insets are present in the CSS", () => {
      fc.assert(
        fc.property(safeAreaClassArb, (className) => {
          const ruleBlock = extractClassRuleBlock(cssContent, className)
          expect(ruleBlock, `Class .${className} should exist`).not.toBeNull()

          const expectedInsets = SAFE_AREA_CLASSES[className].expectedInsets
          for (const inset of expectedInsets) {
            expect(
              ruleBlockContainsInset(ruleBlock!, inset),
              `.${className} should contain ${inset}`
            ).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })

    it("the app shell container (.safe-area-shell) includes ALL four safe-area insets", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...ALL_SAFE_AREA_INSETS),
          (inset) => {
            const ruleBlock = extractClassRuleBlock(cssContent, "safe-area-shell")
            expect(ruleBlock).not.toBeNull()
            expect(
              ruleBlockContainsInset(ruleBlock!, inset),
              `.safe-area-shell should contain ${inset}`
            ).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("for any fixed-position element class, at least env(safe-area-inset-top) is present", () => {
      fc.assert(
        fc.property(safeAreaClassArb, (className) => {
          const ruleBlock = extractClassRuleBlock(cssContent, className)
          expect(ruleBlock).not.toBeNull()
          expect(
            ruleBlockContainsInset(ruleBlock!, "env(safe-area-inset-top)"),
            `.${className} should always include top inset`
          ).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Safe-area insets use padding properties", () => {
    it("for any safe-area class, insets are applied via padding-* properties", () => {
      fc.assert(
        fc.property(safeAreaClassArb, (className) => {
          const ruleBlock = extractClassRuleBlock(cssContent, className)
          expect(ruleBlock).not.toBeNull()

          const expectedInsets = SAFE_AREA_CLASSES[className].expectedInsets
          for (const inset of expectedInsets) {
            // Extract the direction from the inset (e.g., "top" from "env(safe-area-inset-top)")
            const directionMatch = inset.match(/safe-area-inset-(\w+)/)
            expect(directionMatch).not.toBeNull()
            const direction = directionMatch![1]

            // Verify the padding-{direction} property uses this env() value
            const paddingRegex = new RegExp(
              `padding-${direction}\\s*:\\s*env\\(safe-area-inset-${direction}\\)`
            )
            expect(
              paddingRegex.test(ruleBlock!),
              `.${className} should have padding-${direction}: ${inset}`
            ).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Completeness: shell class covers all four directions", () => {
    it("for any of the four safe-area directions, .safe-area-shell has a corresponding padding rule", () => {
      const directions = ["top", "bottom", "left", "right"] as const

      fc.assert(
        fc.property(fc.constantFrom(...directions), (direction) => {
          const ruleBlock = extractClassRuleBlock(cssContent, "safe-area-shell")
          expect(ruleBlock).not.toBeNull()

          const paddingRegex = new RegExp(
            `padding-${direction}\\s*:\\s*env\\(safe-area-inset-${direction}\\)`
          )
          expect(
            paddingRegex.test(ruleBlock!),
            `.safe-area-shell should have padding-${direction}: env(safe-area-inset-${direction})`
          ).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })
})
