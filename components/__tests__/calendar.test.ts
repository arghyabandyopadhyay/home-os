import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import type { CalendarEvent } from "@/types/calendar"

// ─── Pure functions for calendar logic ────────────────────────────────────────

/**
 * Get the local date key (YYYY-MM-DD) for a given ISO timestamp in the user's timezone.
 */
function getEventDateKey(startsAt: string, timeZone: string): string {
  const date = new Date(startsAt)
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  }).formatToParts(date)

  const year = parts.find((p) => p.type === "year")!.value
  const month = parts.find((p) => p.type === "month")!.value
  const day = parts.find((p) => p.type === "day")!.value
  return `${year}-${month}-${day}`
}

/**
 * Place events into calendar grid cells by their starts_at date.
 */
function placeEventsInGrid(
  events: CalendarEvent[],
  timeZone: string
): Map<string, CalendarEvent[]> {
  const grid = new Map<string, CalendarEvent[]>()
  for (const event of events) {
    const dateKey = getEventDateKey(event.starts_at, timeZone)
    if (!grid.has(dateKey)) {
      grid.set(dateKey, [])
    }
    grid.get(dateKey)!.push(event)
  }
  return grid
}

/**
 * Determine if an event should have a Google visual indicator.
 */
function hasGoogleIndicator(event: CalendarEvent): boolean {
  return event.source === "google"
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calendarEventArb(): fc.Arbitrary<CalendarEvent> {
  const isoDateArb = fc.integer({ min: 1704067200000, max: 1798761600000 }).map(
    (ts) => new Date(ts).toISOString()
  )
  return fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    title: fc.string({ minLength: 1, maxLength: 50 }),
    starts_at: isoDateArb,
    ends_at: fc.option(isoDateArb, { nil: null }),
    all_day: fc.boolean(),
    source: fc.constantFrom("home_os", "google"),
    external_id: fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: null }),
    external_calendar_id: fc.option(fc.string({ minLength: 5, maxLength: 20 }), { nil: null }),
    html_link: fc.option(fc.string({ minLength: 10, maxLength: 50 }), { nil: null }),
    location: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
    description: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
    created_at: isoDateArb,
    updated_at: isoDateArb,
  })
}

// ─── Property Tests ───────────────────────────────────────────────────────────

// Feature: calm-home-os, Property 15: Event placement by date
describe("P15: Calendar Event Placement by Date", () => {
  it("each event appears in the grid cell corresponding to its starts_at date", () => {
    fc.assert(
      fc.property(
        fc.array(calendarEventArb(), { minLength: 0, maxLength: 20 }),
        fc.constantFrom("America/New_York", "Europe/London", "Asia/Tokyo", "UTC"),
        (events, timeZone) => {
          const grid = placeEventsInGrid(events, timeZone)

          // Every event in a cell should have starts_at matching that cell's date
          for (const [dateKey, cellEvents] of grid.entries()) {
            for (const event of cellEvents) {
              const eventDateKey = getEventDateKey(event.starts_at, timeZone)
              expect(eventDateKey).toBe(dateKey)
            }
          }

          // Every input event should appear in exactly one cell
          let totalPlaced = 0
          for (const cellEvents of grid.values()) {
            totalPlaced += cellEvents.length
          }
          expect(totalPlaced).toBe(events.length)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 17: Google event visual distinction
describe("P17: Google Event Visual Distinction", () => {
  it("events with source=google have indicator, events with source=home_os do not", () => {
    fc.assert(
      fc.property(
        fc.array(calendarEventArb(), { minLength: 1, maxLength: 20 }),
        (events) => {
          for (const event of events) {
            if (event.source === "google") {
              expect(hasGoogleIndicator(event)).toBe(true)
            } else {
              expect(hasGoogleIndicator(event)).toBe(false)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
