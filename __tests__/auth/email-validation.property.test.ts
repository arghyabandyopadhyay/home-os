import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { validateEmail } from "@/lib/auth/validation"

// Feature: forgot-password-and-disable-github-oauth, Property 1: Invalid email rejection

/**
 * Property 1: Invalid email rejection
 * Validates: Requirements 1.5, 2.4, 2.5, 2.8
 *
 * For any string that is empty, composed entirely of whitespace, missing an @ symbol,
 * missing a domain after @, or exceeds 254 characters, the validateEmail function
 * SHALL return { valid: false } with an appropriate error message.
 */

// --- Generators ---

/** Generate empty strings */
const emptyStringArb = fc.constant("")

/** Generate whitespace-only strings (spaces, tabs, newlines) */
const whitespaceOnlyArb = fc
  .array(fc.constantFrom(" ", "\t", "\n", "\r", "  ", "\t\t"), { minLength: 1, maxLength: 20 })
  .map((parts) => parts.join(""))

/** Generate strings missing the @ symbol entirely */
const missingAtArb = fc
  .string({ minLength: 1, maxLength: 100 })
  .filter((s) => !s.includes("@") && s.trim().length > 0)

/** Generate strings with @ but no valid domain (nothing after @, or no dot in domain) */
const noDomainArb = fc.oneof(
  // local part followed by @ with nothing after
  fc.string({ minLength: 1, maxLength: 50 }).filter((s) => !s.includes("@") && !s.includes(" ") && s.trim().length > 0).map((local) => `${local}@`),
  // local part followed by @ with domain missing dot
  fc.tuple(
    fc.string({ minLength: 1, maxLength: 30 }).filter((s) => !s.includes("@") && !s.includes(" ") && !s.includes(".") && s.trim().length > 0),
    fc.string({ minLength: 1, maxLength: 30 }).filter((s) => !s.includes("@") && !s.includes(" ") && !s.includes(".") && s.trim().length > 0)
  ).map(([local, domain]) => `${local}@${domain}`)
)

/** Generate strings exceeding 254 characters */
const tooLongArb = fc
  .string({ minLength: 255, maxLength: 500 })

// --- Tests ---

describe("Feature: forgot-password-and-disable-github-oauth, Property 1: Invalid email rejection", () => {
  /**
   * Validates: Requirements 1.5, 2.4
   */
  it("rejects empty strings with valid: false", () => {
    fc.assert(
      fc.property(emptyStringArb, (input) => {
        const result = validateEmail(input)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Validates: Requirements 1.5, 2.4
   */
  it("rejects whitespace-only strings with valid: false", () => {
    fc.assert(
      fc.property(whitespaceOnlyArb, (input) => {
        const result = validateEmail(input)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toBe("Email address is required")
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Validates: Requirements 1.5, 2.5
   */
  it("rejects strings missing @ symbol with valid: false", () => {
    fc.assert(
      fc.property(missingAtArb, (input) => {
        const result = validateEmail(input)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Validates: Requirements 1.5, 2.5
   */
  it("rejects strings with @ but no valid domain with valid: false", () => {
    fc.assert(
      fc.property(noDomainArb, (input) => {
        const result = validateEmail(input)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
      }),
      { numRuns: 100 }
    )
  })

  /**
   * Validates: Requirements 2.8
   */
  it("rejects strings exceeding 254 characters with valid: false", () => {
    fc.assert(
      fc.property(tooLongArb, (input) => {
        const result = validateEmail(input)
        expect(result.valid).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error).toBe("Email is too long")
      }),
      { numRuns: 100 }
    )
  })
})
