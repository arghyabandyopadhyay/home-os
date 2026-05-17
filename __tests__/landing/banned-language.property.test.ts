/**
 * Property 2: Banned language exclusion
 * Validates: Requirements 7.5, 8.3
 *
 * For any text content rendered in the Emotional Hook Section or CTA Section,
 * the text SHALL NOT contain any of the banned hustle-culture words or generic
 * SaaS phrases when compared case-insensitively.
 *
 * Tags: Feature: landing-page, Property 2: Banned language exclusion
 */
import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import {
  HERO_CONTENT,
  MODULES,
  PHILOSOPHY_CONTENT,
  WORKFLOW_CONTENT,
  EMOTIONAL_HOOK_CONTENT,
  CTA_CONTENT,
  BANNED_HUSTLE_WORDS,
  BANNED_GENERIC_CTA,
} from '@/components/landing/content'

// ─── Helper Function ─────────────────────────────────────────────────────────

/**
 * Checks whether a given text contains any banned language (case-insensitive).
 * Returns true if the text contains a banned word or phrase.
 */
function containsBannedLanguage(text: string): boolean {
  const lowerText = text.toLowerCase()
  const allBanned = [...BANNED_HUSTLE_WORDS, ...BANNED_GENERIC_CTA]
  return allBanned.some((banned) => lowerText.includes(banned.toLowerCase()))
}

// ─── Collect All Content Strings ─────────────────────────────────────────────

function getAllContentStrings(): string[] {
  const strings: string[] = []

  // Hero content
  strings.push(HERO_CONTENT.headline)
  strings.push(HERO_CONTENT.subheadline)
  strings.push(HERO_CONTENT.primaryCTA.label)
  strings.push(HERO_CONTENT.secondaryCTA.label)

  // Modules
  for (const mod of MODULES) {
    strings.push(mod.name)
    strings.push(mod.label)
    strings.push(mod.description)
  }

  // Philosophy
  strings.push(PHILOSOPHY_CONTENT.heading)
  strings.push(PHILOSOPHY_CONTENT.problem)
  strings.push(PHILOSOPHY_CONTENT.solution)

  // Workflow
  strings.push(WORKFLOW_CONTENT.heading)
  strings.push(WORKFLOW_CONTENT.body)

  // Emotional Hook
  strings.push(EMOTIONAL_HOOK_CONTENT.narrative)
  if (EMOTIONAL_HOOK_CONTENT.secondary) {
    strings.push(EMOTIONAL_HOOK_CONTENT.secondary)
  }

  // CTA
  strings.push(CTA_CONTENT.headline)
  strings.push(CTA_CONTENT.buttonLabel)

  return strings
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('Feature: landing-page, Property 2: Banned language exclusion', () => {
  describe('actual content constants contain no banned language', () => {
    const allContent = getAllContentStrings()

    it('no content string contains banned hustle-culture words or generic SaaS phrases', () => {
      for (const text of allContent) {
        expect(
          containsBannedLanguage(text),
          `Content "${text}" contains banned language`
        ).toBe(false)
      }
    })
  })

  describe('containsBannedLanguage correctly detects violations', () => {
    const allBanned = [...BANNED_HUSTLE_WORDS, ...BANNED_GENERIC_CTA]

    // Arbitrary for generating a random banned word from the list
    const bannedWordArb = fc.constantFrom(...allBanned)

    // Arbitrary for generating random surrounding text (no banned words)
    // Uses a safe alphabet that cannot accidentally form banned phrases
    const cleanTextArb = fc.array(
      fc.constantFrom(...'abcdefghijklmnopqrstuvwyz '.split('')),
      { minLength: 1, maxLength: 50 }
    ).map((chars) => chars.join(''))

    it('detects banned words embedded in random text (case-insensitive)', () => {
      fc.assert(
        fc.property(
          cleanTextArb,
          bannedWordArb,
          cleanTextArb,
          (prefix, banned, suffix) => {
            const text = `${prefix}${banned}${suffix}`
            expect(
              containsBannedLanguage(text),
              `Expected "${text}" to be detected as containing banned language "${banned}"`
            ).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('detects banned words regardless of case variation', () => {
      fc.assert(
        fc.property(
          bannedWordArb,
          (banned) => {
            // Test uppercase
            expect(containsBannedLanguage(banned.toUpperCase())).toBe(true)
            // Test mixed case
            const mixed = banned
              .split('')
              .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()))
              .join('')
            expect(containsBannedLanguage(mixed)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('does not flag clean text that contains no banned words', () => {
      // Generate text from a safe alphabet that cannot accidentally form banned phrases
      const safeTextArb = fc.array(
        fc.constantFrom(...'zyxwvuqpkjf '.split('')),
        { minLength: 1, maxLength: 100 }
      ).map((chars) => chars.join(''))

      fc.assert(
        fc.property(safeTextArb, (text) => {
          expect(
            containsBannedLanguage(text),
            `Expected "${text}" to NOT be flagged as banned`
          ).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })
})
