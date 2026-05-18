import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { greetingForHour } from "@/lib/date"

/**
 * Property 5: Time-aware greeting correctness
 * Validates: Requirements 8.4
 *
 * For any hour value in the range 0–23, the `greetingForHour` function SHALL return
 * a morning greeting for hours 0–11, an afternoon greeting for hours 12–16, and an
 * evening greeting for hours 17–23.
 *
 * Tags: Feature: app-ui-redesign, Property 5: Time-aware greeting correctness
 */

describe("Feature: app-ui-redesign, Property 5: Time-aware greeting correctness", () => {
  describe("Property-based: greetingForHour returns correct period for any valid hour", () => {
    const hourArb = fc.integer({ min: 0, max: 23 })

    it("returns a morning greeting for hours 0–11", () => {
      const morningHourArb = fc.integer({ min: 0, max: 11 })

      fc.assert(
        fc.property(morningHourArb, (hour) => {
          const greeting = greetingForHour(hour)
          expect(greeting.toLowerCase()).toContain("morning")
        }),
        { numRuns: 100 }
      )
    })

    it("returns an afternoon greeting for hours 12–16", () => {
      const afternoonHourArb = fc.integer({ min: 12, max: 16 })

      fc.assert(
        fc.property(afternoonHourArb, (hour) => {
          const greeting = greetingForHour(hour)
          expect(greeting.toLowerCase()).toContain("afternoon")
        }),
        { numRuns: 100 }
      )
    })

    it("returns an evening greeting for hours 17–23", () => {
      const eveningHourArb = fc.integer({ min: 17, max: 23 })

      fc.assert(
        fc.property(eveningHourArb, (hour) => {
          const greeting = greetingForHour(hour)
          expect(greeting.toLowerCase()).toContain("evening")
        }),
        { numRuns: 100 }
      )
    })

    it("returns exactly one of morning, afternoon, or evening for any hour 0–23", () => {
      fc.assert(
        fc.property(hourArb, (hour) => {
          const greeting = greetingForHour(hour).toLowerCase()
          const isMorning = greeting.includes("morning")
          const isAfternoon = greeting.includes("afternoon")
          const isEvening = greeting.includes("evening")

          // Exactly one period should be present
          const matchCount = [isMorning, isAfternoon, isEvening].filter(Boolean).length
          expect(matchCount).toBe(1)
        }),
        { numRuns: 100 }
      )
    })

    it("maps every hour to the correct time period", () => {
      fc.assert(
        fc.property(hourArb, (hour) => {
          const greeting = greetingForHour(hour).toLowerCase()

          if (hour >= 0 && hour <= 11) {
            expect(greeting).toContain("morning")
          } else if (hour >= 12 && hour <= 16) {
            expect(greeting).toContain("afternoon")
          } else {
            expect(greeting).toContain("evening")
          }
        }),
        { numRuns: 100 }
      )
    })
  })

  describe("Boundary values", () => {
    it("hour 0 (midnight) returns morning", () => {
      expect(greetingForHour(0).toLowerCase()).toContain("morning")
    })

    it("hour 11 (last morning hour) returns morning", () => {
      expect(greetingForHour(11).toLowerCase()).toContain("morning")
    })

    it("hour 12 (first afternoon hour) returns afternoon", () => {
      expect(greetingForHour(12).toLowerCase()).toContain("afternoon")
    })

    it("hour 16 (last afternoon hour) returns afternoon", () => {
      expect(greetingForHour(16).toLowerCase()).toContain("afternoon")
    })

    it("hour 17 (first evening hour) returns evening", () => {
      expect(greetingForHour(17).toLowerCase()).toContain("evening")
    })

    it("hour 23 (last evening hour) returns evening", () => {
      expect(greetingForHour(23).toLowerCase()).toContain("evening")
    })
  })
})
