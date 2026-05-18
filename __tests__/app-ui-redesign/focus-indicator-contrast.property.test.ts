import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 16: Focus indicator contrast
 * Validates: Requirements 6.3, 16.3
 *
 * For any interactive element (including inputs, buttons, links, sidebar items,
 * and command menu items), the visible focus indicator SHALL have a contrast ratio
 * of at least 3:1 against adjacent colors, ensuring the focus state is perceivable
 * for keyboard users.
 *
 * The focus indicator uses `--home-muted` color as a 2px outline.
 * Dark mode: #a1a1aa, Light mode: #6d6d76
 * Adjacent backgrounds: --home-bg, --home-surface, --home-elevated
 *
 * Tags: Feature: app-ui-redesign, Property 16: Focus indicator contrast
 */

// --- Color types and token definitions ---

type RGB = { r: number; g: number; b: number }

type ThemeMode = "light" | "dark"

type InteractiveElement =
  | "card-app"
  | "item-app"
  | "input-app"
  | "btn-primary-app"
  | "link-muted"
  | "stat-card"
  | "sidebar-item"
  | "command-menu-item"

// Focus indicator color (--home-muted) per theme mode
const FOCUS_INDICATOR_COLOR: Record<ThemeMode, string> = {
  light: "#6d6d76",
  dark: "#a1a1aa",
}

// Adjacent background colors that the focus indicator must contrast against
const ADJACENT_BACKGROUNDS: Record<ThemeMode, Record<string, string>> = {
  light: {
    "--home-bg": "#f4f4f5",
    "--home-surface": "#ffffff",
    "--home-elevated": "#fafafa",
  },
  dark: {
    "--home-bg": "#09090b",
    "--home-surface": "#111118",
    "--home-elevated": "#18181b",
  },
}

// Map interactive elements to their adjacent background token(s)
const ELEMENT_BACKGROUNDS: Record<InteractiveElement, string[]> = {
  "card-app": ["--home-bg", "--home-surface"],
  "item-app": ["--home-surface", "--home-elevated"],
  "input-app": ["--home-surface", "--home-elevated"],
  "btn-primary-app": ["--home-bg", "--home-surface", "--home-elevated"],
  "link-muted": ["--home-bg", "--home-surface", "--home-elevated"],
  "stat-card": ["--home-bg", "--home-surface"],
  "sidebar-item": ["--home-surface"],
  "command-menu-item": ["--home-surface"],
}

const ALL_INTERACTIVE_ELEMENTS: InteractiveElement[] = [
  "card-app",
  "item-app",
  "input-app",
  "btn-primary-app",
  "link-muted",
  "stat-card",
  "sidebar-item",
  "command-menu-item",
]

// --- Color parsing and contrast calculation utilities ---

function parseHexColor(hex: string): RGB {
  const match = hex.match(/^#([0-9a-fA-F]{6})$/)
  if (!match) throw new Error(`Invalid hex color: ${hex}`)
  const val = parseInt(match[1], 16)
  return {
    r: (val >> 16) & 0xff,
    g: (val >> 8) & 0xff,
    b: val & 0xff,
  }
}

/**
 * Convert an sRGB channel value (0-255) to linear RGB.
 * Per WCAG 2.1 relative luminance calculation.
 */
function srgbChannelToLinear(channel: number): number {
  const srgb = channel / 255
  return srgb <= 0.04045 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4)
}

/**
 * Calculate relative luminance per WCAG 2.1.
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where R, G, B are linearized sRGB values.
 */
