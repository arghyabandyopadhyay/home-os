import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 9: Empty state content validation
 * Validates: Requirements 10.1, 10.4
 *
 * For any empty state configuration across all modules, the heading text SHALL be
 * no more than 60 characters and SHALL contain the module name (e.g., "notes", "tasks",
 * "contacts"), the body text SHALL be no more than 120 characters, and neither heading
 * nor body SHALL contain the banned phrases "No data found", "Nothing here", "No items",
 * or "Empty" as standalone text.
 *
 * Tags: Feature: app-ui-redesign, Property 9: Empty state content validation
 */

/** All modules in the application */
const MODULES = [
  "notes",
  "tasks",
  "calendar",
  "library",
  "documents",
  "contacts",
] as const

type ModuleName = (typeof MODULES)[number]

/** Banned phrases that must not appear as standalone text */
const BANNED_PHRASES = [
  "No data found",
  "Nothing here",
  "No items",
  "Empty",
] as const

/** Empty state configuration for a module */
type EmptyStateConfig = {
  module: ModuleName
  heading: string
  body: string
}

/** The actual empty state configurations used across all modules */
const EMPTY_STATE_CONFIGS: EmptyStateConfig[] = [
  {
    module: "notes",
    heading: "Start capturing your notes",
    body: "Write down ideas, thoughts, and things you want to remember. Your notes are always private and secure.",
  },
  {
    module: "tasks",
    heading: "Organize your tasks",
    body: "Create tasks to keep track of what needs to be done. Set priorities and due dates to stay on top of things.",
  },
  {
    module: "calendar",
    heading: "Your calendar awaits",
    body: "Connect your Google Calendar or create events to keep track of your schedule in one calm place.",
  },
  {
    module: "library",
    heading: "Build your library",
    body: "Add books you are reading or want to read. Track your progress and take notes as you go.",
  },
  {
    module: "documents",
    heading: "Store your documents",
    body: "Upload and organize important files. Keep everything in one place where you can find it easily.",
  },
  {
    module: "contacts",
    heading: "Add your first contacts",
    body: "Keep track of the people who matter. Store contact details and notes about your relationships.",
  },
]

/**
 * Checks if a text contains a banned phrase as standalone text.
 * "Standalone" means the phrase appears as the entire text or is bounded by
 * non-alphanumeric characters (word boundaries).
 */
function containsBannedPhrase(text: string): boolean {
  return BANNED_PHRASES.some((phrase) => {
    // Check exact match (entire text is the banned phrase)
    if (text.trim() === phrase) return true
    // Check as standalone phrase using word boundary regex
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const regex = new RegExp(`(?:^|\\W)${escaped}(?:\\W|$)`, "i")
    return regex.test(text)
  })
}

/**
 * Checks if the heading contains the module name (case-insensitive).
 */
function headingContainsModuleName(
  heading: string,
  module: ModuleName
): boolean {
  return heading.toLowerCase().includes(module.toLowerCase())
}

/**
 * Validates an empty state configuration against all constraints.
 */
function validateEmptyStateConfig(config: EmptyStateConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (config.heading.length > 60) {
    errors.push(
      `Heading exceeds 60 characters (${config.heading.length}): "${config.heading}"`
    )
  }

  if (!headingContainsModuleName(config.heading, config.module)) {
    errors.push(
      `Heading does not contain module name "${config.module}": "${config.heading}"`
    )
  }

  if (config.body.length > 120) {
    errors.push(
      `Body exceeds 120 characters (${config.body.length}): "${config.body}"`
    )
  }

  if (containsBannedPhrase(config.heading)) {
    errors.push(`Heading contains a banned phrase: "${config.heading}"`)
  }

  if (containsBannedPhrase(config.body)) {
    errors.push(`Body contains a banned phrase: "${config.body}"`)
  }

  return { valid: errors.length === 0, errors }
}

