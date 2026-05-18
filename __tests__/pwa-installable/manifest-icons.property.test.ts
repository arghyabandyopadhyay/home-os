// Feature: pwa-installable, Property 1: Manifest icon entries are structurally valid

import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import * as fs from "node:fs"
import * as path from "node:path"

/**
 * Property 1: Manifest icon entries are structurally valid
 *
 * For any icon entry in the manifest's `icons` array, the entry SHALL contain
 * a `src` field that is a non-empty string starting with "/", a `sizes` field
 * matching the pattern `NxN` where N is a positive integer, a `type` field
 * equal to "image/png", and a `purpose` field that is either "any" or "maskable".
 *
 * **Validates: Requirements 2.3**
 */

type ManifestIcon = {
  src: string
  sizes: string
  type: string
  purpose: string
}

type Manifest = {
  icons: ManifestIcon[]
}

/** Read and parse the manifest.webmanifest file */
function readManifest(): Manifest {
  const manifestPath = path.resolve(__dirname, "../../public/manifest.webmanifest")
  const content = fs.readFileSync(manifestPath, "utf-8")
  return JSON.parse(content) as Manifest
}

/** Pattern for valid sizes field: NxN where N is a positive integer */
const SIZES_PATTERN = /^\d+x\d+$/

/** Valid purpose values */
const VALID_PURPOSES = ["any", "maskable"] as const

describe("Feature: pwa-installable, Property 1: Manifest icon entries are structurally valid", () => {
  const manifest = readManifest()
  const icons = manifest.icons

  it("manifest contains at least one icon entry", () => {
    expect(icons.length).toBeGreaterThan(0)
  })

  describe("For any randomly selected icon entry, all structural requirements hold", () => {
    /** Arbitrary that picks a random icon entry from the manifest's icons array */
    const iconEntryArb: fc.Arbitrary<ManifestIcon> = fc.constantFrom(...icons)

    it("src is a non-empty string starting with '/'", () => {
      fc.assert(
        fc.property(iconEntryArb, (icon) => {
          expect(typeof icon.src).toBe("string")
          expect(icon.src.length).toBeGreaterThan(0)
          expect(icon.src.startsWith("/")).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("sizes matches the pattern NxN where N is a positive integer", () => {
      fc.assert(
        fc.property(iconEntryArb, (icon) => {
          expect(typeof icon.sizes).toBe("string")
          expect(SIZES_PATTERN.test(icon.sizes)).toBe(true)

          // Verify N values are positive integers
          const [width, height] = icon.sizes.split("x").map(Number)
          expect(width).toBeGreaterThan(0)
          expect(height).toBeGreaterThan(0)
          expect(Number.isInteger(width)).toBe(true)
          expect(Number.isInteger(height)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("type is exactly 'image/png'", () => {
      fc.assert(
        fc.property(iconEntryArb, (icon) => {
          expect(icon.type).toBe("image/png")
        }),
        { numRuns: 100 }
      )
    })

    it("purpose is either 'any' or 'maskable'", () => {
      fc.assert(
        fc.property(iconEntryArb, (icon) => {
          expect(VALID_PURPOSES).toContain(icon.purpose)
        }),
        { numRuns: 100 }
      )
    })

    it("all structural requirements hold simultaneously for any icon entry", () => {
      fc.assert(
        fc.property(iconEntryArb, (icon) => {
          // src: non-empty string starting with "/"
          expect(typeof icon.src).toBe("string")
          expect(icon.src.length).toBeGreaterThan(0)
          expect(icon.src.startsWith("/")).toBe(true)

          // sizes: matches NxN pattern with positive integers
          expect(SIZES_PATTERN.test(icon.sizes)).toBe(true)
          const [width, height] = icon.sizes.split("x").map(Number)
          expect(width).toBeGreaterThan(0)
          expect(height).toBeGreaterThan(0)

          // type: exactly "image/png"
          expect(icon.type).toBe("image/png")

          // purpose: "any" or "maskable"
          expect(VALID_PURPOSES).toContain(icon.purpose)
        }),
        { numRuns: 100 }
      )
    })
  })
})
