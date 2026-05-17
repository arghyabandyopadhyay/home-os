# Implementation Plan: Forgot Password & Disable GitHub OAuth

## Overview

This plan implements two related auth changes: (1) a complete forgot-password flow using Supabase's `resetPasswordForEmail` and `updateUser` APIs, and (2) removal of GitHub OAuth, leaving Google as the sole OAuth provider. Tasks are ordered so that shared utilities are built first, then the UI pages, then the callback routing, and finally cleanup of the GitHub provider.

## Tasks

- [x] 1. Create validation utilities and types
  - [x] 1.1 Create `lib/auth/validation.ts` with `validateEmail` and `validatePasswords` functions
    - Implement `validateEmail(email: string): ValidationResult` — checks empty, whitespace-only, length > 254, missing `@`/domain
    - Implement `validatePasswords(password: string, confirm: string): PasswordValidationResult` — checks min 6, max 128, mismatch
    - Export `ValidationResult` and `PasswordValidationResult` types
    - _Requirements: 1.5, 2.4, 2.5, 2.8, 3.4, 3.5, 3.6_

  - [x] 1.2 Write property tests for email validation (Property 1)
    - **Property 1: Invalid email rejection**
    - **Validates: Requirements 1.5, 2.4, 2.5, 2.8**
    - Create `__tests__/auth/email-validation.property.test.ts`
    - Use fast-check to generate invalid emails (empty, whitespace, missing @, no domain, > 254 chars)
    - Assert `validateEmail` returns `{ valid: false }` with appropriate error for all generated inputs

  - [x] 1.3 Write property tests for password validation (Properties 3 & 4)
    - **Property 3: Password mismatch detection**
    - **Property 4: Password length boundary validation**
    - **Validates: Requirements 3.4, 3.5, 3.6**
    - Create `__tests__/auth/password-validation.property.test.ts`
    - Use fast-check to generate two distinct strings of valid length → assert mismatch error
    - Use fast-check to generate strings < 6 chars → assert min length error
    - Use fast-check to generate strings > 128 chars → assert max length error

- [x] 2. Implement forgot password form on login page
  - [x] 2.1 Add forgot password inline form to `app/login/page.tsx`
    - Add `forgotPassword` state toggle
    - Add "Forgot password?" link below password input, above login button, with `aria-label="Reset your password"`
    - When toggled, show inline form: email input (`input-app`, maxLength 254), "Send reset link" button (`btn-primary-app`), "Back to login" link
    - Implement client-side email validation using `validateEmail` from `lib/auth/validation.ts`
    - Show inline validation error below email field on invalid input
    - On valid submit: disable button, show loading state, call `supabase.auth.resetPasswordForEmail(email, { redirectTo })`
    - On success or "user not found" error: show same confirmation message (anti-enumeration)
    - On network/server error: re-enable button, show error toast via Sonner
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 6.3_

  - [x] 2.2 Write property test for anti-enumeration (Property 2)
    - **Property 2: Anti-enumeration response consistency**
    - **Validates: Requirements 2.6**
    - Create `__tests__/auth/anti-enumeration.property.test.ts`
    - Use fast-check to generate valid email strings
    - Mock Supabase to return success for some, "user not found" for others
    - Assert the displayed confirmation message text is identical in all cases

- [x] 3. Implement reset password page
  - [x] 3.1 Create `app/reset-password/page.tsx` as a `"use client"` page
    - On mount: check session via `supabase.auth.getUser()` — if no session, redirect to `/login`; if normal session (non-recovery), redirect to `/dashboard`
    - Render centered layout: `bg-app` background, `panel-app` container with `max-w-md`, vertically/horizontally centered with flexbox, min-h-screen
    - `h1` heading "Set new password" (`text-app`), paragraph "Enter your new password below" (`text-app-muted`)
    - Two password inputs (`input-app`, `type="password"`): "New password" and "Confirm password"
    - Submit button (`btn-primary-app`) with loading/disabled state during submission
    - Client-side validation using `validatePasswords` from `lib/auth/validation.ts`
    - On valid submit: call `supabase.auth.updateUser({ password })`
    - On success: show success toast (Sonner, richColors, top-right), redirect to `/dashboard` after 2 seconds
    - On expired/invalid token error: show error message with link back to forgot password form
    - On network error: show error toast, re-enable button
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 6.1, 6.2, 6.4, 6.5, 6.6_

  - [x] 3.2 Write unit tests for reset password page
    - Test page renders "New password" and "Confirm password" fields
    - Test validation errors display for mismatched/short/long passwords
    - Test success redirect after password update
    - Test expired token error shows link to forgot password
    - _Requirements: 3.1, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update auth callback to handle recovery flow
  - [x] 5.1 Modify `app/auth/callback/route.ts` to route recovery callbacks
    - Read `type` query parameter from the callback URL
    - If `type=recovery` and code exchange succeeds → redirect to `/reset-password`
    - If `type=recovery` and code exchange fails → redirect to `/login?error_description=Reset+link+has+expired.+Please+request+a+new+one.`
    - Preserve existing behavior for non-recovery callbacks (redirect to `/dashboard`)
    - _Requirements: 4.3, 4.4_

  - [x] 5.2 Write unit tests for auth callback recovery handling
    - Test that `type=recovery` with valid code redirects to `/reset-password`
    - Test that `type=recovery` with failed code exchange redirects to `/login` with expired link error
    - Test that non-recovery callbacks still redirect to `/dashboard`
    - _Requirements: 4.3, 4.4_

- [x] 6. Remove GitHub OAuth provider
  - [x] 6.1 Remove GitHub from `lib/auth/oauth-providers.ts`
    - Remove the GitHub entry from `OAUTH_PROVIDERS` array
    - Remove the `GitHubIcon` import
    - Array should contain only the Google provider
    - _Requirements: 5.1_

  - [x] 6.2 Clean up GitHub OAuth icon component
    - Remove `GitHubIcon` export from `components/auth/oauth-icons.tsx` (or equivalent file)
    - If the file only contained GitHub and Google icons, keep only Google
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 6.3 Write unit tests for OAuth provider removal
    - Test that `OAUTH_PROVIDERS` contains only Google
    - Test that login page renders exactly one OAuth button with label "Continue with Google"
    - Test that no GitHub button is present in the DOM
    - _Requirements: 5.1, 5.2, 5.3_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The `/reset-password` route is intentionally NOT added to `protectedRoutes` in middleware — it must be accessible via the recovery token flow (Requirement 4.2)
- Existing GitHub-authenticated users retain all their data; they simply cannot sign in via GitHub anymore (Requirement 5.5)
- All UI components use the project's semantic CSS classes (`panel-app`, `input-app`, `btn-primary-app`, `text-app`, `text-app-muted`, `bg-app`) for automatic dark mode support

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "6.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "6.2"] },
    { "id": 2, "tasks": ["2.1", "3.1", "5.1", "6.3"] },
    { "id": 3, "tasks": ["2.2", "3.2", "5.2"] }
  ]
}
```
