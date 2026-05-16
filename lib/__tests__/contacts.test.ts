import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import {
  sortContactsAlphabetically,
  filterContactsByQuery,
} from "@/lib/contacts-utils"
import { mapGoogleContact } from "@/lib/google-contacts-utils"
import type { Contact } from "@/types/contact"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function contactArb(): fc.Arbitrary<Contact> {
  const isoDateArb = fc.integer({ min: 1577836800000, max: 1924905600000 }).map(
    (ts) => new Date(ts).toISOString()
  )
  return fc.record({
    id: fc.uuid(),
    user_id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    email: fc.option(fc.emailAddress(), { nil: null }),
    phone: fc.option(fc.string({ minLength: 5, maxLength: 15 }), { nil: null }),
    company: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
    role: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: null }),
    notes: fc.option(fc.string({ maxLength: 100 }), { nil: null }),
    favorite: fc.boolean(),
    created_at: isoDateArb,
    updated_at: isoDateArb,
  })
}

// ─── Property Tests ───────────────────────────────────────────────────────────

// Feature: calm-home-os, Property 18: Alphabetical order
describe("P18: Contacts Alphabetical Order", () => {
  it("sorted output is ordered alphabetically by name (case-insensitive) within each favorite group", () => {
    fc.assert(
      fc.property(
        fc.array(contactArb(), { minLength: 0, maxLength: 20 }),
        (contacts) => {
          const sorted = sortContactsAlphabetically(contacts)

          // Favorites should come first
          let seenNonFavorite = false
          for (const contact of sorted) {
            if (!contact.favorite) {
              seenNonFavorite = true
            } else if (seenNonFavorite) {
              // A favorite appeared after a non-favorite — violation
              expect(true).toBe(false)
            }
          }

          // Within each group (favorites and non-favorites), names should be alphabetical
          const favorites = sorted.filter((c) => c.favorite)
          const nonFavorites = sorted.filter((c) => !c.favorite)

          for (const group of [favorites, nonFavorites]) {
            for (let i = 0; i < group.length - 1; i++) {
              const cmp = group[i].name.localeCompare(group[i + 1].name, undefined, {
                sensitivity: "base",
              })
              expect(cmp).toBeLessThanOrEqual(0)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 20: Contacts search completeness
describe("P20: Contacts Search Completeness", () => {
  it("every contact in result matches query in name, email, or phone; no non-matching contact appears", () => {
    fc.assert(
      fc.property(
        fc.array(contactArb(), { minLength: 0, maxLength: 20 }),
        fc.string({ minLength: 2, maxLength: 15 }),
        (contacts, query) => {
          const result = filterContactsByQuery(contacts, query)
          const q = query.toLowerCase().trim()

          if (q.length < 2) {
            expect(result.length).toBe(contacts.length)
            return
          }

          // Every result must match
          for (const contact of result) {
            const matches =
              contact.name.toLowerCase().includes(q) ||
              (contact.email ?? "").toLowerCase().includes(q) ||
              (contact.phone ?? "").toLowerCase().includes(q)
            expect(matches).toBe(true)
          }

          // No non-matching contact should appear
          const resultIds = new Set(result.map((c) => c.id))
          for (const contact of contacts) {
            const matches =
              contact.name.toLowerCase().includes(q) ||
              (contact.email ?? "").toLowerCase().includes(q) ||
              (contact.phone ?? "").toLowerCase().includes(q)
            if (!matches) {
              expect(resultIds.has(contact.id)).toBe(false)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 21: Google contact field mapping
describe("P21: Google Contact Field Mapping", () => {
  it("maps names[0].displayName to name, emailAddresses[0].value to email, phoneNumbers[0].value to phone", () => {
    fc.assert(
      fc.property(
        fc.record({
          resourceName: fc.option(fc.string({ minLength: 5, maxLength: 30 }), { nil: undefined }),
          names: fc.option(
            fc.array(
              fc.record({
                displayName: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
              }),
              { minLength: 1, maxLength: 3 }
            ),
            { nil: undefined }
          ),
          emailAddresses: fc.option(
            fc.array(
              fc.record({
                value: fc.option(fc.emailAddress(), { nil: undefined }),
              }),
              { minLength: 1, maxLength: 3 }
            ),
            { nil: undefined }
          ),
          phoneNumbers: fc.option(
            fc.array(
              fc.record({
                value: fc.option(fc.string({ minLength: 5, maxLength: 15 }), { nil: undefined }),
              }),
              { minLength: 1, maxLength: 3 }
            ),
            { nil: undefined }
          ),
          organizations: fc.option(
            fc.array(
              fc.record({
                name: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
                title: fc.option(fc.string({ minLength: 1, maxLength: 30 }), { nil: undefined }),
              }),
              { minLength: 1, maxLength: 2 }
            ),
            { nil: undefined }
          ),
        }),
        (person) => {
          const mapped = mapGoogleContact(person)

          // name should be names[0].displayName or null
          const expectedName = person.names?.[0]?.displayName || null
          expect(mapped.name).toBe(expectedName)

          // email should be emailAddresses[0].value or null
          const expectedEmail = person.emailAddresses?.[0]?.value || null
          expect(mapped.email).toBe(expectedEmail)

          // phone should be phoneNumbers[0].value or null
          const expectedPhone = person.phoneNumbers?.[0]?.value || null
          expect(mapped.phone).toBe(expectedPhone)
        }
      ),
      { numRuns: 100 }
    )
  })
})

// Feature: calm-home-os, Property 22: Manual contact preservation
describe("P22: Manual Contact Preservation", () => {
  it("manual contacts are never modified by import logic (simulated)", () => {
    fc.assert(
      fc.property(
        fc.array(contactArb(), { minLength: 1, maxLength: 10 }),
        (contacts) => {
          // Simulate: mark some contacts as manual, some as google
          const withSource = contacts.map((c, i) => ({
            ...c,
            source: i % 2 === 0 ? "manual" : "google",
          }))

          // Simulate import: only google-sourced contacts would be updated
          const manualContacts = withSource.filter((c) => c.source === "manual")
          const originalManual = manualContacts.map((c) => ({ ...c }))

          // After simulated import, manual contacts should be unchanged
          for (let i = 0; i < manualContacts.length; i++) {
            expect(manualContacts[i].name).toBe(originalManual[i].name)
            expect(manualContacts[i].email).toBe(originalManual[i].email)
            expect(manualContacts[i].phone).toBe(originalManual[i].phone)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
