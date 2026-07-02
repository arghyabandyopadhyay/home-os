import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import {
  getCollaboratorColor,
  hashUserId,
  COLLABORATOR_COLORS,
} from "@/lib/collaboration/collaborator-colors"

/**
 * Property 6: Color Assignment Determinism
 * Validates: Requirement 3.6
 *
 * For any given user ID, the assigned collaborator color is always the same
 * across all clients and sessions. All 8 palette colors are reachable.
 *
 * Tags: Feature: realtime-collaboration-frontend, Property 6: Color assignment determinism
 */

describe("Feature: realtime-collaboration-frontend, Property 6: Color assignment determinism", () => {
  it("getCollaboratorColor returns the same color for the same userId (determinism)", () => {
    fc.assert(
      fc.property(fc.string(), (userId) => {
        const color1 = getCollaboratorColor(userId)
        const color2 = getCollaboratorColor(userId)
        expect(color1).toBe(color2)
      }),
      { numRuns: 1000 }
    )
  })

  it("getCollaboratorColor always returns a color from the COLLABORATOR_COLORS palette", () => {
    fc.assert(
      fc.property(fc.string(), (userId) => {
        const color = getCollaboratorColor(userId)
        expect(COLLABORATOR_COLORS as readonly string[]).toContain(color)
      }),
      { numRuns: 1000 }
    )
  })

  it("hashUserId always returns a non-negative integer", () => {
    fc.assert(
      fc.property(fc.string(), (userId) => {
        const hash = hashUserId(userId)
        expect(hash).toBeGreaterThanOrEqual(0)
        expect(Number.isInteger(hash)).toBe(true)
      }),
      { numRuns: 1000 }
    )
  })

  it("all 8 palette colors are reachable (there exist userIds that map to each index)", () => {
    const observedColors = new Set<string>()

    // Generate 1000 random strings and collect colors
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 50 }), (userId) => {
        const color = getCollaboratorColor(userId)
        observedColors.add(color)
      }),
      { numRuns: 1000 }
    )

    // After running through 1000 random strings, all 8 colors should be hit
    expect(observedColors.size).toBe(COLLABORATOR_COLORS.length)
  })
})
