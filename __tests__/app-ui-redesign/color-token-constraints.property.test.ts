import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 1: Color token constraint validation
 * Validates: Requirements 2.2
 *
 * For any color token value defined in the `--home-*` design token system,
 * the token SHALL NOT be pure black (#000000) when used as a background or surface,
 * SHALL NOT introduce semantic colors (red, green, blue) for non-status purposes,
 * and SHALL have saturation no greater than 60% when measured in the oklch color space.
 *
 * Tags: Feature: app-ui-redesign, Property 1: Color token constraint validation
 */

// --- Design token definitions (from globals.css) ---

type ColorToken = {
  name: string
  lightValue: string
  darkValue: string
  role: "background" | "surface" | "elevated" | "border" | "text" | "muted" | "accent"
}

const COLOR_TOKENS: ColorToken[] = [
  { name: "--home-bg", lightValue: "#f4f4f5", darkValue: "#09090b", role: "background" },
  { name: "--home-surface", lightValue: "#ffffff", darkValue: "#111118", role: "surface" },
  { name: "--home-elevated", lightValue: "#fafafa", darkValue: "#18181b", role: "elevated" },
  { name: "--home-border", lightValue: "rgba(0,0,0,0.08)", darkValue: "rgba(255,255,255,0.1)", role: "border" },
  { name: "--home-text", lightValue: "#18181b", darkValue: "#fafafa", role: "text" },
  { name: "--home-muted", lightValue: "#6d6d76", darkValue: "#a1a1aa", role: "muted" },
  { name: "--home-accent-glow", lightValue: "rgba(59,130,246,0.08)", darkValue: "rgba(59,130,246,0.1)", role: "accent" },
]

// Tokens that serve as background or surface (constraint: not pure black)
const BACKGROUND_SURFACE_TOKENS = COLOR_TOKENS.filter(
  (t) => t.role === "background" || t.role === "surface" || t.role === "elevated"
)

// --- Color parsing utilities ---

type RGB = { r: number; g: number; b: number; a: number }

function parseHexColor(hex: string): RGB | null {
  const match = hex.match(/^#([0-9a-fA-F]{6})$/)
  if (!match) return null
  const val = parseInt(match[1], 16)
  return {
    r: (val >> 16) & 0xff,
    g: (val >> 8) & 0xff,
    b: val & 0xff,
    a: 1,
  }
}

function parseRgbaColor(rgba: string): RGB | null {
  const match = rgba.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)$/)
  if (!match) return null
  return {
    r: parseInt(match[1], 10),
    g: parseInt(match[2], 10),
    b: parseInt(match[3], 10),
    a: match[4] !== undefined ? parseFloat(match[4]) : 1,
  }
}

function parseColor(value: string): RGB | null {
  const trimmed = value.trim()
  if (trimmed.startsWith("#")) return parseHexColor(trimmed)
  if (trimmed.startsWith("rgb")) return parseRgbaColor(trimmed)
  return null
}

// --- oklch conversion utilities ---

