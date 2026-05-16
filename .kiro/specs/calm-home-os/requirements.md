# Requirements Document

## Introduction

This spec addresses fixing and improving the Google Calendar integration in Home OS. The existing integration has OAuth connect/callback flows, a sync API, and a calendar UI that renders Google events — but the sync endpoint returns HTTP 400 errors, the connected email is never stored, and events only appear after manual sync button clicks. This feature fixes the OAuth callback to store the user's Google email, hardens the token refresh flow with clear re-authorization messaging, and adds automatic background sync so Google Calendar events appear reliably without manual intervention.

## Glossary

- **App**: The Calm Home OS Next.js web application.
- **User**: An authenticated individual using the App.
- **Calendar_View**: The client component at `/calendar` that displays monthly events.
- **Sync_Endpoint**: The `/api/google-calendar/sync` POST route that fetches events from Google and upserts them locally.
- **OAuth_Callback**: The `/api/google-calendar/callback` GET route that exchanges the authorization code for tokens and saves the connection.
- **Calendar_Connection**: A row in the `calendar_connections` table storing provider, tokens, expiry, and connected email for a User.
- **Connected_Email**: The `connected_email` field in `calendar_connections` identifying which Google account is linked.
- **Token_Refresh**: The process of using a stored refresh token to obtain a new access token from Google.
- **Re_Authorization**: The state where the stored refresh token is invalid or missing and the User must re-connect via OAuth.
- **Background_Sync**: A non-blocking client-side fetch to the Sync_Endpoint triggered automatically when the calendar page loads.
- **Google_Userinfo_Endpoint**: The `https://www.googleapis.com/oauth2/v2/userinfo` API that returns the authenticated Google user's email.

---

## Requirements

### Requirement 1: Store Connected Google Email on OAuth Callback

**User Story:** As a user, I want to see which Google account is connected so that I know my calendar is linked to the right account.

#### Acceptance Criteria

1. WHEN the OAuth_Callback receives a valid authorization code and exchanges it for tokens, THE App SHALL fetch the User's email from the Google_Userinfo_Endpoint using the new access token.
2. WHEN the Google email is fetched successfully, THE App SHALL store it in the `connected_email` field of the Calendar_Connection record.
3. IF the Google_Userinfo_Endpoint request fails, THEN THE App SHALL still save the Calendar_Connection with `connected_email` set to null and proceed with the sync without blocking the connection flow.
4. WHEN the Settings page displays a connected Google Calendar, THE App SHALL show the Connected_Email value (e.g., "Connected as user@gmail.com") instead of "Connected as null".

---

### Requirement 2: Robust Token Refresh and Re-Authorization Detection

**User Story:** As a user, I want clear feedback when my Google Calendar connection needs attention so that I can fix it without confusion.

#### Acceptance Criteria

1. WHEN the Sync_Endpoint attempts to use an expired access token, THE App SHALL attempt Token_Refresh using the stored refresh token before making the Google Calendar API call.
2. IF Token_Refresh succeeds, THEN THE App SHALL update the stored access token and expiry in the Calendar_Connection and proceed with the sync transparently.
3. IF Token_Refresh fails because the refresh token is missing or revoked, THEN THE App SHALL return an HTTP 401 response with a JSON body containing `{ "error": "reconnect_required" }`.
4. IF the Google Calendar API returns a 401 Unauthorized response after a successful Token_Refresh, THEN THE App SHALL return an HTTP 401 response with `{ "error": "reconnect_required" }`.
5. WHEN the Calendar_View receives a `reconnect_required` error from the Sync_Endpoint, THE App SHALL display a non-intrusive banner or toast indicating that Google Calendar needs to be reconnected, with a link to the connect flow.
6. THE Sync_Endpoint SHALL NOT return HTTP 400 for token-related failures; token failures SHALL return HTTP 401 with the `reconnect_required` error code.

---

### Requirement 3: Automatic Background Sync on Calendar Page Load

**User Story:** As a user, I want my Google Calendar events to appear automatically when I open the calendar so that I don't have to remember to click a sync button.

#### Acceptance Criteria

1. WHEN the Calendar_View mounts and Google Calendar is connected, THE App SHALL trigger a Background_Sync to the Sync_Endpoint without blocking the initial render.
2. WHILE the Background_Sync is in progress, THE App SHALL display the existing cached events from the database immediately and show a subtle sync indicator (e.g., a small spinning icon).
3. WHEN the Background_Sync completes successfully, THE App SHALL refresh the displayed events with the latest data from the database.
4. IF the Background_Sync fails with a non-401 error, THEN THE App SHALL display a brief toast notification and continue showing the cached events.
5. IF the Background_Sync fails with a `reconnect_required` error, THEN THE App SHALL display a reconnection prompt as specified in Requirement 2.5.
6. THE Background_Sync SHALL NOT trigger more than once per Calendar_View mount to avoid redundant network requests.

---

### Requirement 4: Sync Endpoint Error Handling Improvements

**User Story:** As a user, I want the sync to handle edge cases gracefully so that one bad event or transient error doesn't break my entire calendar.

#### Acceptance Criteria

1. IF the Calendar_Connection record does not exist for the User, THEN THE Sync_Endpoint SHALL return HTTP 404 with `{ "error": "not_connected" }`.
2. IF the Google Calendar API returns a non-401 error (e.g., 403 rate limit, 500 server error), THEN THE Sync_Endpoint SHALL return HTTP 502 with `{ "error": "google_api_error", "message": "<description>" }`.
3. WHEN the Sync_Endpoint successfully fetches and upserts events, THE Sync_Endpoint SHALL return HTTP 200 with `{ "synced": <count> }` indicating the number of events processed.
4. THE Sync_Endpoint SHALL handle Google Calendar events that have no start date gracefully by skipping them without failing the entire sync.

---

### Requirement 5: Calendar View Displays Latest Google Events Without Manual Action

**User Story:** As a user, I want to open my calendar and see all my Google Calendar events already there so that the experience feels seamless and calm.

#### Acceptance Criteria

1. WHEN the Calendar page loads via server-side rendering, THE App SHALL query the database for all Calendar_Events (both `home_os` and `google` source) for the current month and pass them to the Calendar_View.
2. WHEN the Calendar_View displays events, THE App SHALL visually distinguish Google Calendar events from locally created events using a sky-blue badge or label.
3. WHEN a User navigates to a different month, THE App SHALL fetch events for that month from the database (which includes previously synced Google events).
4. THE Calendar_View SHALL retain the manual "Sync Google" button as a secondary action for users who want to force a refresh, in addition to the automatic Background_Sync.
