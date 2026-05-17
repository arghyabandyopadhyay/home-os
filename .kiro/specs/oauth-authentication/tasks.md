# Implementation Plan: OAuth Authentication

## Overview

Add OAuth-based authentication via Google and GitHub to Home OS, leveraging Supabase Auth's built-in OAuth support. The implementation covers: database schema changes (profiles table extension + trigger), a reusable OAuthButton component system, enhanced auth callback error handling, login page UI updates with toast-based error feedback, and comprehensive property-based and unit tests.

## Tasks

- [x] 1. Database schema and profile trigger
  - [x] 1.1 Create migration to extend profiles table with OAuth fields
    - Create `supabase/migrations/YYYYMMDD_profiles_oauth_fields.sql`
    - Add columns: `full_name` (text, max 255), `avatar_url` (text, max 2048), `auth_provider` (text, max 32), `metadata` (jsonb, default '{}')
    - Add CHECK constraints for field lengths
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.7, 3.8, 9.3_

  - [x] 1.2 Create database trigger for automatic profile creation
    - Create `handle_new_user()` PostgreSQL function in the same migration
    - Extract `full_name`/`name`, `avatar_url`/`picture` from `raw_user_meta_data` with fallback logic
    - Truncate fields with `LEFT()` to respect constraints
    - Use `ON CONFLICT (id) DO NOTHING` for idempotency
    - Create trigger on `auth.users` AFTER INSERT
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 1.3 Write property test for profile metadata mapping (Property 1)
    - **Property 1: Profile creation correctly maps and truncates OAuth metadata**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.7, 3.8**
    - Test file: `__tests__/auth/profile-creation.property.test.ts`
    - Generate random user metadata objects with varying field presence, string lengths (0–5000 chars), Unicode content
    - Verify correct field extraction, truncation to 255/2048 chars, null handling for empty strings

  - [x] 1.4 Write property test for profile creation idempotency (Property 2)
    - **Property 2: Profile creation is idempotent**
    - **Validates: Requirements 3.6**
    - Test file: `__tests__/auth/profile-creation.property.test.ts`
    - Generate random existing profiles + duplicate insert attempts
    - Verify single row preserved, no data corruption

- [x] 2. OAuth provider configuration and icons
  - [x] 2.1 Create OAuth provider configuration registry
    - Create `lib/auth/oauth-providers.ts`
    - Define `OAuthProviderConfig` type with `id`, `name`, `icon`, `label` fields
    - Export `OAUTH_PROVIDERS` array with Google and GitHub entries
    - _Requirements: 9.1, 9.4, 9.5_

  - [x] 2.2 Create OAuth provider icon components
    - Create `components/auth/oauth-icons.tsx`
    - Implement Google SVG icon component with `className` prop
    - Implement GitHub SVG icon component with `className` prop
    - _Requirements: 5.1, 5.2_

- [x] 3. OAuthButton component system
  - [x] 3.1 Create OAuthButton component
    - Create `components/auth/oauth-button.tsx` as a client component
    - Accept props: `provider`, `label`, `icon`, `disabled`, `loading`, `onClick`
    - Render full-width button with min-height 48px, `rounded-xl`, `bg-app-elevated`
    - Show provider icon left-aligned, label centered
    - Show spinner + "Connecting..." when loading
    - Apply `opacity-50` and `pointer-events-none` when disabled
    - Add `aria-label="Sign in with {provider name}"` for accessibility
    - Add visible focus ring and keyboard Tab support
    - Hover: background opacity transition over 150ms
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.6, 9.4_

  - [x] 3.2 Create OAuthButtonGroup component
    - Create `components/auth/oauth-button-group.tsx` as a client component
    - Accept `onError` callback prop
    - Track which provider is currently loading (or null)
    - Call `supabase.auth.signInWithOAuth()` with selected provider and `redirectTo` pointing to `/auth/callback`
    - Disable all buttons while any flow is in progress
    - Implement 10-second timeout that resets loading state and calls `onError`
    - _Requirements: 1.1, 2.1, 5.4, 5.7, 7.3, 10.1, 10.7_

  - [x] 3.3 Write property test for OAuthButton rendering (Property 4)
    - **Property 4: OAuthButton renders correctly for any valid provider configuration**
    - **Validates: Requirements 5.4, 5.6, 9.4**
    - Test file: `__tests__/auth/oauth-button.property.test.ts`
    - Generate random provider configs (names ≤32 chars, labels ≤64 chars) × loading states
    - Verify correct aria-labels, disabled states, label text

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Enhanced auth callback handler
  - [x] 5.1 Update auth callback route with error handling
    - Modify `app/auth/callback/route.ts`
    - Check for `error` query parameter from provider — redirect to `/login?error_description={message}`
    - Check for missing `code` parameter — redirect to `/login?error_description=Authorization+code+missing`
    - Wrap `exchangeCodeForSession` in try/catch — redirect to `/login?error_description=Authentication+failed` on failure
    - On success, redirect to `/dashboard`
    - Keep handler provider-agnostic (no conditional branches by provider)
    - _Requirements: 1.2, 1.3, 1.5, 1.6, 1.7, 2.2, 2.3, 2.5, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 8.2, 8.6, 9.2_

  - [x] 5.2 Write unit tests for auth callback handler
    - Test file: `__tests__/auth/callback-handler.test.ts`
    - Test happy path: valid code → session exchange → redirect to `/dashboard`
    - Test missing code → redirect to `/login` with error
    - Test provider error param → redirect to `/login` with provider message
    - Test exchange failure → redirect to `/login` with generic error
    - Mock Supabase server client
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 6. Login page OAuth integration
  - [x] 6.1 Update login page with OAuth buttons and error display
    - Modify `app/login/page.tsx`
    - Import and render `OAuthButtonGroup` above the existing email/password form
    - Add horizontal divider with centered "or" text between OAuth buttons and form
    - Read `error_description` from URL search params on mount via `useEffect`
    - Display error as Sonner toast (truncated to 200 chars, sanitized)
    - Clean URL with `window.history.replaceState` after reading error
    - Ensure OAuth buttons are pre-rendered (no CLS)
    - _Requirements: 1.4, 2.4, 5.1, 5.2, 5.5, 7.1, 7.2, 7.5, 7.6, 10.5_

  - [x] 6.2 Write property test for error message sanitization (Property 5)
    - **Property 5: Error messages are sanitized and bounded**
    - **Validates: Requirements 7.1, 7.5**
    - Test file: `__tests__/auth/error-sanitization.property.test.ts`
    - Generate random error strings (including stack traces, long strings, HTML, special chars, JSON objects)
    - Verify output ≤200 chars, no raw technical content (stack frames, numeric HTTP codes, JSON objects)

  - [x] 6.3 Write unit tests for login page OAuth UI
    - Test file: `components/__tests__/login-oauth.test.tsx`
    - Test OAuth buttons render with correct labels and icons
    - Test loading states disable all buttons
    - Test error toast displays on mount with error_description param
    - Test keyboard accessibility (Tab navigation, focus ring)
    - _Requirements: 5.1, 5.2, 5.4, 5.6, 7.1_

