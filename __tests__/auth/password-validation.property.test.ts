import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { validatePasswords } from "@/lib/auth/validation"

// Feature: forgot-password-and-disable-github-oauth, Property 3: Password mismatch detection
// Feature: forgot-password-and-disable-github-oauth, Property 4: Password length boundary validation

/**
 * Property 3: Password mismatch detection
 *
 * For any two distinct non-empty strings of valid length (6–128 characters),
 * the validatePasswords function SHALL return { valid: false, error: "Passwords do not match" }.
 *
 * **Validates: Requirements 3.4**
 */

/**
 * Property 4: Password length boundary validation
 *
 * For any string shorter than 6 characters, the validatePasswords function SHALL return
 * an error indicating the minimum length requirement. For any string longer than 128
 * characters, the validatePasswords function SHALL return an error indicating the maximum
 * length requirement.
 *
 * **Validates: Requirements 3.5, 3.6**
 */

// --- Generators ---

/** Generate strings of valid password length (6–128 characters) */
const validLengthPasswordArb = fc.string({ minLength: 6, maxLength: 128 })

/** Generate two distinct strings of valid length */
const distinctValidPasswordsArb = fc
  .tuple(validLengthPasswordArb, validLengthPasswordArb)
  .filter(([a, b]) => a !== b)

/** Generate strings shorter than 6 characters (1–5 chars) */
const tooShortPasswordArb = fc.string({ minLength: 1, maxLength: 5 })

/** Generate strings longer than 128 characters (129–300 chars) */
const tooLongPasswordArb = fc.string({ minLength: 129, maxLength: 300 })

// --- Tests ---

describe("Feature: forgot-password-and-disable-github-oauth, Property 3: Password mismatch detection", () => {
  it("returns mismatch error for any two distinct valid-length strings", () => {
    fc.assert(
      fc.property(distinctValidPasswordsArb, ([password, confirm]) => {
        const result = validatePasswords(password, confirm)
        expect(result.valid).toBe(false)
        expect(result.error).toBe("Passwords do not match")
      }),
      { numRuns: 100 }
    )
  })

  it("returns valid when password and confirm are identical and valid length", () => {
    fc.assert(
      fc.property(validLengthPasswordArb, (password) => {
        const result = validatePasswords(password, password)
        expect(result.valid).toBe(true)
        expect(result.error).toBeUndefined()
      }),
      { numRuns: 100 }
    )
  })
})

describe("Feature: forgot-password-and-disable-github-oauth, Property 4: Password length boundary validation", () => {
  it("returns min length error for any string shorter than 6 characters", () => {
    fc.assert(
      fc.property(tooShortPasswordArb, (password) => {
        const result = validatePasswords(password, password)
        expect(result.valid).toBe(false)
        expect(result.error).toBe("Password must be at least 6 characters")
      }),
      { numRuns: 100 }
    )
  })

  it("returns max length error for any string longer than 128 characters", () => {
    fc.assert(
      fc.property(tooLongPasswordArb, (password) => {
        const result = validatePasswords(password, password)
        expect(result.valid).toBe(false)
        expect(result.error).toBe("Password must not exceed 128 characters")
      }),
      { numRuns: 100 }
    )
  })

  it("accepts any string of exactly 6 characters (lower boundary)", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 6, maxLength: 6 }), (password) => {
        const result = validatePasswords(password, password)
        expect(result.valid).toBe(true)
      }),
      { numRuns: 100 }
    )
  })

  it("accepts any string of exactly 128 characters (upper boundary)", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 128, maxLength: 128 }), (password) => {
        const result = validatePasswords(password, password)
        expect(result.valid).toBe(true)
      }),
      { numRuns: 100 }
    )
  })
})
