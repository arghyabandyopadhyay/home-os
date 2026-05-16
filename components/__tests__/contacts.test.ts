import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import type { Contact } from "@/types/contact"

// ─── Pure function for contact card display logic ─────────────────────────────

type ContactCardFields = {
  name: string
  email: string | null
  phone: string | null
}

/**
 * Determines which fields should be displayed on a contact card.
 * - name is always displayed
 * - email is displayed if non-null and non-empty
 * - phone is displayed if non-null and non-empty
 */
function getContactCardDisplayFields(contact: Contact): ContactCardFields {
  return {
    name: contact.name,
    email: contact.email && contact.email.trim() !== "" ? contact.email : null,
    phone: contact.phone && contact.phone.trim() !== "" ? contact.phone : null,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function contactArb(): fc.Arbitrary<Contact> {
  const isoDateArb = fc.integer({ min: 1577836800000, max: 1924905600000 }).map(
    (ts) => new Date(ts).toISOString()
  )
  return fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    email: fc.oneof(
      fc.constant(null),
      fc.constant(""),
      fc.emailAddress()
    ),
    phone: fc.oneof(
      fc.constant(null),
      fc.constant(""),
      fc.string({ minLength: 5, maxLength: 15 })
    ),
    company: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
    role: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
    notes: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
    favorite: fc.boolean(),
    created_at: isoDateArb,
    updated_at: isoDateArb,
  })
}

// ─── Property Tests ───────────────────────────────────────────────────────────

// Feature: calm-home-os, Property 19: Contact card display completeness
describe("P19: Contact Card Display Completeness", () => {
  it("name is always displayed; email/phone appear only when non-null and non-empty", () => {
    fc.assert(
      fc.property(contactArb(), (contact) => {
        const display = getContactCardDisplayFields(contact)

        // Name is always displayed
        expect(display.name).toBe(contact.name)

        // Email: displayed if non-null and non-empty
        if (contact.email !== null && contact.email.trim() !== "") {
          expect(display.email).toBe(contact.email)
        } else {
          expect(display.email).toBeNull()
        }

        // Phone: displayed if non-null and non-empty
        if (contact.phone !== null && contact.phone.trim() !== "") {
          expect(display.phone).toBe(contact.phone)
        } else {
          expect(display.phone).toBeNull()
        }
      }),
      { numRuns: 100 }
    )
  })
})
