# Implementation Plan: Persist Settings Bugfix

## Overview

This plan fixes two related bugs — onboarding dialog reappearing and theme not persisting — by stabilizing the `useUserPreferences` hook, extracting a testable cache module, and guarding the `ThemeProvider` against unnecessary theme overrides during loading. The implementation uses TypeScript with Vitest and fast-check for property-based testing.

## Tasks

- [x] 1. Extract preferences cache module
  - [x] 1.1 Create `lib/preferences-cache.ts` with `readLocalCache`, `writeLocalCache`, and `LOCAL_PREFS_KEY` exports
    - Implement `readLocalCache()` that reads from localStorage, parses JSON, handles malformed data by removing the key and returning null, and returns null in SSR
    - Implement `writeLocalCache(prefs)` that serializes and writes to localStorage, no-ops in SSR
    - Export the `LOCAL_PREFS_KEY` constant (`"home-os:preferences-cache"`)
    - _Requirements: 3.1, 4.1, 4.2, 4.3_

  - [ ]* 1.2 Write property test for synchronous cache initialization (Property 5)
    - **Property 5: Synchronous cache initialization**
    - For any valid UserPreferences object stored in localStorage, `readLocalCache()` returns the stored preferences, not defaults
    - **Validates: Requirements 3.1**

  - [ ]* 1.3 Write property test for remote fetch populates empty cache (Property 7)
    - **Property 7: Remote fetch populates empty cache**
    - For any valid UserPreferences, calling `writeLocalCache(prefs)` then `readLocalCache()` returns the same preferences
    - **Validates: Requirements 4.2**

- [x] 2. Stabilize `useUserPreferences` hook
  - [x] 2.1 Refactor `hooks/use-user-preferences.ts` to use module-level Supabase client
    - Move `createClient()` call to module scope for a stable reference
    - Remove inline `createClient()` calls from within the hook body
    - _Requirements: 3.2, 3.3_

  - [x] 2.2 Initialize hook state synchronously from local cache
    - Replace `defaultUserPreferences` initial state with `readLocalCache() ?? defaultUserPreferences` using a `useState` initializer function
    - Import `readLocalCache` from `@/lib/preferences-cache`
    - _Requirements: 3.1, 1.2, 2.4_

  - [x] 2.3 Add `useRef` fetch guard to prevent duplicate remote fetches
    - Add `hasFetched` ref initialized to `false`
    - Guard the `load` function to return early if `hasFetched.current` is `true`
    - Set `hasFetched.current = true` at the start of the fetch
    - Remove unstable dependencies from the `useCallback` dependency array
    - _Requirements: 3.2, 3.3_

  - [x] 2.4 Update the `load` function error handling to keep cached state
    - On fetch failure, log a warning and keep current state (cache-initialized or defaults)
    - Ensure `loading` is set to `false` in the `finally` block
    - Handle unauthenticated users by skipping remote fetch
    - _Requirements: 1.4, 1.5, 3.5, 4.4_

  - [x] 2.5 Update the `update` function to use `writeLocalCache` from the cache module
    - Import `writeLocalCache` from `@/lib/preferences-cache`
    - Ensure optimistic update writes to both state and local cache before remote persist
    - On remote write failure, retain optimistic state and log warning
    - _Requirements: 1.1, 2.1, 3.4, 3.5_

  - [ ]* 2.6 Write property test for update dual-write consistency (Property 1)
    - **Property 1: Update dual-write consistency**
    - For any valid preference patch, calling `update` writes the merged result to both localStorage and the mock remote store
    - **Validates: Requirements 1.1, 2.1**

  - [ ]* 2.7 Write property test for optimistic update precedes remote write (Property 6)
    - **Property 6: Optimistic update precedes remote write**
    - For any valid preference patch, after calling `update`, state and localStorage reflect the patch before the remote write promise resolves
    - **Validates: Requirements 3.4**

  - [ ]* 2.8 Write property test for remote store is authoritative on conflict (Property 4)
    - **Property 4: Remote store is authoritative on conflict**
    - For any pair of differing cache and remote preferences, after loading completes, state and cache equal the remote value
    - **Validates: Requirements 2.5**

- [x] 3. Checkpoint - Verify hook stabilization
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Guard ThemeProvider against unnecessary overrides
  - [x] 4.1 Modify `components/theme/theme-provider.tsx` to skip theme application during loading
    - Add early return in the `useEffect` when `loading` is `true` — trust `theme-init.js`
    - Only apply theme when `loading` is `false` and `prefs.theme` is defined
    - _Requirements: 2.4_

  - [x] 4.2 Add conditional theme application — only apply when different from DOM
    - Read current DOM state (`document.documentElement.classList.contains("dark")`)
    - Resolve the preference theme value (handle "auto" via media query)
    - Only call `applyTheme` if the resolved theme differs from the current DOM class
    - _Requirements: 2.3_

  - [ ]* 4.3 Write property test for conditional theme application (Property 3)
    - **Property 3: Conditional theme application**
    - For any combination of current DOM theme and fetched preference theme, `applyTheme` is called only when the resolved fetched theme differs from the current DOM theme
    - **Validates: Requirements 2.3, 2.4**

  - [ ]* 4.4 Write property test for theme-init script correctness (Property 2)
    - **Property 2: Theme-init script applies correct theme from cache**
    - For any valid theme value in localStorage, executing theme-init logic results in `.dark` class on `<html>` iff the resolved theme is dark
    - **Validates: Requirements 2.2**

- [ ] 5. Unit and edge-case tests
  - [ ]* 5.1 Write unit tests for `useUserPreferences` hook behavior
    - Test: hook fetches from remote exactly once per mount (Req 3.2)
    - Test: hook does not re-fetch on parent re-renders (Req 3.3)
    - Test: unauthenticated user uses cache without remote fetch (Req 4.4)
    - Test: malformed JSON in cache triggers graceful fallback to defaults (Req 4.3)
    - _Requirements: 3.2, 3.3, 4.3, 4.4_

  - [ ]* 5.2 Write unit tests for onboarding dialog persistence
    - Test: dialog stays closed when cache has `onboardingComplete: true` (Req 1.2)
    - Test: dialog stays closed during loading when no cache exists (Req 1.3)
    - Test: remote fetch fails with cache present → dialog stays closed (Req 1.4)
    - Test: remote fetch fails with no cache → dialog stays closed (Req 1.5)
    - _Requirements: 1.2, 1.3, 1.4, 1.5_

  - [ ]* 5.3 Write unit tests for ThemeProvider behavior
    - Test: theme not overridden during loading state (Req 2.4)
    - Test: theme applied only when different from current DOM (Req 2.3)
    - Test: remote write failure retains optimistic state (Req 3.5)
    - _Requirements: 2.3, 2.4, 3.5_

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document using fast-check
- Unit tests validate specific examples and edge cases
- Vitest is already configured (`npm run test`), fast-check is already installed
- The `theme-init.js` script and `lib/user-settings.ts` require no changes per the design

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3"] },
    { "id": 3, "tasks": ["2.4", "2.5"] },
    { "id": 4, "tasks": ["2.6", "2.7", "2.8", "4.1"] },
    { "id": 5, "tasks": ["4.2"] },
    { "id": 6, "tasks": ["4.3", "4.4", "5.1", "5.2", "5.3"] }
  ]
}
```
