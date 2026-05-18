import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import * as fs from "node:fs"
import * as path from "node:path"

/**
 * Property 14: Landing page token preservation
 * Validates: Requirements 15.3
 *
 * For any CSS custom property (--home-*, --background, --foreground, --border,
 * --muted, --muted-foreground, --primary, --primary-foreground) referenced by
 * landing page components, the computed value in the marketing route context
 * must remain identical after redesign changes.
 *
 * Tags: Feature: app-ui-redesign, Property 14: Landing page token preservation
 */

// --- Expected original token values (from globals.css baseline) ---

type TokenDefinition = {
  name: string
  rootValue: string
  darkValue: string
}

/**
 * These are the canonical token values that landing page components depend on.
 * Any change to these values would break the landing page's visual appearance.
 */
const EXPECTED_TOKENS: TokenDefinition[] = [
  // --home-* tokens (landing page palette)
  { name: "--home-bg", rootValue: "#f4f4f5", darkValue: "#09090b" },
  { name: "--home-surface", rootValue: "#ffffff", darkValue: "#111118" },
  { name: "--home-elevated", rootValue: "#fafafa", darkValue: "#18181b" },
  { name: "--home-border", rootValue: "rgba(0, 0, 0, 0.08)", darkValue: "rgba(255, 255, 255, 0.1)" },
  { name: "--home-text", rootValue: "#18181b", darkValue: "#fafafa" },
  { name: "--home-muted", rootValue: "#6d6d76", darkValue: "#a1a1aa" },
  // Shared design system tokens (used by both landing and app)
  { name: "--background", rootValue: "oklch(1 0 0)", darkValue: "oklch(0.145 0 0)" },
  { name: "--foreground", rootValue: "oklch(0.145 0 0)", darkValue: "oklch(0.985 0 0)" },
  { name: "--border", rootValue: "oklch(0.922 0 0)", darkValue: "oklch(1 0 0 / 10%)" },
  { name: "--muted", rootValue: "oklch(0.97 0 0)", darkValue: "oklch(0.269 0 0)" },
  { name: "--muted-foreground", rootValue: "oklch(0.556 0 0)", darkValue: "oklch(0.708 0 0)" },
  { name: "--primary", rootValue: "oklch(0.205 0 0)", darkValue: "oklch(0.922 0 0)" },
  { name: "--primary-foreground", rootValue: "oklch(0.985 0 0)", darkValue: "oklch(0.205 0 0)" },
]

// --- CSS parsing utilities ---

/**
 * Reads the globals.css file and returns its content.
 */
function readGlobalsCss(): string {
  const globalsPath = path.resolve(__dirname, "../../app/globals.css")
  return fs.readFileSync(globalsPath, "utf-8")
}

/**
 * Normalizes a CSS value for comparison by:
 * - Trimming whitespace
 * - Removing trailing semicolons
 * - Normalizing internal whitespace (multiple spaces → single space)
 */
function normalizeCssValue(value: string): string {
  return value
    .trim()
    .replace(/;$/, "")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Extracts the value of a CSS custom property from a specific block in the CSS content.
 * Handles both :root and .dark blocks, accounting for multiple :root blocks.
 *
 * @param css - The full CSS file content
 * @param tokenName - The CSS custom property name (e.g., "--home-bg")
 * @param context - "root" for :root block, "dark" for .dark block
 * @returns The extracted value or null if not found
 */
function extractTokenValue(css: string, tokenName: string, context: "root" | "dark"): string | null {
  // Match all blocks for the given context
  const blockPattern = context === "root"
    ? /:root\s*\{([^}]*)\}/g
    : /\.dark\s*\{([^}]*)\}/g

  let match: RegExpExecArray | null
  const blocks: string[] = []

  while ((match = blockPattern.exec(css)) !== null) {
    blocks.push(match[1])
  }

  // Search through all matching blocks for the token
  // Later definitions override earlier ones (CSS cascade)
  let foundValue: string | null = null

  for (const block of blocks) {
    // Match the specific property declaration
    // Escape the -- prefix for regex
    const escapedName = tokenName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const propPattern = new RegExp(`${escapedName}\\s*:\\s*([^;]+);`, "m")
    const propMatch = block.match(propPattern)

    if (propMatch) {
      foundValue = normalizeCssValue(propMatch[1])
    }
  }

  return foundValue
}

// --- Tests ---

