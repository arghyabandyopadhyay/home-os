import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 15: Text contrast ratio compliance
 * Validates: Requirements 16.1, 16.6
 *
 * For any text element rendered on any surface in the redesigned application
 * (including glassmorphism/translucent surfaces), the contrast ratio between
 * the text color and its effective background SHALL be at least 4.5:1 for
 * normal text (below 18px or below 14px bold) and at least 3:1 for large text
 * (18px+ or 14px+ bold).
 *
 * Tags: Feature: app-ui-redesign, Property 15: Text contrast ratio compliance
 */

// --- Color types ---

type RGB = { r: number; g: number; b: number }

// --- WCAG Contrast Ratio Calculation ---

/**
 * Convert an sRGB channel value (0-255) to linear RGB.
 * Per WCAG 2.1 relative luminance formula.
 */
function srgbChannelToLinear(channel: number): number {
  const srgb = channel / 255
  return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4)
}

/**
 * Calculate relative luminance per WCAG 2.1.
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 * where R, G, B are linearized sRGB values.
 */
function relativeLuminance(color: RGB): number {
  const r = srgbChannelToLinear(color.r)
  const g = srgbChannelToLinear(color.g)
  const b = srgbChannelToLinear(color.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * Calculate WCAG contrast ratio between two colors.
 * Contrast ratio = (L1 + 0.05) / (L2 + 0.05)
 * where L1 is the lighter luminance and L2 is the darker.
 */
function contrastRatio(foreground: RGB, background: RGB): number {
  const lum1 = relativeLuminance(foreground)
  const lum2 = relativeLuminance(background)
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

// --- Design token color values ---

type ThemeMode = "dark" | "light"

type TextToken = {
  name: string
  role: "text" | "muted"
  dark: RGB
  light: RGB
}

type SurfaceToken = {
  name: string
  role: "background" | "surface"
  dark: RGB
  light: RGB
}

// Actual token values from the design system
const TEXT_TOKENS: TextToken[] = [
  {
    name: "--home-text",
    role: "text",
    dark: { r: 0xfa, g: 0xfa, b: 0xfa },   // #fafafa
    light: { r: 0x18, g: 0x18, b: 0x1b },   // #18181b
  },
  {
    name: "--home-muted",
    role: "muted",
    dark: { r: 0xa1, g: 0xa1, b: 0xaa },    // #a1a1aa
    light: { r: 0x6d, g: 0x6d, b: 0x76 },   // #6d6d76
  },
]

const SURFACE_TOKENS: SurfaceToken[] = [
  {
    name: "--home-bg",
    role: "background",
    dark: { r: 0x09, g: 0x09, b: 0x0b },    // #09090b
    light: { r: 0xf4, g: 0xf4, b: 0xf5 },   // #f4f4f5
  },
  {
    name: "--home-surface",
    role: "surface",
    dark: { r: 0x11, g: 0x11, b: 0x18 },    // #111118
    light: { r: 0xff, g: 0xff, b: 0xff },    // #ffffff
  },
]

// Text size classification for WCAG
type TextSize = "normal" | "large"

// WCAG minimum contrast ratios
const WCAG_MIN_CONTRAST: Record<TextSize, number> = {
  normal: 4.5,
  large: 3.0,
}

// --- Test color pair type ---

type ColorPair = {
  textToken: TextToken
  surfaceToken: SurfaceToken
  mode: ThemeMode
  textSize: TextSize
}

// Build all actual color pairs to test
function getAllColorPairs(): ColorPair[] {
  const pairs: ColorPair[] = []
  const modes: ThemeMode[] = ["dark", "light"]
  const sizes: TextSize[] = ["normal", "large"]

  for (const textToken of TEXT_TOKENS) {
    for (const surfaceToken of SURFACE_TOKENS) {
      for (const mode of modes) {
        for (const size of sizes) {
          pairs.push({ textToken, surfaceToken, mode, textSize: size })
        }
      }
    }
  }
  return pairs
}

function getTextColor(pair: ColorPair): RGB {
  return pair.mode === "dark" ? pair.textToken.dark : pair.textToken.light
}

function getSurfaceColor(pair: ColorPair): RGB {
  return pair.mode === "dark" ? pair.surfaceToken.dark : pair.surfaceToken.light
}

// --- Tests ---

describe("Feature: app-ui-redesign, Property 15: Text contrast ratio compliance", () => {
  describe("WCAG contrast ratio calculation correctness", () => {
    it("black on white has contrast ratio of 21:1", () => {
      const black: RGB = { r: 0, g: 0, b: 0 }
      const white: RGB = { r: 255, g: 255, b: 255 }
      const ratio = contrastRatio(black, white)
      expect(ratio).toBeCloseTo(21, 0)
    })

    it("white on white has contrast ratio of 1:1", () => {
      const white: RGB = { r: 255, g: 255, b: 255 }
      const ratio = contrastRatio(white, white)
      expect(ratio).toBeCloseTo(1, 5)
    })

    it("contrast ratio is symmetric (order of arguments does not matter)", () => {
      const color1: RGB = { r: 100, g: 50, b: 200 }
      const color2: RGB = { r: 240, g: 240, b: 240 }
      expect(contrastRatio(color1, color2)).toBeCloseTo(contrastRatio(color2, color1), 5)
    })

    it("relative luminance of white is 1.0", () => {
      expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBeCloseTo(1.0, 5)
    })

    it("relative luminance of black is 0.0", () => {
      expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBeCloseTo(0.0, 5)
    })
  })

  describe("Actual token color pair contrast validation", () => {
    const allPairs = getAllColorPairs()

    it("all text/surface token pairs meet WCAG minimum contrast requirements", () => {
      for (const pair of allPairs) {
        const textColor = getTextColor(pair)
        const surfaceColor = getSurfaceColor(pair)
        const ratio = contrastRatio(textColor, surfaceColor)
        const minRequired = WCAG_MIN_CONTRAST[pair.textSize]

        expect(
          ratio,
          `${pair.textToken.name} on ${pair.surfaceToken.name} (${pair.mode} mode, ${pair.textSize} text): ` +
            `contrast ratio ${ratio.toFixed(2)}:1 must be ≥ ${minRequired}:1`
        ).toBeGreaterThanOrEqual(minRequired)
      }
    })

    it("--home-text on --home-bg meets 4.5:1 in dark mode", () => {
      const text: RGB = { r: 0xfa, g: 0xfa, b: 0xfa }
      const bg: RGB = { r: 0x09, g: 0x09, b: 0x0b }
      const ratio = contrastRatio(text, bg)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it("--home-text on --home-surface meets 4.5:1 in dark mode", () => {
      const text: RGB = { r: 0xfa, g: 0xfa, b: 0xfa }
      const surface: RGB = { r: 0x11, g: 0x11, b: 0x18 }
      const ratio = contrastRatio(text, surface)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it("--home-muted on --home-bg meets 4.5:1 in dark mode", () => {
      const muted: RGB = { r: 0xa1, g: 0xa1, b: 0xaa }
      const bg: RGB = { r: 0x09, g: 0x09, b: 0x0b }
      const ratio = contrastRatio(muted, bg)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it("--home-muted on --home-surface meets 4.5:1 in dark mode", () => {
      const muted: RGB = { r: 0xa1, g: 0xa1, b: 0xaa }
      const surface: RGB = { r: 0x11, g: 0x11, b: 0x18 }
      const ratio = contrastRatio(muted, surface)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it("--home-text on --home-bg meets 4.5:1 in light mode", () => {
      const text: RGB = { r: 0x18, g: 0x18, b: 0x1b }
      const bg: RGB = { r: 0xf4, g: 0xf4, b: 0xf5 }
      const ratio = contrastRatio(text, bg)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it("--home-text on --home-surface meets 4.5:1 in light mode", () => {
      const text: RGB = { r: 0x18, g: 0x18, b: 0x1b }
      const surface: RGB = { r: 0xff, g: 0xff, b: 0xff }
      const ratio = contrastRatio(text, surface)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it("--home-muted on --home-bg meets 4.5:1 in light mode", () => {
      const muted: RGB = { r: 0x6d, g: 0x6d, b: 0x76 }
      const bg: RGB = { r: 0xf4, g: 0xf4, b: 0xf5 }
      const ratio = contrastRatio(muted, bg)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })

    it("--home-muted on --home-surface meets 4.5:1 in light mode", () => {
      const muted: RGB = { r: 0x6d, g: 0x6d, b: 0x76 }
      const surface: RGB = { r: 0xff, g: 0xff, b: 0xff }
      const ratio = contrastRatio(muted, surface)
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    })
  })

  describe("Property-based: contrast ratio compliance for generated text/surface pairs", () => {
    // Arbitrary for selecting a text token index
    const textTokenIndexArb = fc.integer({ min: 0, max: TEXT_TOKENS.length - 1 })
    // Arbitrary for selecting a surface token index
    const surfaceTokenIndexArb = fc.integer({ min: 0, max: SURFACE_TOKENS.length - 1 })
    // Arbitrary for theme mode
    const modeArb = fc.constantFrom("dark", "light") as fc.Arbitrary<ThemeMode>
    // Arbitrary for text size
    const textSizeArb = fc.constantFrom("normal", "large") as fc.Arbitrary<TextSize>

    it("all token combinations meet WCAG contrast requirements across modes and sizes", () => {
      fc.assert(
        fc.property(
          textTokenIndexArb,
          surfaceTokenIndexArb,
          modeArb,
          textSizeArb,
          (textIdx, surfaceIdx, mode, textSize) => {
            const textToken = TEXT_TOKENS[textIdx]
            const surfaceToken = SURFACE_TOKENS[surfaceIdx]
            const textColor = mode === "dark" ? textToken.dark : textToken.light
            const surfaceColor = mode === "dark" ? surfaceToken.dark : surfaceToken.light
            const ratio = contrastRatio(textColor, surfaceColor)
            const minRequired = WCAG_MIN_CONTRAST[textSize]

            expect(
              ratio,
              `${textToken.name} on ${surfaceToken.name} (${mode}, ${textSize}): ` +
                `${ratio.toFixed(2)}:1 < ${minRequired}:1`
            ).toBeGreaterThanOrEqual(minRequired)
          }
        ),
        { numRuns: 200 }
      )
    })

    it("contrast ratio is always ≥ 1 for any two colors", () => {
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

    it("contrast ratio is symmetric for any two colors", () => {
      const rgbArb = fc.record({
        r: fc.integer({ min: 0, max: 255 }),
        g: fc.integer({ min: 0, max: 255 }),
        b: fc.integer({ min: 0, max: 255 }),
      })

      fc.assert(
        fc.property(rgbArb, rgbArb, (color1, color2) => {
          const ratio1 = contrastRatio(color1, color2)
          const ratio2 = contrastRatio(color2, color1)
          expect(Math.abs(ratio1 - ratio2)).toBeLessThan(0.0001)
        }),
        { numRuns: 100 }
      )
    })

    it("relative luminance is bounded between 0 and 1 for any sRGB color", () => {
      const rgbArb = fc.record({
        r: fc.integer({ min: 0, max: 255 }),
        g: fc.integer({ min: 0, max: 255 }),
        b: fc.integer({ min: 0, max: 255 }),
      })

      fc.assert(
        fc.property(rgbArb, (color) => {
          const lum = relativeLuminance(color)
          expect(lum).toBeGreaterThanOrEqual(0)
          expect(lum).toBeLessThanOrEqual(1)
        }),
        { numRuns: 100 }
      )
    })

    it("maximum contrast ratio is 21:1 (black vs white)", () => {
      const rgbArb = fc.record({
        r: fc.integer({ min: 0, max: 255 }),
        g: fc.integer({ min: 0, max: 255 }),
        b: fc.integer({ min: 0, max: 255 }),
      })

      fc.assert(
        fc.property(rgbArb, rgbArb, (color1, color2) => {
          const ratio = contrastRatio(color1, color2)
          expect(ratio).toBeLessThanOrEqual(21.01) // small tolerance for floating point
        }),
        { numRuns: 100 }
      )
    })
  })
})