function relativeLuminance(rgb: RGB): number {
  const r = srgbChannelToLinear(rgb.r)
  const g = srgbChannelToLinear(rgb.g)
  const b = srgbChannelToLinear(rgb.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Calculate WCAG contrast ratio between two colors.
 * Contrast ratio = (L1 + 0.05) / (L2 + 0.05)
 * where L1 is the lighter luminance and L2 is the darker.
 */
function contrastRatio(color1: RGB, color2: RGB): number {
  const lum1 = relativeLuminance(color1)
  const lum2 = relativeLuminance(color2)
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

// --- Tests ---

describe("Feature: app-ui-redesign, Property 16: Focus indicator contrast", () => {
  describe("Focus indicator contrast against actual design token backgrounds", () => {
    it("focus indicator (--home-muted) has ≥3:1 contrast against all adjacent backgrounds in light mode", () => {
      const focusColor = parseHexColor(FOCUS_INDICATOR_COLOR.light)
      const backgrounds = ADJACENT_BACKGROUNDS.light

      for (const [tokenName, bgHex] of Object.entries(backgrounds)) {
        const bgColor = parseHexColor(bgHex)
        const ratio = contrastRatio(focusColor, bgColor)
        expect(
          ratio,
          `Light mode: Focus indicator ${FOCUS_INDICATOR_COLOR.light} vs ${tokenName} (${bgHex}) has contrast ${ratio.toFixed(2)}:1, needs ≥3:1`
        ).toBeGreaterThanOrEqual(3)
      }
    })

    it("focus indicator (--home-muted) has ≥3:1 contrast against all adjacent backgrounds in dark mode", () => {
      const focusColor = parseHexColor(FOCUS_INDICATOR_COLOR.dark)
      const backgrounds = ADJACENT_BACKGROUNDS.dark

      for (const [tokenName, bgHex] of Object.entries(backgrounds)) {
        const bgColor = parseHexColor(bgHex)
        const ratio = contrastRatio(focusColor, bgColor)
        expect(
          ratio,
          `Dark mode: Focus indicator ${FOCUS_INDICATOR_COLOR.dark} vs ${tokenName} (${bgHex}) has contrast ${ratio.toFixed(2)}:1, needs ≥3:1`
        ).toBeGreaterThanOrEqual(3)
      }
    })
  })

  describe("Property-based: focus indicator contrast holds for all interactive elements", () => {
    // Arbitrary for selecting an interactive element
    const elementArb = fc.constantFrom(...ALL_INTERACTIVE_ELEMENTS)
    // Arbitrary for selecting a theme mode
    const modeArb = fc.constantFrom("light", "dark") as fc.Arbitrary<ThemeMode>

    it("for any interactive element in any theme mode, focus indicator has ≥3:1 contrast against all adjacent backgrounds", () => {
      fc.assert(
        fc.property(elementArb, modeArb, (element, mode) => {
          const focusColor = parseHexColor(FOCUS_INDICATOR_COLOR[mode])
          const backgroundTokens = ELEMENT_BACKGROUNDS[element]

          for (const bgToken of backgroundTokens) {
            const bgHex = ADJACENT_BACKGROUNDS[mode][bgToken]
            const bgColor = parseHexColor(bgHex)
            const ratio = contrastRatio(focusColor, bgColor)

            expect(
              ratio,
              `${mode} mode, ${element}: Focus indicator vs ${bgToken} (${bgHex}) = ${ratio.toFixed(2)}:1, needs ≥3:1`
            ).toBeGreaterThanOrEqual(3)
          }
        }),
        { numRuns: 200 }
      )
    })

    it("focus indicator maintains ≥3:1 contrast even with slight background color variations", () => {
      // Generate slight variations of the actual background colors to simulate
      // color-mix opacity effects and ensure robustness
      const variationArb = fc.integer({ min: -10, max: 10 })

      fc.assert(
        fc.property(modeArb, variationArb, variationArb, variationArb, (mode, dr, dg, db) => {
          const focusColor = parseHexColor(FOCUS_INDICATOR_COLOR[mode])

          // Apply small variations to the base background colors
          for (const bgHex of Object.values(ADJACENT_BACKGROUNDS[mode])) {
            const baseBg = parseHexColor(bgHex)
            const variedBg: RGB = {
              r: Math.max(0, Math.min(255, baseBg.r + dr)),
              g: Math.max(0, Math.min(255, baseBg.g + dg)),
              b: Math.max(0, Math.min(255, baseBg.b + db)),
            }
            const ratio = contrastRatio(focusColor, variedBg)

            // With small variations (±10 per channel), contrast should still be well above 3:1
            // given the actual token values have significant contrast margins
            expect(
              ratio,
              `${mode} mode: Focus indicator vs varied bg (r:${variedBg.r},g:${variedBg.g},b:${variedBg.b}) = ${ratio.toFixed(2)}:1`
            ).toBeGreaterThanOrEqual(3)
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("WCAG contrast ratio calculation correctness", () => {
    it("contrast ratio is always ≥1", () => {
      const rgbArb = fc.record({
        r: fc.integer({ min: 0, max: 255 }),
        g: fc.integer({ min: 0, max: 255 }),
        b: fc.integer({ min: 0, max: 255 }),
      })

      fc.assert(
        fc.property(rgbArb, rgbArb, (color1, color2) => {
          const ratio = contrastRatio(color1, color2)
          expect(ratio).toBeGreaterThanOrEqual(1)
        }),
        { numRuns: 100 }
      )
    })

    it("contrast ratio is symmetric (order of colors does not matter)", () => {
      const rgbArb = fc.record({
        r: fc.integer({ min: 0, max: 255 }),
        g: fc.integer({ min: 0, max: 255 }),
        b: fc.integer({ min: 0, max: 255 }),
      })

      fc.assert(
        fc.property(rgbArb, rgbArb, (color1, color2) => {
          const ratio1 = contrastRatio(color1, color2)
          const ratio2 = contrastRatio(color2, color1)
          expect(ratio1).toBeCloseTo(ratio2, 10)
        }),
        { numRuns: 100 }
      )
    })

    it("black vs white has maximum contrast ratio of 21:1", () => {
      const black: RGB = { r: 0, g: 0, b: 0 }
      const white: RGB = { r: 255, g: 255, b: 255 }
      const ratio = contrastRatio(black, white)
      expect(ratio).toBeCloseTo(21, 0)
    })

    it("identical colors have contrast ratio of 1:1", () => {
      const rgbArb = fc.record({
        r: fc.integer({ min: 0, max: 255 }),
        g: fc.integer({ min: 0, max: 255 }),
        b: fc.integer({ min: 0, max: 255 }),
      })

      fc.assert(
        fc.property(rgbArb, (color) => {
          const ratio = contrastRatio(color, color)
          expect(ratio).toBeCloseTo(1, 10)
        }),
        { numRuns: 100 }
      )
    })
  })
})
