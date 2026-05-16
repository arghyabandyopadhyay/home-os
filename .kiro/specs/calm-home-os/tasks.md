# Implementation Plan: Calm Home OS — Google Calendar Integration Hardening

## Overview

This plan implements five incremental improvements to the existing Google Calendar integration: storing the connected email on OAuth callback, hardening token refresh with typed errors, improving sync endpoint error handling, adding automatic background sync on calendar page load, and displaying a reconnection banner when auth fails. All changes modify existing files using TypeScript.

## Tasks

- [x] 1. Add custom error classes and `fetchGoogleUserEmail` to `lib/google-calendar.ts`
  - [x] 1.1 Add `ReconnectRequiredError` and `GoogleApiError` custom error classes
    - Export `ReconnectRequiredError` extending `Error` with `name = "ReconnectRequiredError"`
    - Export `GoogleApiError` extending `Error` with `statusCode: number` and `name = "GoogleApiError"`
    - _Requirements: 2.3, 2.4, 4.2_

  - [x] 1.2 Add `fetchGoogleUserEmail` function
    - Implement `fetchGoogleUserEmail(accessToken: string): Promise<string | null>` that calls `https://www.googleapis.com/oauth2/v2/userinfo`
    - Return the `email` field on success, return `null` on any failure (do not throw)
    - _Requirements: 1.1, 1.3_

  - [x] 1.3 Update `refreshConnectionToken` to throw `ReconnectRequiredError`
    - When `refresh_token` is missing, throw `ReconnectRequiredError` instead of generic `Error`
    - When Google token endpoint returns an error (revoked/invalid_grant), throw `ReconnectRequiredError`
    - _Requirements: 2.3, 2.6_

  - [x] 1.4 Update `syncGoogleCalendarEvents` to use typed errors and return `{ synced: number }`
    - Change return type from `Promise<CalendarEvent[]>` to `Promise<{ synced: number }>`
    - When connection is not found, throw `Error("not_connected")`
    - When Google Calendar API returns 401, throw `ReconnectRequiredError`
    - When Google Calendar API returns other non-OK status (403, 429, 5xx), throw `GoogleApiError(statusCode, message)`
    - Return `{ synced: rows.length }` on success (count of events with valid start dates)
    - _Requirements: 2.4, 4.1, 4.2, 4.3, 4.4_

  - [x] 1.5 Update `saveGoogleCalendarConnection` to accept optional `connectedEmail`
    - Add optional `connectedEmail?: string | null` parameter to the function signature
    - Include `connected_email: connectedEmail ?? null` in the upsert payload
    - _Requirements: 1.2_

- [x] 2. Update OAuth connect route to add email scope
  - [x] 2.1 Add `userinfo.email` scope to `getGoogleCalendarScope` in `lib/google-calendar.ts`
    - Update `GOOGLE_CALENDAR_SCOPE` constant to include `https://www.googleapis.com/auth/userinfo.email`
    - _Requirements: 1.1_

- [x] 3. Update OAuth callback route to fetch and save connected email
  - [x] 3.1 Modify `app/api/google-calendar/callback/route.ts` to call `fetchGoogleUserEmail` and pass result to `saveGoogleCalendarConnection`
    - After `exchangeGoogleCalendarCode`, call `fetchGoogleUserEmail(token.access_token)` 
    - Pass the email result to `saveGoogleCalendarConnection` as `connectedEmail`
    - If `fetchGoogleUserEmail` returns `null`, log a warning and proceed (do not block the flow)
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Update sync route handler with typed error handling
  - [x] 5.1 Rewrite error handling in `app/api/google-calendar/sync/route.ts`
    - Import `ReconnectRequiredError` and `GoogleApiError` from `@/lib/google-calendar`
    - On success: return `NextResponse.json({ synced: result.synced })` with status 200
    - On `ReconnectRequiredError`: return `{ error: "reconnect_required" }` with status 401
    - On `GoogleApiError`: return `{ error: "google_api_error", message: error.message }` with status 502
    - On `Error("not_connected")`: return `{ error: "not_connected" }` with status 404
    - On unknown errors: return `{ error: "sync_failed", message }` with status 500
    - Remove the old catch-all that returns HTTP 400
    - _Requirements: 2.3, 2.4, 2.6, 4.1, 4.2, 4.3_