describe("Feature: app-ui-redesign, Property 14: Landing page token preservation", () => {
  const cssContent = readGlobalsCss()

  describe("Direct token value verification", () => {
    it("all expected :root token values are preserved in globals.css", () => {
      for (const token of EXPECTED_TOKENS) {
        const actual = extractTokenValue(cssContent, token.name, "root")
        const expected = normalizeCssValue(token.rootValue)

        expect(
          actual,
          `Token ${token.name} in :root should be "${expected}" but got "${actual}". ` +
          `Landing page components depend on this value remaining unchanged.`
        ).toBe(expected)
      }
    })

    it("all expected .dark token values are preserved in globals.css", () => {
      for (const token of EXPECTED_TOKENS) {
        const actual = extractTokenValue(cssContent, token.name, "dark")
        const expected = normalizeCssValue(token.darkValue)

        expect(
          actual,
          `Token ${token.name} in .dark should be "${expected}" but got "${actual}". ` +
          `Landing page components depend on this value remaining unchanged.`
        ).toBe(expected)
      }
    })
  })

  describe("Property-based: token preservation holds for any token selection", () => {
    // Arbitrary that picks a random token from the expected set
    const tokenIndexArb = fc.integer({ min: 0, max: EXPECTED_TOKENS.length - 1 })
    const contextArb = fc.constantFrom("root", "dark") as fc.Arbitrary<"root" | "dark">

    it("for any token and context combination, the value matches the expected original", () => {
      fc.assert(
        fc.property(tokenIndexArb, contextArb, (index, context) => {
          const token = EXPECTED_TOKENS[index]
          const expectedValue = normalizeCssValue(
            context === "root" ? token.rootValue : token.darkValue
          )
          const actualValue = extractTokenValue(cssContent, token.name, context)

          expect(
            actualValue,
            `Token ${token.name} in ${context === "root" ? ":root" : ".dark"} ` +
            `expected "${expectedValue}" but got "${actualValue}". ` +
            `This token is referenced by landing page components and must not change.`
          ).toBe(expectedValue)
        }),
        { numRuns: 150 }
      )
    })

    it("tokens are never removed from globals.css (always extractable)", () => {
      fc.assert(
        fc.property(tokenIndexArb, contextArb, (index, context) => {
          const token = EXPECTED_TOKENS[index]
          const value = extractTokenValue(cssContent, token.name, context)

          expect(
            value,
            `Token ${token.name} must exist in ${context === "root" ? ":root" : ".dark"} block. ` +
            `Removing this token would break landing page components.`
          ).not.toBeNull()
        }),
        { numRuns: 150 }
      )
    })

    it("token names are never renamed (original names still present)", () => {
      // Generate random subsets of tokens to verify they all exist
      const tokenSubsetArb = fc.shuffledSubarray(EXPECTED_TOKENS, { minLength: 1 })

      fc.assert(
        fc.property(tokenSubsetArb, (tokens) => {
          for (const token of tokens) {
            // Verify the token name appears in the CSS file
            expect(
              cssContent.includes(token.name),
              `Token "${token.name}" must still be present in globals.css. ` +
              `Renaming tokens would break landing page component references.`
            ).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Structural preservation checks", () => {
    it("globals.css contains :root blocks with home tokens", () => {
      const hasRootBlock = /:root\s*\{[^}]*--home-bg/s.test(cssContent)
      expect(
        hasRootBlock,
        "globals.css must contain a :root block defining --home-bg"
      ).toBe(true)
    })

    it("globals.css contains .dark blocks with home tokens", () => {
      const hasDarkBlock = /\.dark\s*\{[^}]*--home-bg/s.test(cssContent)
      expect(
        hasDarkBlock,
        "globals.css must contain a .dark block defining --home-bg"
      ).toBe(true)
    })

    it("no token overrides exist that would affect marketing route context", () => {
      // Verify that --home-* tokens are NOT scoped/overridden in a way that
      // would change their values in the marketing route context.
      // Marketing route inherits from :root and .dark — any override scoped
      // to (app) is fine, but overrides at :root/.dark level would affect marketing.
      //
      // Count occurrences of each --home-* token definition in :root blocks.
      // There should be exactly one definition per token per context.
      const homeTokenNames = EXPECTED_TOKENS
        .filter(t => t.name.startsWith("--home-"))
        .map(t => t.name)

      for (const tokenName of homeTokenNames) {
        const escapedName = tokenName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

        // Count definitions in :root blocks
        const rootBlocks = cssContent.match(/:root\s*\{[^}]*\}/g) || []
        let rootCount = 0
        for (const block of rootBlocks) {
          const pattern = new RegExp(`${escapedName}\\s*:`, "g")
          const matches = block.match(pattern)
          if (matches) rootCount += matches.length
        }

        // Each --home-* token should appear exactly once in :root
        expect(
          rootCount,
          `Token ${tokenName} should be defined exactly once in :root blocks ` +
          `(found ${rootCount}). Multiple definitions could indicate an unintended override.`
        ).toBe(1)
      }
    })
  })
})
