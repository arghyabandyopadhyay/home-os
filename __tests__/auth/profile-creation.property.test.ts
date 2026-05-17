import { describe, it, expect } from "vitest"
import * as fc from "fast-check"

/**
 * Property 1: Profile creation correctly maps and truncates OAuth metadata
 * Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.7, 3.8
 *
 * For any valid OAuth user metadata (containing arbitrary combinations of
 * full_name/name, avatar_url/picture, and provider fields with strings of any length),
 * the profile creation trigger SHALL produce a profile row where:
 * - full_name equals the first 255 characters of the provider's display name (or null if empty/missing)
 * - avatar_url equals the first 2048 characters of the provider's image URL (or null if missing)
 * - auth_provider equals the provider identifier from raw_app_meta_data (default 'email')
 * - email equals the user's email
 *
 * Tags: Feature: oauth-authentication, Property 1: Profile creation correctly maps and truncates OAuth metadata
 */

// --- Pure TypeScript implementation mirroring the handle_new_user() trigger ---

type RawUserMetaData = {
  full_name?: string | null
  name?: string | null
  avatar_url?: string | null
  picture?: string | null
  [key: string]: unknown
}

type RawAppMetaData = {
  provider?: string | null
  [key: string]: unknown
}

type AuthUser = {
  id: string
  email: string | null
  raw_user_meta_data: RawUserMetaData | null
  raw_app_meta_data: RawAppMetaData | null
}

type ProfileRecord = {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  auth_provider: string
  metadata: Record<string, unknown>
}

/**
 * Pure function that mirrors the handle_new_user() PostgreSQL trigger logic.
 * This extracts and transforms OAuth metadata into a profile record.
 */
function handleNewUser(user: AuthUser): ProfileRecord {
  const rawUserMeta = user.raw_user_meta_data
  const rawAppMeta = user.raw_app_meta_data

  // Extract provider from app_metadata
  const provider = rawAppMeta?.provider ?? null

  // Extract display name: full_name takes priority over name, then truncate to 255
  let fullName: string | null = null
  if (rawUserMeta) {
    const rawName = rawUserMeta.full_name ?? rawUserMeta.name ?? null
    if (rawName != null) {
      fullName = rawName.slice(0, 255)
    }
  }

  // Extract avatar URL: avatar_url takes priority over picture, then truncate to 2048
  let avatarUrl: string | null = null
  if (rawUserMeta) {
    const rawAvatar = rawUserMeta.avatar_url ?? rawUserMeta.picture ?? null
    if (rawAvatar != null) {
      avatarUrl = rawAvatar.slice(0, 2048)
    }
  }

  // Set null for empty strings
  if (fullName === "") fullName = null
  if (avatarUrl === "") avatarUrl = null

  return {
    id: user.id,
    email: user.email,
    full_name: fullName,
    avatar_url: avatarUrl,
    auth_provider: provider ?? "email",
    metadata: (rawUserMeta as Record<string, unknown>) ?? {},
  }
}

// --- Generators ---

/** Generates a string of length 0–5000 including Unicode content */
const arbitraryString = fc.string({ minLength: 0, maxLength: 5000 })

/** Generates an optional string field (string | null | undefined) */
const optionalStringField = fc.oneof(
  fc.constant(undefined),
  fc.constant(null),
  arbitraryString
)

/** Generates raw_user_meta_data with varying field presence */
const rawUserMetaDataArb: fc.Arbitrary<RawUserMetaData | null> = fc.oneof(
  fc.constant(null),
  fc.record(
    {
      full_name: optionalStringField,
      name: optionalStringField,
      avatar_url: optionalStringField,
      picture: optionalStringField,
    },
    { requiredKeys: [] }
  )
)

/** Generates raw_app_meta_data with varying provider field */
const rawAppMetaDataArb: fc.Arbitrary<RawAppMetaData | null> = fc.oneof(
  fc.constant(null),
  fc.record(
    {
      provider: fc.oneof(
        fc.constant(undefined),
        fc.constant(null),
        fc.string({ minLength: 1, maxLength: 32 })
      ),
    },
    { requiredKeys: [] }
  )
)

/** Generates a full AuthUser object */
const authUserArb: fc.Arbitrary<AuthUser> = fc.record({
  id: fc.uuid(),
  email: fc.oneof(fc.constant(null), fc.emailAddress()),
  raw_user_meta_data: rawUserMetaDataArb,
  raw_app_meta_data: rawAppMetaDataArb,
})

