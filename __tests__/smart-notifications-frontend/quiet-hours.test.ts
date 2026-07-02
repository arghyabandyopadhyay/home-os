import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { isWithinQuietHours } from "@/lib/notifications/quiet-hours"

describe("isWithinQuietHours", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns false when start is null", () => {
    expect(isWithinQuietHours(null, "07:00")).toBe(false)
  })

  it("returns false when end is null", () => {
    expect(isWithinQuietHours("22:00", null)).toBe(false)
  })

  it("returns false when both params are null", () => {
    expect(isWithinQuietHours(null, null)).toBe(false)
  })

  it("returns false for invalid start format", () => {
    expect(isWithinQuietHours("25:00", "07:00")).toBe(false)
    expect(isWithinQuietHours("abc", "07:00")).toBe(false)
    expect(isWithinQuietHours("9:00", "07:00")).toBe(false)
  })

  it("returns false for invalid end format", () => {
    expect(isWithinQuietHours("22:00", "07:60")).toBe(false)
    expect(isWithinQuietHours("22:00", "")).toBe(false)
  })

  describe("same-day range (start < end)", () => {
    it("returns true when current time is within range", () => {
      // Set time to 12:00
      vi.setSystemTime(new Date(2024, 0, 15, 12, 0, 0))
      expect(isWithinQuietHours("09:00", "17:00")).toBe(true)
    })

    it("returns false when current time is before range", () => {
      // Set time to 08:00
      vi.setSystemTime(new Date(2024, 0, 15, 8, 0, 0))
      expect(isWithinQuietHours("09:00", "17:00")).toBe(false)
    })

    it("returns false when current time is after range", () => {
      // Set time to 18:00
      vi.setSystemTime(new Date(2024, 0, 15, 18, 0, 0))
      expect(isWithinQuietHours("09:00", "17:00")).toBe(false)
    })

    it("returns true at the start boundary", () => {
      // Set time to 09:00 (inclusive start)
      vi.setSystemTime(new Date(2024, 0, 15, 9, 0, 0))
      expect(isWithinQuietHours("09:00", "17:00")).toBe(true)
    })

    it("returns false at the end boundary", () => {
      // Set time to 17:00 (exclusive end)
      vi.setSystemTime(new Date(2024, 0, 15, 17, 0, 0))
      expect(isWithinQuietHours("09:00", "17:00")).toBe(false)
    })
  })

  describe("overnight range (start > end, crossing midnight)", () => {
    it("returns true when current time is after start (before midnight)", () => {
      // Set time to 23:00
      vi.setSystemTime(new Date(2024, 0, 15, 23, 0, 0))
      expect(isWithinQuietHours("22:00", "07:00")).toBe(true)
    })

    it("returns true when current time is before end (after midnight)", () => {
      // Set time to 03:00
      vi.setSystemTime(new Date(2024, 0, 15, 3, 0, 0))
      expect(isWithinQuietHours("22:00", "07:00")).toBe(true)
    })

    it("returns false when current time is outside the range", () => {
      // Set time to 12:00
      vi.setSystemTime(new Date(2024, 0, 15, 12, 0, 0))
      expect(isWithinQuietHours("22:00", "07:00")).toBe(false)
    })

    it("returns true at the start boundary", () => {
      // Set time to 22:00 (inclusive start)
      vi.setSystemTime(new Date(2024, 0, 15, 22, 0, 0))
      expect(isWithinQuietHours("22:00", "07:00")).toBe(true)
    })

    it("returns false at the end boundary", () => {
      // Set time to 07:00 (exclusive end)
      vi.setSystemTime(new Date(2024, 0, 15, 7, 0, 0))
      expect(isWithinQuietHours("22:00", "07:00")).toBe(false)
    })

    it("returns true at midnight", () => {
      // Set time to 00:00
      vi.setSystemTime(new Date(2024, 0, 15, 0, 0, 0))
      expect(isWithinQuietHours("22:00", "07:00")).toBe(true)
    })
  })

  describe("edge cases", () => {
    it("handles range where start equals end (empty range)", () => {
      // When start === end, same-day branch: currentMinutes >= start && currentMinutes < end
      // This means no time satisfies the condition (range is empty)
      vi.setSystemTime(new Date(2024, 0, 15, 22, 0, 0))
      expect(isWithinQuietHours("22:00", "22:00")).toBe(false)
    })

    it("handles minute-level precision", () => {
      // Set time to 22:30
      vi.setSystemTime(new Date(2024, 0, 15, 22, 30, 0))
      expect(isWithinQuietHours("22:30", "06:30")).toBe(true)
    })

    it("handles time just before start in overnight range", () => {
      // Set time to 21:59
      vi.setSystemTime(new Date(2024, 0, 15, 21, 59, 0))
      expect(isWithinQuietHours("22:00", "07:00")).toBe(false)
    })
  })
})
