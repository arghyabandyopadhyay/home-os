import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { MODULES } from "@/components/landing/content"
import type { ModuleData } from "@/components/landing/content"

/**
 * Property 1: Module content constraints
 * Validates: Requirements 5.2
 *
 * For any module data object in the feature showcase, the label field SHALL
 * contain at most 8 words, the description field SHALL contain at most 20 words,
 * and the icon/visual element SHALL be non-empty.
 *
 * Tags: Feature: landing-page, Property 1: Module content constraints
 */

function countWords(text: string): number {
  return text.split(/\s+/).filter((segment) => segment.length > 0).length
}

describe("Feature: landing-page, Property 1: Module content constraints", () => {
  describe("Actual MODULES constant validation", () => {
    it("every module label has at most 8 words", () => {
      for (const mod of MODULES) {
        const wordCount = countWords(mod.label)
        expect(wordCount).toBeLessThanOrEqual(8)
      }
    })

    it("every module description has at most 20 words", () => {
      for (const mod of MODULES) {
        const wordCount = countWords(mod.description)
        expect(wordCount).toBeLessThanOrEqual(20)
      }
    })

    it("every module icon is a non-empty string", () => {
      for (const mod of MODULES) {
        expect(mod.icon).toBeTruthy()
        expect(mod.icon.trim().length).toBeGreaterThan(0)
      }
    })

    it("every module name is a non-empty string", () => {
      for (const mod of MODULES) {
        expect(mod.name).toBeTruthy()
        expect(mod.name.trim().length).toBeGreaterThan(0)
      }
    })
  })

  describe("Property-based: constraint-checking logic holds for random module data", () => {
    const moduleDataArb: fc.Arbitrary<ModuleData> = fc.record({
      name: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
      label: fc
        .array(fc.string({ minLength: 1 }).filter((w) => /^\S+$/.test(w)), {
          minLength: 1,
          maxLength: 8,
        })
        .map((words) => words.join(" ")),
      description: fc
        .array(fc.string({ minLength: 1 }).filter((w) => /^\S+$/.test(w)), {
          minLength: 1,
          maxLength: 20,
        })
        .map((words) => words.join(" ")),
      icon: fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
    })

    it("label word count is always ≤ 8 for valid module data", () => {
      fc.assert(
        fc.property(moduleDataArb, (mod) => {
          const wordCount = countWords(mod.label)
          expect(wordCount).toBeLessThanOrEqual(8)
        }),
        { numRuns: 100 }
      )
    })

    it("description word count is always ≤ 20 for valid module data", () => {
      fc.assert(
        fc.property(moduleDataArb, (mod) => {
          const wordCount = countWords(mod.description)
          expect(wordCount).toBeLessThanOrEqual(20)
        }),
        { numRuns: 100 }
      )
    })

    it("icon is always a non-empty string for valid module data", () => {
      fc.assert(
        fc.property(moduleDataArb, (mod) => {
          expect(mod.icon.trim().length).toBeGreaterThan(0)
        }),
        { numRuns: 100 }
      )
    })

    it("name is always a non-empty string for valid module data", () => {
      fc.assert(
        fc.property(moduleDataArb, (mod) => {
          expect(mod.name.trim().length).toBeGreaterThan(0)
        }),
        { numRuns: 100 }
      )
    })

    it("detects violations when label exceeds 8 words", () => {
      const overLimitLabelArb = fc
        .array(fc.string({ minLength: 1 }).filter((w) => /^\S+$/.test(w)), {
          minLength: 9,
          maxLength: 15,
        })
        .map((words) => words.join(" "))

      fc.assert(
        fc.property(overLimitLabelArb, (label) => {
          const wordCount = countWords(label)
          expect(wordCount).toBeGreaterThan(8)
        }),
        { numRuns: 100 }
      )
    })

    it("detects violations when description exceeds 20 words", () => {
      const overLimitDescArb = fc
        .array(fc.string({ minLength: 1 }).filter((w) => /^\S+$/.test(w)), {
          minLength: 21,
          maxLength: 30,
        })
        .map((words) => words.join(" "))

      fc.assert(
        fc.property(overLimitDescArb, (description) => {
          const wordCount = countWords(description)
          expect(wordCount).toBeGreaterThan(20)
        }),
        { numRuns: 100 }
      )
    })
  })
})