// --- Tests ---

describe("Feature: oauth-authentication, Property 1: Profile creation correctly maps and truncates OAuth metadata", () => {
  it("full_name is truncated to at most 255 characters", () => {
    fc.assert(
      fc.property(authUserArb, (user) => {
        const profile = handleNewUser(user)
        if (profile.full_name !== null) {
          expect(profile.full_name.length).toBeLessThanOrEqual(255)
        }
      }),
      { numRuns: 100 }
    )
  })

  it("avatar_url is truncated to at most 2048 characters", () => {
    fc.assert(
      fc.property(authUserArb, (user) => {
        const profile = handleNewUser(user)
        if (profile.avatar_url !== null) {
          expect(profile.avatar_url.length).toBeLessThanOrEqual(2048)
        }
      }),
      { numRuns: 100 }
    )
  })

  it("full_name is null when no display name fields are present or all are empty", () => {
    fc.assert(
      fc.property(authUserArb, (user) => {
        const meta = user.raw_user_meta_data
        const hasFullName = meta?.full_name != null && meta.full_name !== ""
        const hasName = meta?.name != null && meta.name !== ""

        const profile = handleNewUser(user)

        if (!hasFullName && !hasName) {
          expect(profile.full_name).toBeNull()
        }
      }),
      { numRuns: 100 }
    )
  })

  it("full_name prefers full_name over name when both are present", () => {
    fc.assert(
      fc.property(authUserArb, (user) => {
        const meta = user.raw_user_meta_data
        if (meta?.full_name != null && meta.full_name !== "") {
          const profile = handleNewUser(user)
          const expected = meta.full_name.slice(0, 255)
          expect(profile.full_name).toBe(expected === "" ? null : expected)
        }
      }),
      { numRuns: 100 }
    )
  })

  it("avatar_url prefers avatar_url over picture when both are present", () => {
    fc.assert(
      fc.property(authUserArb, (user) => {
        const meta = user.raw_user_meta_data
        if (meta?.avatar_url != null && meta.avatar_url !== "") {
          const profile = handleNewUser(user)
          const expected = meta.avatar_url.slice(0, 2048)
          expect(profile.avatar_url).toBe(expected === "" ? null : expected)
        }
      }),
      { numRuns: 100 }
    )
  })

  it("avatar_url is null when no image URL fields are present or all are empty", () => {
    fc.assert(
      fc.property(authUserArb, (user) => {
        const meta = user.raw_user_meta_data
        const hasAvatarUrl = meta?.avatar_url != null && meta.avatar_url !== ""
        const hasPicture = meta?.picture != null && meta.picture !== ""

        const profile = handleNewUser(user)

        if (!hasAvatarUrl && !hasPicture) {
          expect(profile.avatar_url).toBeNull()
        }
      }),
      { numRuns: 100 }
    )
  })

  it("auth_provider defaults to 'email' when raw_app_meta_data.provider is missing", () => {
    fc.assert(
      fc.property(authUserArb, (user) => {
        const provider = user.raw_app_meta_data?.provider
        const profile = handleNewUser(user)

        if (provider == null) {
          expect(profile.auth_provider).toBe("email")
        } else {
          expect(profile.auth_provider).toBe(provider)
        }
      }),
      { numRuns: 100 }
    )
  })

  it("email is preserved exactly from the auth user", () => {
    fc.assert(
      fc.property(authUserArb, (user) => {
        const profile = handleNewUser(user)
        expect(profile.email).toBe(user.email)
      }),
      { numRuns: 100 }
    )
  })

  it("id is preserved exactly from the auth user", () => {
    fc.assert(
      fc.property(authUserArb, (user) => {
        const profile = handleNewUser(user)
        expect(profile.id).toBe(user.id)
      }),
      { numRuns: 100 }
    )
  })

  it("full_name correctly truncates strings longer than 255 characters", () => {
    const longNameUserArb = fc.record({
      id: fc.uuid(),
      email: fc.emailAddress(),
      raw_user_meta_data: fc.record({
        full_name: fc.string({ minLength: 256, maxLength: 5000 }),
        name: fc.constant(undefined),
        avatar_url: fc.constant(undefined),
        picture: fc.constant(undefined),
      }),
      raw_app_meta_data: fc.constant({ provider: "google" }),
    })

    fc.assert(
      fc.property(longNameUserArb, (user) => {
        const profile = handleNewUser(user)
        expect(profile.full_name).not.toBeNull()
        expect(profile.full_name!.length).toBe(255)
        expect(profile.full_name).toBe(
          user.raw_user_meta_data!.full_name!.slice(0, 255)
        )
      }),
      { numRuns: 100 }
    )
  })

  it("avatar_url correctly truncates strings longer than 2048 characters", () => {
    const longUrlUserArb = fc.record({
      id: fc.uuid(),
      email: fc.emailAddress(),
      raw_user_meta_data: fc.record({
        full_name: fc.constant(undefined),
        name: fc.constant(undefined),
        avatar_url: fc.string({ minLength: 2049, maxLength: 5000 }),
        picture: fc.constant(undefined),
      }),
      raw_app_meta_data: fc.constant({ provider: "github" }),
    })

    fc.assert(
      fc.property(longUrlUserArb, (user) => {
        const profile = handleNewUser(user)
        expect(profile.avatar_url).not.toBeNull()
        expect(profile.avatar_url!.length).toBe(2048)
        expect(profile.avatar_url).toBe(
          user.raw_user_meta_data!.avatar_url!.slice(0, 2048)
        )
      }),
      { numRuns: 100 }
    )
  })
})