- [x] 6. Update `CalendarView` component with background sync and reconnect banner
  - [x] 6.1 Add background sync on mount with `useRef` guard
    - Add `backgroundSyncing` state, `reconnectRequired` state, and `hasSyncedRef` ref
    - Add `useEffect` that triggers a POST to `/api/google-calendar/sync` when `googleCalendarConnected && !hasSyncedRef.current`
    - Set `hasSyncedRef.current = true` immediately to prevent duplicate syncs
    - On success: call `fetchMonthEvents(year, month)` to refresh the grid
    - On 401 with `reconnect_required`: set `reconnectRequired = true`
    - On other errors: show a toast via Sonner, continue showing cached events
    - Show a subtle spinning `RefreshCw` icon in the toolbar during background sync
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 6.2 Add reconnect banner UI
    - Render an inline amber-colored banner below the toolbar when `reconnectRequired` is true
    - Banner text: "Google Calendar needs to be reconnected." with a "Reconnect" link to `/api/google-calendar/connect`
    - Use semantic classes (`border-amber-500/30`, `bg-amber-500/10`, `text-amber-600 dark:text-amber-300`)
    - _Requirements: 2.5, 3.5_

  - [x] 6.3 Update manual `syncGoogleCalendar` function to handle typed error responses
    - On 401 response: set `reconnectRequired = true` and show appropriate message
    - On 404 response: show toast "Google Calendar is not connected"
    - On other errors: show generic toast error
    - On success: refresh events and show success toast
    - _Requirements: 2.5, 4.1_

- [x] 7. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 8. Write property-based tests for error classification and event filtering
  - [ ]* 8.1 Write property test for token failures producing 401
    - **Property 1: Token failures always produce 401 reconnect_required**
    - **Validates: Requirements 2.3, 2.4, 2.6**
    - Generate arbitrary token failure reasons (missing_refresh, revoked_refresh, invalid_grant, calendar_401_after_refresh)
    - For each, verify `syncGoogleCalendarEvents` throws `ReconnectRequiredError`
    - Verify the route handler maps it to HTTP 401 with `{ error: "reconnect_required" }`
    - Use `fast-check` with minimum 100 iterations
    - Create test file at `__tests__/google-calendar-sync.property.test.ts`

  - [ ]* 8.2 Write property test for non-401 Google API errors producing 502
    - **Property 2: Non-401 Google API errors produce 502**
    - **Validates: Requirements 4.2**
    - Generate random HTTP status codes in {400, 403, 404, 429, 500, 502, 503} (excluding 401)
    - Mock Google Calendar API to return that status
    - Verify `syncGoogleCalendarEvents` throws `GoogleApiError` and route handler returns 502
    - Use `fast-check` with minimum 100 iterations

  - [ ]* 8.3 Write property test for synced count equaling valid events
    - **Property 3: Synced count equals the number of events with valid start dates**
    - **Validates: Requirements 4.3, 4.4**
    - Generate arrays of Google Calendar event objects where `start` is randomly `{ dateTime: <iso> }`, `{ date: <date> }`, or `undefined`/`null`
    - Verify synced count equals the number of events with a non-null start date
    - Use `fast-check` with minimum 100 iterations

  - [ ]* 8.4 Write property test for background sync firing exactly once per mount
    - **Property 4: Background sync fires exactly once per mount**
    - **Validates: Requirements 3.6**
    - Generate random sequences of state updates (0–10 re-renders)
    - Verify fetch to `/api/google-calendar/sync` is called exactly once per mount
    - Use `fast-check` with minimum 100 iterations
    - Create test file at `__tests__/calendar-view-sync.property.test.tsx`

- [x] 9. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Vitest and fast-check are already installed and configured in the project
- All changes modify existing files — no new architecture or tables are introduced
- The `connected_email` column already exists in `calendar_connections` (migration `20260515010000_google_calendar_v3.sql`)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "2.1"] },
    { "id": 1, "tasks": ["1.3", "1.5"] },
    { "id": 2, "tasks": ["1.4", "3.1"] },
    { "id": 3, "tasks": ["5.1"] },
    { "id": 4, "tasks": ["6.1", "6.2", "6.3"] },
    { "id": 5, "tasks": ["8.1", "8.2", "8.3", "8.4"] }
  ]
}
```
