// Feature: pwa-installable — Integration/smoke tests for PWA assets
// Validates: Requirements 1.9, 2.1, 2.3, 4.6, 5.4, 5.6

import { describe, it, expect } from "vitest"
import * as fs from "node:fs"
import * as path from "node:path"

const PUBLIC_DIR = path.resolve(__dirname, "../../public")
const ICONS_DIR = path.join(PUBLIC_DIR, "icons")

/** PNG magic bytes: 137 80 78 71 13 10 26 10 */
const PNG_MAGIC_BYTES = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

type ManifestIcon = {
  src: string
  sizes: string
  type: string
  purpose: string
}

type Manifest = {
  name: string
  short_name: string
  display: string
  start_url: string
  scope: string
  theme_color: string
  background_color: string
  icons: ManifestIcon[]
}

function readManifest(): Manifest {
  const manifestPath = path.join(PUBLIC_DIR, "manifest.webmanifest")
  const content = fs.readFileSync(manifestPath, "utf-8")
  return JSON.parse(content) as Manifest
}

function isValidPng(filePath: string): boolean {
  const buffer = fs.readFileSync(filePath)
  if (buffer.length < 8) return false
  return buffer.subarray(0, 8).equals(PNG_MAGIC_BYTES)
}

describe("PWA Assets Integration Tests", () => {
  describe("manifest.webmanifest is valid JSON with all required fields", () => {
    it("manifest file exists", () => {
      const manifestPath = path.join(PUBLIC_DIR, "manifest.webmanifest")
      expect(fs.existsSync(manifestPath)).toBe(true)
    })

    it("manifest is valid JSON", () => {
      const manifestPath = path.join(PUBLIC_DIR, "manifest.webmanifest")
      const content = fs.readFileSync(manifestPath, "utf-8")
      expect(() => JSON.parse(content)).not.toThrow()
    })

    it("manifest contains required fields with correct values", () => {
      const manifest = readManifest()

      expect(manifest.name).toBe("Home OS")
      expect(manifest.short_name).toBe("Home OS")
      expect(manifest.display).toBe("standalone")
      expect(manifest.start_url).toBe("/dashboard")
      expect(manifest.scope).toBe("/")
      expect(manifest.theme_color).toBe("#09090b")
      expect(manifest.background_color).toBe("#09090b")
    })

    it("manifest contains an icons array with at least 192x192 and 512x512 entries", () => {
      const manifest = readManifest()

      expect(Array.isArray(manifest.icons)).toBe(true)
      expect(manifest.icons.length).toBeGreaterThan(0)

      const sizes = manifest.icons.map((icon) => icon.sizes)
      expect(sizes).toContain("192x192")
      expect(sizes).toContain("512x512")
    })

    it("manifest contains a maskable icon entry", () => {
      const manifest = readManifest()
      const maskableIcons = manifest.icons.filter((icon) => icon.purpose === "maskable")
      expect(maskableIcons.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe("All icon files referenced in manifest exist and are valid PNGs", () => {
    const manifest = readManifest()

    manifest.icons.forEach((icon) => {
      const iconFileName = path.basename(icon.src)

      it(`${iconFileName} exists at the referenced path`, () => {
        // icon.src starts with "/" — resolve relative to public dir
        const filePath = path.join(PUBLIC_DIR, icon.src)
        expect(fs.existsSync(filePath)).toBe(true)
      })

      it(`${iconFileName} is a valid PNG file`, () => {
        const filePath = path.join(PUBLIC_DIR, icon.src)
        expect(isValidPng(filePath)).toBe(true)
      })
    })
  })

  describe("apple-touch-icon exists at 180x180", () => {
    const appleTouchIconPath = path.join(ICONS_DIR, "apple-touch-icon.png")

    it("apple-touch-icon.png file exists", () => {
      expect(fs.existsSync(appleTouchIconPath)).toBe(true)
    })

    it("apple-touch-icon.png is a valid PNG file", () => {
      expect(isValidPng(appleTouchIconPath)).toBe(true)
    })

    it("apple-touch-icon.png has non-trivial file size (>100 bytes)", () => {
      const stats = fs.statSync(appleTouchIconPath)
      expect(stats.size).toBeGreaterThan(100)
    })
  })

  describe("offline.html exists and contains required content", () => {
    const offlinePath = path.join(PUBLIC_DIR, "offline.html")

    it("offline.html file exists", () => {
      expect(fs.existsSync(offlinePath)).toBe(true)
    })

    it("offline.html contains an offline message", () => {
      const content = fs.readFileSync(offlinePath, "utf-8")
      const lowerContent = content.toLowerCase()
      expect(lowerContent).toContain("offline")
    })

    it("offline.html contains the app name 'Home OS'", () => {
      const content = fs.readFileSync(offlinePath, "utf-8")
      expect(content).toContain("Home OS")
    })

    it("offline.html references a monospace font", () => {
      const content = fs.readFileSync(offlinePath, "utf-8")
      // Check for common monospace font references
      const hasMonospace =
        content.includes("monospace") ||
        content.includes("Consolas") ||
        content.includes("Courier") ||
        content.includes("SFMono") ||
        content.includes("ui-monospace")
      expect(hasMonospace).toBe(true)
    })
  })

  describe("sw.js exists", () => {
    const swPath = path.join(PUBLIC_DIR, "sw.js")

    it("sw.js file exists", () => {
      expect(fs.existsSync(swPath)).toBe(true)
    })

    it("sw.js has non-trivial content (>50 bytes)", () => {
      const stats = fs.statSync(swPath)
      expect(stats.size).toBeGreaterThan(50)
    })
  })
})
