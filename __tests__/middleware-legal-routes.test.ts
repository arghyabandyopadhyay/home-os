import { describe, it, expect } from "vitest"
import { config } from "@/app/middleware"

/**
 * Validates: Requirements 1.1, 1.6
 *
 * The middleware must NOT protect legal routes (/privacy, /terms, /contact).
 * These pages are publicly accessible to unauthenticated visitors.
 */
describe("Middleware does not protect legal routes", () => {
  const legalRoutes = ["/privacy", "/terms", "/contact"]

  it("matcher config does not include /privacy", () => {
    const matchesPrivacy = config.matcher.some(
      (pattern: string) => pattern === "/privacy" || pattern.startsWith("/privacy/")
    )
    expect(matchesPrivacy).toBe(false)
  })

  it("matcher config does not include /terms", () => {
    const matchesTerms = config.matcher.some(
      (pattern: string) => pattern === "/terms" || pattern.startsWith("/terms/")
    )
    expect(matchesTerms).toBe(false)
  })

  it("matcher config does not include /contact", () => {
    const matchesContact = config.matcher.some(
      (pattern: string) => pattern === "/contact" || pattern.startsWith("/contact/")
    )
    expect(matchesContact).toBe(false)
  })

  it("none of the legal routes appear in the matcher config", () => {
    for (const route of legalRoutes) {
      const isMatched = config.matcher.some(
        (pattern: string) => pattern === route || pattern.startsWith(`${route}/`)
      )
      expect(isMatched, `${route} should not be in the middleware matcher`).toBe(false)
    }
  })
})
