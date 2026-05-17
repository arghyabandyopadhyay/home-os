import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 5: Error messages are sanitized and bounded
 * Validates: Requirements 7.1, 7.5
 *
 * For any error_description string (including strings containing stack traces,
 * raw error codes, HTML, or arbitrary Unicode), the Login Page SHALL display a
 * toast message that is at most 200 characters long and does not contain raw
 * technical details (stack frames, HTTP status codes in numeric format, or JSON
 * error objects).
 *
 * Tags: Feature: oauth-authentication, Property 5: Error messages are sanitized and bounded
 */

// Copy of the sanitizeErrorMessage function from app/login/page.tsx
function sanitizeErrorMessage(raw: string): string {
  let message = raw.slice(0, 200)
  // Remove stack trace lines
  message = message.replace(/\s*at\s+.*/g, "")
  // Remove JSON-like content
  message = message.replace(/\{[^}]*\}/g, "")
  // Remove HTTP status codes like "404" or "500"
  message = message.replace(/\b[1-5]\d{2}\b/g, "")
  // Trim whitespace
  message = message.trim()
  return message || "Authentication failed"
}

// --- Generators ---

/** Generate very long strings (1000+ chars) */
const longStringArb = fc.string({ minLength: 1000, maxLength: 5000 })

/** Generate strings with stack traces */
const stackTraceArb = fc.tuple(fc.string(), fc.string(), fc.integer({ min: 1, max: 999 }), fc.integer({ min: 1, max: 99 })).map(
  ([msg, filePath, line, col]) =>
    `Error: ${msg}\n  at Module._compile (${filePath}.js:${line}:${col})\n  at Object.Module._extensions (node:internal/modules/cjs/loader:${line}:${col})`
)

/** Generate strings with JSON objects */
const jsonErrorArb = fc.record({
  error: fc.string({ minLength: 1, maxLength: 30 }),
  code: fc.integer({ min: 100, max: 599 }),
  message: fc.string({ minLength: 1, maxLength: 50 }),
}).map((obj) => JSON.stringify(obj))

/** Generate strings with HTTP status codes */
const httpCodeArb = fc.tuple(
  fc.constantFrom("Error", "Failed", "HTTP", "Status"),
  fc.integer({ min: 100, max: 599 }),
  fc.string({ minLength: 1, maxLength: 50 })
).map(([prefix, code, suffix]) => `${prefix} ${code}: ${suffix}`)

/** Generate HTML content */
const htmlArb = fc.tuple(
  fc.constantFrom("script", "div", "img", "iframe", "a"),
  fc.string({ minLength: 1, maxLength: 50 })
).map(([tag, content]) => `<${tag}>${content}</${tag}>`)

/** Generate unicode and special characters */
const unicodeArb = fc.string({ unit: "grapheme-composite", minLength: 1, maxLength: 200 })

/** Generate empty strings */
const emptyArb = fc.constant("")

/** Combined arbitrary that produces diverse error strings */
const errorStringArb = fc.oneof(
  { weight: 2, arbitrary: longStringArb },
  { weight: 3, arbitrary: stackTraceArb },
  { weight: 3, arbitrary: jsonErrorArb },
  { weight: 3, arbitrary: httpCodeArb },
  { weight: 2, arbitrary: htmlArb },
  { weight: 2, arbitrary: unicodeArb },
  { weight: 1, arbitrary: emptyArb },
  { weight: 4, arbitrary: fc.string({ minLength: 0, maxLength: 500 }) }
)

// --- Tests ---

describe("Feature: oauth-authentication, Property 5: Error messages are sanitized and bounded", () => {
  it("output is always ≤200 characters for any input", () => {
    fc.assert(
      fc.property(errorStringArb, (input) => {
        const result = sanitizeErrorMessage(input)
        expect(result.length).toBeLessThanOrEqual(200)
      }),
      { numRuns: 100 }
    )
  })

  it("output never contains stack trace patterns (lines with 'at ' followed by function/file references)", () => {
    fc.assert(
      fc.property(errorStringArb, (input) => {
        const result = sanitizeErrorMessage(input)
        // Stack trace pattern: "at " followed by typical function/file reference
        const stackTracePattern = /\s+at\s+\S+/
        expect(result).not.toMatch(stackTracePattern)
      }),
      { numRuns: 100 }
    )
  })

  it("output never contains standalone 3-digit HTTP status codes (100-599)", () => {
    fc.assert(
      fc.property(errorStringArb, (input) => {
        const result = sanitizeErrorMessage(input)
        // Match standalone HTTP status codes (word boundary on both sides)
        const httpCodePattern = /\b[1-5]\d{2}\b/
        expect(result).not.toMatch(httpCodePattern)
      }),
      { numRuns: 100 }
    )
  })

  it("output never contains JSON objects (curly braces with content)", () => {
    fc.assert(
      fc.property(errorStringArb, (input) => {
        const result = sanitizeErrorMessage(input)
        // JSON object pattern: opening brace, content, closing brace
        const jsonPattern = /\{[^}]+\}/
        expect(result).not.toMatch(jsonPattern)
      }),
      { numRuns: 100 }
    )
  })

  it("output is never empty (falls back to 'Authentication failed')", () => {
    fc.assert(
      fc.property(errorStringArb, (input) => {
        const result = sanitizeErrorMessage(input)
        expect(result.length).toBeGreaterThan(0)
        // If the sanitization would produce empty, it should fall back
        if (input.trim() === "" || input.slice(0, 200).replace(/\s*at\s+.*/g, "").replace(/\{[^}]*\}/g, "").replace(/\b[1-5]\d{2}\b/g, "").trim() === "") {
          expect(result).toBe("Authentication failed")
        }
      }),
      { numRuns: 100 }
    )
  })

  it("specifically handles very long strings (1000+ chars) by truncating to ≤200", () => {
    fc.assert(
      fc.property(longStringArb, (input) => {
        const result = sanitizeErrorMessage(input)
        expect(result.length).toBeLessThanOrEqual(200)
      }),
      { numRuns: 100 }
    )
  })

  it("specifically handles stack trace inputs by removing trace lines", () => {
    fc.assert(
      fc.property(stackTraceArb, (input) => {
        const result = sanitizeErrorMessage(input)
        expect(result.length).toBeLessThanOrEqual(200)
        const stackTracePattern = /\s+at\s+\S+/
        expect(result).not.toMatch(stackTracePattern)
      }),
      { numRuns: 100 }
    )
  })

  it("specifically handles JSON error strings by removing JSON objects", () => {
    fc.assert(
      fc.property(jsonErrorArb, (input) => {
        const result = sanitizeErrorMessage(input)
        expect(result.length).toBeLessThanOrEqual(200)
        const jsonPattern = /\{[^}]+\}/
        expect(result).not.toMatch(jsonPattern)
      }),
      { numRuns: 100 }
    )
  })

  it("specifically handles HTTP code strings by removing status codes", () => {
    fc.assert(
      fc.property(httpCodeArb, (input) => {
        const result = sanitizeErrorMessage(input)
        expect(result.length).toBeLessThanOrEqual(200)
        const httpCodePattern = /\b[1-5]\d{2}\b/
        expect(result).not.toMatch(httpCodePattern)
      }),
      { numRuns: 100 }
    )
  })

  it("specifically handles HTML content without breaking", () => {
    fc.assert(
      fc.property(htmlArb, (input) => {
        const result = sanitizeErrorMessage(input)
        expect(result.length).toBeLessThanOrEqual(200)
        expect(result.length).toBeGreaterThan(0)
      }),
      { numRuns: 100 }
    )
  })
})