- [x] 7. Middleware and session validation
  - [x] 7.1 Verify middleware handles OAuth sessions correctly
    - Confirm existing middleware in `app/middleware.ts` works with OAuth sessions (no changes needed since it uses `getUser()` which is provider-agnostic)
    - Add `/settings` to protected routes if not already present
    - Ensure authenticated users hitting `/login` redirect to `/dashboard`
    - _Requirements: 4.2, 4.4, 8.1, 8.4_

  - [x] 7.2 Write property test for middleware route protection (Property 3)
    - **Property 3: Middleware route protection is consistent**
    - **Validates: Requirements 4.2, 4.4, 8.4**
    - Test file: `__tests__/auth/middleware-protection.property.test.ts`
    - Generate random protected route paths × session states (valid user or null)
    - Verify correct redirect/allow decision for each combination

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Configuration and type updates
  - [x] 9.1 Add OAuth provider image domains to Next.js config
    - Update `next.config.ts` to add Google and GitHub avatar image domains to `images.remotePatterns`
    - Add `lh3.googleusercontent.com` (Google profile images)
    - Add `avatars.githubusercontent.com` (GitHub profile images)
    - _Requirements: 3.5_

  - [x] 9.2 Update TypeScript database types
    - Regenerate `types/database.ts` to reflect new profile columns (full_name, avatar_url, auth_provider, metadata)
    - Or manually add the new fields to the `ProfileRow` type if Supabase CLI is not available locally
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 9.3_

- [x] 10. Integration wiring and final verification
  - [x] 10.1 Wire all components together and verify imports
    - Ensure `OAuthButtonGroup` correctly imports from `lib/auth/oauth-providers.ts`
    - Ensure `app/login/page.tsx` imports `OAuthButtonGroup` and Sonner `toast`
    - Ensure `app/auth/callback/route.ts` has all error handling paths
    - Verify no orphaned or unused code
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 9.1, 9.2_

  - [x] 10.2 Write integration tests for OAuth flow
    - Test file: `__tests__/auth/oauth-flow.integration.test.ts`
    - Test full flow: button click → signInWithOAuth called with correct params
    - Test callback → session exchange → redirect
    - Test error recovery: failed flow → toast → retry enabled
    - Mock Supabase client at module level
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 7.6_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The auth callback handler remains provider-agnostic per Requirement 9.2
- Supabase handles PKCE, token storage, and refresh internally — no custom token management needed
- The database trigger uses `ON CONFLICT DO NOTHING` for idempotent profile creation
- All OAuth tokens are managed server-side by Supabase — never exposed to the client

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "2.2"] },
    { "id": 1, "tasks": ["1.2", "3.1"] },
    { "id": 2, "tasks": ["1.3", "1.4", "3.2"] },
    { "id": 3, "tasks": ["3.3", "5.1"] },
    { "id": 4, "tasks": ["5.2", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3", "7.1"] },
    { "id": 6, "tasks": ["7.2", "9.1", "9.2"] },
    { "id": 7, "tasks": ["10.1"] },
    { "id": 8, "tasks": ["10.2"] }
  ]
}
```