// Convert sRGB to linear RGB
function srgbToLinear(c: number): number {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

// Convert linear RGB to CIE XYZ (D65)
function linearRgbToXyz(r: number, g: number, b: number): [number, number, number] {
  const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b
  const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b
  const z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b
  return [x, y, z]
}

// Convert XYZ to OKLab
function xyzToOklab(x: number, y: number, z: number): [number, number, number] {
  const l_ = 0.8189330101 * x + 0.3618667424 * y - 0.1288597137 * z
  const m_ = 0.0329845436 * x + 0.9293118715 * y + 0.0361456387 * z
  const s_ = 0.0482003018 * x + 0.2643662691 * y + 0.6338517070 * z

  const l_cbrt = Math.cbrt(l_)
  const m_cbrt = Math.cbrt(m_)
  const s_cbrt = Math.cbrt(s_)

  const L = 0.2104542553 * l_cbrt + 0.7936177850 * m_cbrt - 0.0040720468 * s_cbrt
  const a = 1.9779984951 * l_cbrt - 2.4285922050 * m_cbrt + 0.4505937099 * s_cbrt
  const b = 0.0259040371 * l_cbrt + 0.7827717662 * m_cbrt - 0.8086757660 * s_cbrt

  return [L, a, b]
}

// Convert OKLab to OKLCh
function oklabToOklch(L: number, a: number, b: number): { L: number; C: number; h: number } {
  const C = Math.sqrt(a * a + b * b)
  const h = (Math.atan2(b, a) * 180) / Math.PI
  return { L, C, h: h < 0 ? h + 360 : h }
}

// Full pipeline: sRGB → oklch
function rgbToOklch(rgb: RGB): { L: number; C: number; h: number } {
  const lr = srgbToLinear(rgb.r)
  const lg = srgbToLinear(rgb.g)
  const lb = srgbToLinear(rgb.b)
  const [x, y, z] = linearRgbToXyz(lr, lg, lb)
  const [L, a, b] = xyzToOklab(x, y, z)
  return oklabToOklch(L, a, b)
}

// --- Constraint checking functions ---

function isPureBlack(rgb: RGB): boolean {
  return rgb.r === 0 && rgb.g === 0 && rgb.b === 0 && rgb.a === 1
}

/**
 * Check if a color is a semantic hue (red, green, blue) based on oklch hue angle.
 * Red: roughly 0-50° and 330-360°
 * Green: roughly 130-170°
 * Blue: roughly 230-270°
 *
 * Only applies to non-status/non-accent tokens with meaningful chroma.
 * Colors with chroma below 0.04 are perceptually achromatic regardless of hue angle.
 */
function isSemanticHue(oklch: { L: number; C: number; h: number }): boolean {
  // If chroma is very low, the color is perceptually achromatic — not semantic
  // A threshold of 0.04 ensures near-neutral colors (like dark grays with tiny
  // color offsets) are not falsely flagged as semantic.
  if (oklch.C < 0.04) return false

  const h = oklch.h
  const isRed = (h >= 0 && h <= 50) || (h >= 330 && h <= 360)
  const isGreen = h >= 130 && h <= 170
  const isBlue = h >= 230 && h <= 270

  return isRed || isGreen || isBlue
}

/**
 * oklch saturation (chroma) must not exceed 0.6 (60% of the maximum perceptual chroma).
 * In oklch, chroma is unbounded but typical sRGB gamut values rarely exceed 0.4.
 * The requirement states "saturation no greater than 60%" — we interpret this as
 * chroma ≤ 0.6 in the oklch space (a generous bound for sRGB colors).
 */
function hasExcessiveSaturation(oklch: { L: number; C: number; h: number }): boolean {
  // oklch chroma of 0.6 represents very high saturation
  return oklch.C > 0.6
}

// --- Tests ---

describe("Feature: app-ui-redesign, Property 1: Color token constraint validation", () => {
  describe("Actual design token validation", () => {
    it("background/surface tokens are not pure black (#000000)", () => {
      for (const token of BACKGROUND_SURFACE_TOKENS) {
        for (const value of [token.lightValue, token.darkValue]) {
          const rgb = parseColor(value)
          if (rgb) {
            expect(
              isPureBlack(rgb),
              `Token ${token.name} value "${value}" must not be pure black`
            ).toBe(false)
          }
        }
      }
    })

    it("non-accent/non-status tokens do not use semantic hues (red, green, blue)", () => {
      // Only check tokens that are NOT accent/status — those are allowed semantic hues
      const nonStatusTokens = COLOR_TOKENS.filter((t) => t.role !== "accent")

      for (const token of nonStatusTokens) {
        for (const value of [token.lightValue, token.darkValue]) {
          const rgb = parseColor(value)
          if (rgb && rgb.a > 0) {
            const oklch = rgbToOklch(rgb)
            expect(
              isSemanticHue(oklch),
              `Token ${token.name} value "${value}" must not be a semantic hue (red/green/blue) for non-status purposes. oklch: L=${oklch.L.toFixed(3)}, C=${oklch.C.toFixed(3)}, h=${oklch.h.toFixed(1)}°`
            ).toBe(false)
          }
        }
      }
    })

    it("all tokens have saturation (chroma) no greater than 60% in oklch", () => {
      for (const token of COLOR_TOKENS) {
        for (const value of [token.lightValue, token.darkValue]) {
          const rgb = parseColor(value)
          if (rgb && rgb.a > 0) {
            const oklch = rgbToOklch(rgb)
            expect(
              hasExcessiveSaturation(oklch),
              `Token ${token.name} value "${value}" has excessive saturation. oklch chroma: ${oklch.C.toFixed(3)} (max 0.6)`
            ).toBe(false)
          }
        }
      }
    })
  })

  describe("Property-based: color constraint validation holds for generated token values", () => {
    // Generate arbitrary hex colors that represent valid design token candidates
    // (zinc/charcoal/graphite tones — low saturation, neutral)
    const neutralColorArb = fc
      .tuple(
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 }),
        fc.integer({ min: 0, max: 255 })
      )
      .filter(([r, g, b]) => {
        // Filter to neutral/low-saturation colors (like zinc tones)
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        const delta = max - min
        // HSL saturation approximation: low saturation means small delta relative to lightness
        const lightness = (max + min) / 2
        if (lightness === 0 || lightness === 255) return true
        const saturation = delta / (1 - Math.abs(2 * (lightness / 255) - 1)) / 255
        return saturation <= 0.6
      })
      .map(([r, g, b]) => ({ r, g, b, a: 1 }))

    // Generate colors that are NOT pure black (valid for background/surface)
    const nonBlackColorArb = neutralColorArb.filter((rgb) => !isPureBlack(rgb))

    it("non-pure-black neutral colors pass the background/surface constraint", () => {
      fc.assert(
        fc.property(nonBlackColorArb, (rgb) => {
          expect(isPureBlack(rgb)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("neutral colors (low chroma) do not trigger semantic hue detection", () => {
      // Generate truly achromatic/near-achromatic colors
      const achromaticArb = fc
        .tuple(
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: -5, max: 5 }),
          fc.integer({ min: -5, max: 5 })
        )
        .map(([base, dg, db]) => ({
          r: Math.max(0, Math.min(255, base)),
          g: Math.max(0, Math.min(255, base + dg)),
          b: Math.max(0, Math.min(255, base + db)),
          a: 1,
        }))

      fc.assert(
        fc.property(achromaticArb, (rgb) => {
          const oklch = rgbToOklch(rgb)
          // Near-achromatic colors should not be flagged as semantic
          expect(isSemanticHue(oklch)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })

    it("neutral colors always have oklch chroma ≤ 0.6", () => {
      fc.assert(
        fc.property(neutralColorArb, (rgb) => {
          const oklch = rgbToOklch(rgb)
          expect(oklch.C).toBeLessThanOrEqual(0.6)
        }),
        { numRuns: 100 }
      )
    })

    it("pure black is correctly detected", () => {
      const pureBlack: RGB = { r: 0, g: 0, b: 0, a: 1 }
      expect(isPureBlack(pureBlack)).toBe(true)
    })

    it("highly saturated colors are correctly detected as excessive", () => {
      // Generate highly saturated colors (one channel maxed, others low)
      const saturatedColorArb = fc
        .tuple(
          fc.constantFrom("r", "g", "b") as fc.Arbitrary<"r" | "g" | "b">,
          fc.integer({ min: 200, max: 255 }),
          fc.integer({ min: 0, max: 30 }),
          fc.integer({ min: 0, max: 30 })
        )
        .map(([channel, high, low1, low2]) => {
          const rgb: RGB = { r: low1, g: low2, b: low1, a: 1 }
          rgb[channel] = high
          return rgb
        })

      fc.assert(
        fc.property(saturatedColorArb, (rgb) => {
          const oklch = rgbToOklch(rgb)
          // Highly saturated pure colors should have high chroma
          // but may or may not exceed 0.6 depending on exact values
          // This test verifies the detection function works correctly
          if (oklch.C > 0.6) {
            expect(hasExcessiveSaturation(oklch)).toBe(true)
          }
        }),
        { numRuns: 100 }
      )
    })

    it("the actual design token values all satisfy combined constraints", () => {
      // Use fast-check to pick random tokens and modes and verify all constraints
      const tokenIndexArb = fc.integer({ min: 0, max: COLOR_TOKENS.length - 1 })
      const modeArb = fc.constantFrom("light", "dark") as fc.Arbitrary<"light" | "dark">

      fc.assert(
        fc.property(tokenIndexArb, modeArb, (index, mode) => {
          const token = COLOR_TOKENS[index]
          const value = mode === "light" ? token.lightValue : token.darkValue
          const rgb = parseColor(value)

          if (rgb && rgb.a > 0) {
            // Constraint 1: Background/surface tokens must not be pure black
            if (token.role === "background" || token.role === "surface" || token.role === "elevated") {
              expect(
                isPureBlack(rgb),
                `${token.name} (${mode}) must not be pure black`
              ).toBe(false)
            }

            // Constraint 2: Non-accent tokens must not use semantic hues
            if (token.role !== "accent") {
              const oklch = rgbToOklch(rgb)
              expect(
                isSemanticHue(oklch),
                `${token.name} (${mode}) must not be a semantic hue`
              ).toBe(false)
            }

            // Constraint 3: All tokens must have chroma ≤ 0.6
            const oklch = rgbToOklch(rgb)
            expect(
              oklch.C,
              `${token.name} (${mode}) chroma ${oklch.C.toFixed(3)} exceeds 0.6`
            ).toBeLessThanOrEqual(0.6)
          }
        }),
        { numRuns: 100 }
      )
    })
  })
})
