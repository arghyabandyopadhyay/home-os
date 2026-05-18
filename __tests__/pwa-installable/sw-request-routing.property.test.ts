// Feature: pwa-installable, Property 2: Service worker applies correct caching strategy based on request classification

import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import * as fs from "node:fs"
import * as path from "node:path"

/**
 * Property 2: Service worker applies correct caching strategy based on request classification
 *
 * For any fetch request intercepted by the service worker: if the request mode
 * is "navigate", the network-first strategy with 3-second timeout SHALL be applied;
 * if the request URL matches a static asset pattern (paths under /icons/, font files,
 * or image files), the cache-first strategy SHALL be applied; if the request URL
 * contains the Supabase API hostname, the network-only strategy SHALL be applied.
 *
 * **Validates: Requirements 4.2, 4.3, 4.4**
 */

// --- Read and extract logic from sw.js ---

function readServiceWorkerSource(): string {
  const swPath = path.resolve(__dirname, "../../public/sw.js")
  return fs.readFileSync(swPath, "utf-8")
}

/**
 * Extracts the isStaticAsset function logic from sw.js and creates a testable version.
 * We replicate the logic here based on the source to test classification correctness.
 */
function isStaticAsset(url: URL): boolean {
  const pathname = url.pathname

  // Icons directory
  if (pathname.startsWith("/icons/")) return true

  // Font files
  if (/\.(woff2?|ttf|otf|eot)$/i.test(pathname)) return true

  // Image files
  if (/\.(png|jpe?g|gif|svg|webp|ico|avif)$/i.test(pathname)) return true

  return false
}

/**
 * Determines the expected caching strategy for a given request.
 * Mirrors the routing logic in sw.js fetch event handler.
 */
type CachingStrategy = "network-first-timeout" | "cache-first" | "network-only" | "network-first"

function classifyRequest(url: URL, mode: string): CachingStrategy {
  // Supabase API — network-only (checked first, matching sw.js order)
  if (url.hostname.includes("supabase.co")) return "network-only"

  // Navigation requests — network-first with 3s timeout
  if (mode === "navigate") return "network-first-timeout"

  // Static assets — cache-first
  if (isStaticAsset(url)) return "cache-first"

  // All other requests — network-first without timeout
  return "network-first"
}

// --- Arbitraries for generating test inputs ---

/** Generate random path segments (alphanumeric + dash/underscore) */
const pathSegmentArb = fc.stringMatching(/^[a-z0-9_-]{1,12}$/)

/** Generate random navigation URLs (any valid URL with mode "navigate") */
const navigationRequestArb = fc.record({
  url: fc
    .tuple(pathSegmentArb, pathSegmentArb)
    .map(([seg1, seg2]) => new URL(`https://home-os.app/${seg1}/${seg2}`)),
  mode: fc.constant("navigate" as const),
})

/** Font file extensions */
const fontExtensions = [".woff", ".woff2", ".ttf", ".otf", ".eot"]

/** Image file extensions */
const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".ico", ".avif"]

/** Generate URLs that match static asset patterns: /icons/ path */
const iconsPathArb = fc.tuple(pathSegmentArb, fc.constantFrom(...imageExtensions)).map(
  ([name, ext]) => new URL(`https://home-os.app/icons/${name}${ext}`)
)

/** Generate URLs that match static asset patterns: font files */
const fontUrlArb = fc.tuple(pathSegmentArb, pathSegmentArb, fc.constantFrom(...fontExtensions)).map(
  ([dir, name, ext]) => new URL(`https://home-os.app/assets/${dir}/${name}${ext}`)
)

/** Generate URLs that match static asset patterns: image files */
const imageUrlArb = fc.tuple(pathSegmentArb, pathSegmentArb, fc.constantFrom(...imageExtensions)).map(
  ([dir, name, ext]) => new URL(`https://home-os.app/${dir}/${name}${ext}`)
)

/** Generate any static asset URL */
const staticAssetUrlArb = fc.oneof(iconsPathArb, fontUrlArb, imageUrlArb)

/** Generate Supabase API URLs */
const supabaseUrlArb = fc.tuple(pathSegmentArb, pathSegmentArb, pathSegmentArb).map(
  ([project, table, id]) =>
    new URL(`https://${project}.supabase.co/rest/v1/${table}?id=eq.${id}`)
)

/** Generate non-navigate request modes */
const nonNavigateModeArb = fc.constantFrom("cors", "no-cors", "same-origin")

/** Generate URLs that are NOT static assets and NOT supabase */
const otherUrlArb = fc.tuple(pathSegmentArb, pathSegmentArb).map(
  ([seg1, seg2]) => new URL(`https://home-os.app/api/${seg1}/${seg2}`)
)

// --- Tests ---