/**
 * Property 2: Profile creation is idempotent
 * Validates: Requirements 3.6
 *
 * For any existing profile record, if the auth trigger fires again for the
 * same user ID (simulating a returning OAuth user), the profiles table SHALL
 * contain exactly one row for that user ID with the original data unchanged.
 *
 * Tags: Feature: oauth-authentication, Property 2: Profile creation is idempotent
 */

// --- Idempotency simulation ---

/**
 * Simulates the `handle_new_user()` trigger with ON CONFLICT (id) DO NOTHING.
 * Inserts a profile into the store only if no profile with the same id exists.
 */
function insertProfileWithConflictDoNothing(
  store: Map<string, ProfileRecord>,
  profile: ProfileRecord
): void {
  if (!store.has(profile.id)) {
    store.set(profile.id, { ...profile })
  }
  // ON CONFLICT (id) DO NOTHING — existing record stays unchanged
}

// --- Generators for Property 2 ---

const profileRecordArb: fc.Arbitrary<ProfileRecord> = fc.record({
  id: fc.uuid(),
  email: fc.oneof(fc.constant(null), fc.emailAddress()),
  full_name: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 255 })),
  avatar_url: fc.oneof(fc.constant(null), fc.webUrl().map((url) => url.slice(0, 2048))),
  auth_provider: fc.constantFrom("google", "github", "email"),
  metadata: fc.dictionary(
    fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z_]\w*$/.test(s)),
    fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
    { minKeys: 0, maxKeys: 5 }
  ) as fc.Arbitrary<Record<string, unknown>>,
})

/**
 * Generate a "duplicate" profile with the same ID but different data,
 * simulating a returning user whose OAuth metadata may have changed.
 */
function duplicateProfileArb(originalId: string): fc.Arbitrary<ProfileRecord> {
  return fc.record({
    id: fc.constant(originalId),
    email: fc.oneof(fc.constant(null), fc.emailAddress()),
    full_name: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 255 })),
    avatar_url: fc.oneof(fc.constant(null), fc.webUrl().map((url) => url.slice(0, 2048))),
    auth_provider: fc.constantFrom("google", "github", "email"),
    metadata: fc.dictionary(
      fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-zA-Z_]\w*$/.test(s)),
      fc.oneof(fc.string(), fc.integer(), fc.boolean(), fc.constant(null)),
      { minKeys: 0, maxKeys: 5 }
    ) as fc.Arbitrary<Record<string, unknown>>,
  })
}

// --- Property 2 Tests ---