describe("Feature: app-ui-redesign, Property 9: Empty state content validation", () => {
  describe("Actual empty state configurations pass all constraints", () => {
    it.each(EMPTY_STATE_CONFIGS)(
      "$module: heading and body meet all requirements",
      (config) => {
        const result = validateEmptyStateConfig(config)
        expect(result.errors).toEqual([])
        expect(result.valid).toBe(true)
      }
    )
  })

  describe("Property-based: all module configs have headings within 60 characters", () => {
    const configArb = fc.constantFrom(...EMPTY_STATE_CONFIGS)

    it("heading length is at most 60 characters for any module config", () => {
      fc.assert(
        fc.property(configArb, (config) => {
          expect(config.heading.length).toBeLessThanOrEqual(60)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: all module configs have headings containing the module name", () => {
    const configArb = fc.constantFrom(...EMPTY_STATE_CONFIGS)

    it("heading contains the module name for any module config", () => {
      fc.assert(
        fc.property(configArb, (config) => {
          expect(
            headingContainsModuleName(config.heading, config.module)
          ).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: all module configs have body text within 120 characters", () => {
    const configArb = fc.constantFrom(...EMPTY_STATE_CONFIGS)

    it("body length is at most 120 characters for any module config", () => {
      fc.assert(
        fc.property(configArb, (config) => {
          expect(config.body.length).toBeLessThanOrEqual(120)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: no module config contains banned phrases", () => {
    const configArb = fc.constantFrom(...EMPTY_STATE_CONFIGS)

    it("neither heading nor body contains banned phrases for any module config", () => {
      fc.assert(
        fc.property(configArb, (config) => {
          expect(containsBannedPhrase(config.heading)).toBe(false)
          expect(containsBannedPhrase(config.body)).toBe(false)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: validation logic correctly rejects invalid configs", () => {
    const moduleArb = fc.constantFrom(...MODULES)
    const bannedPhraseArb = fc.constantFrom(...BANNED_PHRASES)

    it("rejects headings that exceed 60 characters", () => {
      const longHeadingArb = fc.tuple(moduleArb, fc.string({ minLength: 50, maxLength: 80 })).map(
        ([module, suffix]) => ({
          module,
          heading: `Your ${module} ${suffix}`,
          body: "A valid body text.",
        })
      ).filter((config) => config.heading.length > 60)

      fc.assert(
        fc.property(longHeadingArb, (config) => {
          const result = validateEmptyStateConfig(config)
          expect(result.valid).toBe(false)
          expect(result.errors.some((e) => e.includes("exceeds 60"))).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("rejects headings that do not contain the module name", () => {
      const noModuleHeadingArb = moduleArb.map((module) => ({
        module,
        heading: "Get started with your work",
        body: "A valid body text under the limit.",
      }))

      fc.assert(
        fc.property(noModuleHeadingArb, (config) => {
          // "Get started with your work" does not contain any module name
          const result = validateEmptyStateConfig(config)
          expect(result.valid).toBe(false)
          expect(
            result.errors.some((e) => e.includes("does not contain module name"))
          ).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("rejects body text that exceeds 120 characters", () => {
      const longBodyArb = moduleArb.map((module) => ({
        module,
        heading: `Start with ${module}`,
        body: "This is a very long body text that goes well beyond the one hundred and twenty character limit that is imposed by the design system requirements for empty states.",
      }))

      fc.assert(
        fc.property(longBodyArb, (config) => {
          const result = validateEmptyStateConfig(config)
          expect(result.valid).toBe(false)
          expect(result.errors.some((e) => e.includes("exceeds 120"))).toBe(true)
        }),
        { numRuns: 100 }
      )
    })

    it("rejects headings containing banned phrases", () => {
      fc.assert(
        fc.property(
          fc.tuple(moduleArb, bannedPhraseArb),
          ([module, bannedPhrase]) => {
            const config: EmptyStateConfig = {
              module,
              heading: `${bannedPhrase} in ${module}`,
              body: "A valid body text.",
            }
            const result = validateEmptyStateConfig(config)
            expect(result.valid).toBe(false)
            expect(
              result.errors.some((e) => e.includes("banned phrase"))
            ).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })

    it("rejects body text containing banned phrases", () => {
      fc.assert(
        fc.property(
          fc.tuple(moduleArb, bannedPhraseArb),
          ([module, bannedPhrase]) => {
            const config: EmptyStateConfig = {
              module,
              heading: `Start with ${module}`,
              body: `${bannedPhrase} — try creating something.`,
            }
            const result = validateEmptyStateConfig(config)
            expect(result.valid).toBe(false)
            expect(
              result.errors.some((e) => e.includes("banned phrase"))
            ).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe("Property-based: randomly generated valid configs always pass validation", () => {
    const validConfigArb: fc.Arbitrary<EmptyStateConfig> = fc
      .constantFrom(...MODULES)
      .chain((module) => {
        // Generate a heading that contains the module name and is ≤60 chars
        const maxPrefixLen = 60 - module.length - 1 // leave room for module + space
        const headingArb = fc
          .string({ minLength: 1, maxLength: Math.min(maxPrefixLen, 30) })
          .filter(
            (s) =>
              !BANNED_PHRASES.some((bp) =>
                s.toLowerCase().includes(bp.toLowerCase())
              )
          )
          .map((prefix) => {
            const cleaned = prefix.replace(/[^\w\s]/g, "").trim() || "Start"
            return `${cleaned} ${module}`
          })
          .filter((h) => h.length <= 60)

        // Generate a body that is ≤120 chars and contains no banned phrases
        const bodyArb = fc
          .string({ minLength: 10, maxLength: 100 })
          .filter(
            (s) =>
              !BANNED_PHRASES.some((bp) =>
                s.toLowerCase().includes(bp.toLowerCase())
              )
          )
          .map((s) => s.replace(/[^\w\s.,!?]/g, "").trim())
          .filter((b) => b.length > 0 && b.length <= 120)

        return fc.record({
          module: fc.constant(module),
          heading: headingArb,
          body: bodyArb,
        })
      })

    it("any randomly generated valid config passes all validation rules", () => {
      fc.assert(
        fc.property(validConfigArb, (config) => {
          expect(config.heading.length).toBeLessThanOrEqual(60)
          expect(config.body.length).toBeLessThanOrEqual(120)
          expect(
            headingContainsModuleName(config.heading, config.module)
          ).toBe(true)
          expect(containsBannedPhrase(config.heading)).toBe(false)
          expect(containsBannedPhrase(config.body)).toBe(false)

          const result = validateEmptyStateConfig(config)
          expect(result.valid).toBe(true)
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Banned phrase detection edge cases", () => {
    it("detects 'Empty' as standalone but not as part of another word", () => {
      expect(containsBannedPhrase("Empty")).toBe(true)
      expect(containsBannedPhrase("This is Empty state")).toBe(true)
      // "Emptying" contains "Empty" but not as standalone
      expect(containsBannedPhrase("Emptying the trash")).toBe(false)
    })

    it("detects all banned phrases case-insensitively", () => {
      expect(containsBannedPhrase("no data found")).toBe(true)
      expect(containsBannedPhrase("NO DATA FOUND")).toBe(true)
      expect(containsBannedPhrase("nothing here")).toBe(true)
      expect(containsBannedPhrase("no items")).toBe(true)
    })

    it("does not flag text that merely contains banned words in different contexts", () => {
      expect(containsBannedPhrase("You have no items yet")).toBe(true)
      expect(containsBannedPhrase("Create your first note")).toBe(false)
      expect(containsBannedPhrase("Start capturing ideas")).toBe(false)
    })
  })
})