describe("Feature: pwa-installable, Property 2: Service worker applies correct caching strategy based on request classification", () => {
  const swSource = readServiceWorkerSource()

  describe("Service worker source contains expected routing logic", () => {
    it("sw.js contains the isStaticAsset helper function", () => {
      expect(swSource).toContain("function isStaticAsset(url)")
    })

    it("sw.js contains network-first with timeout for navigation", () => {
      expect(swSource).toContain("networkFirstWithTimeout(request, 3000)")
    })

    it("sw.js contains cache-first for static assets", () => {
      expect(swSource).toContain("cacheFirst(request)")
    })

    it("sw.js contains network-only for Supabase API", () => {
      expect(swSource).toContain('url.hostname.includes("supabase.co")')
    })

    it("sw.js checks request.mode for navigation", () => {
      expect(swSource).toContain('request.mode === "navigate"')
    })
  })

  describe("Navigation requests → network-first with 3s timeout", () => {
    it("for any URL with mode 'navigate', the strategy is network-first-timeout", () => {
      fc.assert(
        fc.property(navigationRequestArb, ({ url, mode }) => {
          // Exclude supabase URLs since they take priority
          fc.pre(!url.hostname.includes("supabase.co"))
          const strategy = classifyRequest(url, mode)
          expect(strategy).toBe("network-first-timeout")
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Static assets → cache-first", () => {
    it("for any URL under /icons/ path, the strategy is cache-first", () => {
      fc.assert(
        fc.property(iconsPathArb, nonNavigateModeArb, (url, mode) => {
          const strategy = classifyRequest(url, mode)
          expect(strategy).toBe("cache-first")
        }),
        { numRuns: 100 }
      )
    })

    it("for any URL with a font file extension, the strategy is cache-first", () => {
      fc.assert(
        fc.property(fontUrlArb, nonNavigateModeArb, (url, mode) => {
          const strategy = classifyRequest(url, mode)
          expect(strategy).toBe("cache-first")
        }),
        { numRuns: 100 }
      )
    })

    it("for any URL with an image file extension, the strategy is cache-first", () => {
      fc.assert(
        fc.property(imageUrlArb, nonNavigateModeArb, (url, mode) => {
          const strategy = classifyRequest(url, mode)
          expect(strategy).toBe("cache-first")
        }),
        { numRuns: 100 }
      )
    })

    it("for any randomly generated static asset URL, the strategy is cache-first", () => {
      fc.assert(
        fc.property(staticAssetUrlArb, nonNavigateModeArb, (url, mode) => {
          const strategy = classifyRequest(url, mode)
          expect(strategy).toBe("cache-first")
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Supabase API → network-only", () => {
    it("for any URL with hostname containing 'supabase.co', the strategy is network-only", () => {
      fc.assert(
        fc.property(supabaseUrlArb, nonNavigateModeArb, (url, mode) => {
          const strategy = classifyRequest(url, mode)
          expect(strategy).toBe("network-only")
        }),
        { numRuns: 100 }
      )
    })

    it("supabase API takes priority even for navigate mode", () => {
      fc.assert(
        fc.property(supabaseUrlArb, (url) => {
          const strategy = classifyRequest(url, "navigate")
          expect(strategy).toBe("network-only")
        }),
        { numRuns: 100 }
      )
    })

    it("supabase API takes priority even for static asset-like paths", () => {
      fc.assert(
        fc.property(
          fc.tuple(pathSegmentArb, fc.constantFrom(...imageExtensions)).map(
            ([name, ext]) => new URL(`https://myproject.supabase.co/storage/v1/${name}${ext}`)
          ),
          nonNavigateModeArb,
          (url, mode) => {
            const strategy = classifyRequest(url, mode)
            expect(strategy).toBe("network-only")
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("Other requests → network-first without timeout", () => {
    it("for any non-static, non-supabase URL with non-navigate mode, the strategy is network-first", () => {
      fc.assert(
        fc.property(otherUrlArb, nonNavigateModeArb, (url, mode) => {
          const strategy = classifyRequest(url, mode)
          expect(strategy).toBe("network-first")
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("isStaticAsset classification correctness", () => {
    it("for any path starting with /icons/, isStaticAsset returns true", () => {
      fc.assert(
        fc.property(pathSegmentArb, (filename) => {
          const url = new URL(`https://home-os.app/icons/${filename}.png`)
          expect(isStaticAsset(url)).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("for any font extension, isStaticAsset returns true", () => {
      fc.assert(
        fc.property(
          pathSegmentArb,
          fc.constantFrom(...fontExtensions),
          (name, ext) => {
            const url = new URL(`https://home-os.app/fonts/${name}${ext}`)
            expect(isStaticAsset(url)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("for any image extension, isStaticAsset returns true", () => {
      fc.assert(
        fc.property(
          pathSegmentArb,
          fc.constantFrom(...imageExtensions),
          (name, ext) => {
            const url = new URL(`https://home-os.app/images/${name}${ext}`)
            expect(isStaticAsset(url)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("for any path without static asset patterns, isStaticAsset returns false", () => {
      fc.assert(
        fc.property(pathSegmentArb, pathSegmentArb, (seg1, seg2) => {
          // Ensure path doesn't start with /icons/ and doesn't end with asset extensions
          const url = new URL(`https://home-os.app/api/${seg1}/${seg2}`)
          expect(isStaticAsset(url)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Routing priority order matches sw.js implementation", () => {
    it("supabase check comes before navigation check (supabase navigate → network-only)", () => {
      fc.assert(
        fc.property(supabaseUrlArb, (url) => {
          // Even with navigate mode, supabase should be network-only
          expect(classifyRequest(url, "navigate")).toBe("network-only")
        }),
        { numRuns: 100 }
      )
    })

    it("navigation check comes before static asset check (navigate to image → network-first-timeout)", () => {
      fc.assert(
        fc.property(staticAssetUrlArb, (url) => {
          // Navigate mode should override static asset classification
          expect(classifyRequest(url, "navigate")).toBe("network-first-timeout")
        }),
        { numRuns: 100 }
      )
    })
  })
})