describe("Feature: oauth-authentication, Property 2: Profile creation is idempotent", () => {
  it("duplicate insert with same ID preserves original profile data unchanged", () => {
    fc.assert(
      fc.property(profileRecordArb, (originalProfile) => {
        const store = new Map<string, ProfileRecord>()

        // First insert — creates the profile
        insertProfileWithConflictDoNothing(store, originalProfile)

        // Generate a duplicate with different data but same ID
        const duplicate: ProfileRecord = {
          id: originalProfile.id,
          email: "different@example.com",
          full_name: "Different Name",
          avatar_url: "https://different.example.com/avatar.png",
          auth_provider: "github",
          metadata: { changed: true },
        }

        // Second insert — should be a no-op due to ON CONFLICT DO NOTHING
        insertProfileWithConflictDoNothing(store, duplicate)

        // Verify exactly one row exists for this ID
        const entries = [...store.values()].filter((p) => p.id === originalProfile.id)
        expect(entries).toHaveLength(1)

        // Verify original data is preserved unchanged
        const stored = store.get(originalProfile.id)!
        expect(stored.email).toBe(originalProfile.email)
        expect(stored.full_name).toBe(originalProfile.full_name)
        expect(stored.avatar_url).toBe(originalProfile.avatar_url)
        expect(stored.auth_provider).toBe(originalProfile.auth_provider)
        expect(stored.metadata).toEqual(originalProfile.metadata)
      }),
      { numRuns: 100 }
    )
  })

  it("multiple duplicate inserts still result in exactly one profile row", () => {
    fc.assert(
      fc.property(
        profileRecordArb,
        fc.integer({ min: 2, max: 10 }),
        (originalProfile, insertCount) => {
          const store = new Map<string, ProfileRecord>()

          // First insert
          insertProfileWithConflictDoNothing(store, originalProfile)

          // Multiple duplicate inserts with varying data
          for (let i = 0; i < insertCount; i++) {
            const duplicate: ProfileRecord = {
              id: originalProfile.id,
              email: `attempt${i}@example.com`,
              full_name: `Attempt ${i}`,
              avatar_url: `https://example.com/avatar${i}.png`,
              auth_provider: i % 2 === 0 ? "google" : "github",
              metadata: { attempt: i },
            }
            insertProfileWithConflictDoNothing(store, duplicate)
          }

          // Still exactly one row
          const entries = [...store.values()].filter((p) => p.id === originalProfile.id)
          expect(entries).toHaveLength(1)

          // Original data preserved
          const stored = store.get(originalProfile.id)!
          expect(stored).toEqual(originalProfile)
        }
      ),
      { numRuns: 100 }
    )
  })

  it("idempotency holds with randomly generated duplicate profiles", () => {
    fc.assert(
      fc.property(profileRecordArb, (originalProfile) => {
        // Nested property: for any random duplicate, original is preserved
        fc.assert(
          fc.property(
            duplicateProfileArb(originalProfile.id),
            (duplicateProfile) => {
              const store = new Map<string, ProfileRecord>()

              // Insert original
              insertProfileWithConflictDoNothing(store, originalProfile)

              // Insert duplicate with random different data but same ID
              insertProfileWithConflictDoNothing(store, duplicateProfile)

              // Verify single row with original data
              expect(store.size).toBe(1)
              const stored = store.get(originalProfile.id)!
              expect(stored.id).toBe(originalProfile.id)
              expect(stored.email).toBe(originalProfile.email)
              expect(stored.full_name).toBe(originalProfile.full_name)
              expect(stored.avatar_url).toBe(originalProfile.avatar_url)
              expect(stored.auth_provider).toBe(originalProfile.auth_provider)
              expect(stored.metadata).toEqual(originalProfile.metadata)
            }
          ),
          { numRuns: 5 }
        )
      }),
      { numRuns: 20 }
    )
  })

  it("store with multiple different users is not affected by duplicate insert for one user", () => {
    fc.assert(
      fc.property(
        fc.array(profileRecordArb, { minLength: 2, maxLength: 5 }).filter(
          (profiles) => new Set(profiles.map((p) => p.id)).size === profiles.length
        ),
        (profiles) => {
          const store = new Map<string, ProfileRecord>()

          // Insert all unique profiles
          for (const profile of profiles) {
            insertProfileWithConflictDoNothing(store, profile)
          }

          expect(store.size).toBe(profiles.length)

          // Attempt duplicate insert for the first profile with different data
          const target = profiles[0]
          const duplicate: ProfileRecord = {
            id: target.id,
            email: "intruder@example.com",
            full_name: "Intruder",
            avatar_url: "https://evil.com/avatar.png",
            auth_provider: "github",
            metadata: { hacked: true },
          }
          insertProfileWithConflictDoNothing(store, duplicate)

          // Total count unchanged
          expect(store.size).toBe(profiles.length)

          // Target profile data unchanged
          const stored = store.get(target.id)!
          expect(stored).toEqual(target)

          // Other profiles also unchanged (no data corruption)
          for (const profile of profiles.slice(1)) {
            expect(store.get(profile.id)).toEqual(profile)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
