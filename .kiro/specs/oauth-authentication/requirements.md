# Requirements Document

## Introduction

Home OS currently supports email/password authentication. This feature adds OAuth-based login via Google and GitHub to reduce authentication friction while maintaining strong security and clean architecture. The OAuth experience should feel instant, calm, and invisible — aligned with Home OS's design philosophy. The architecture must remain extensible for future providers (Apple, Microsoft, Discord).

## Glossary

- **Home_OS**: The calm personal organization platform that is the subject of this specification
- **OAuth_Provider**: An external identity provider (Google, GitHub) that authenticates users on behalf of Home OS
- **Auth_Callback_Handler**: The server-side route handler at `app/auth/callback/` that exchanges authorization codes for sessions
- **Login_Page**: The client-side page at `app/login/` where users initiate authentication
- **Middleware**: The Next.js middleware at `app/middleware.ts` that validates sessions and protects routes
- **Supabase_Auth**: The authentication service provided by Supabase that manages OAuth flows, sessions, and tokens
- **Profile_Record**: A row in the `profiles` table containing user identity data (id, email, created_at, avatar_url, full_name, auth_provider)
- **OAuth_Button**: A UI component on the Login_Page that initiates an OAuth flow with a specific provider
- **Session**: The authenticated state maintained by Supabase_Auth across requests, stored in HTTP-only cookies
- **RLS_Policy**: A Row Level Security policy in PostgreSQL that restricts data access to the owning user

## Requirements

### Requirement 1: Google OAuth Sign-In

**User Story:** As a user, I want to sign in with my Google account, so that I can access Home OS with one click instead of managing a separate password.

#### Acceptance Criteria

1. WHEN the user clicks the Google OAuth_Button on the Login_Page, THE Supabase_Auth SHALL initiate a Google OAuth authorization redirect within 2 seconds
2. WHEN Google returns an authorization code to the Auth_Callback_Handler, THE Auth_Callback_Handler SHALL exchange the code for a valid Session and set the session cookies before redirecting
3. WHEN the Session is established after Google OAuth, THE Auth_Callback_Handler SHALL redirect the user to the dashboard
4. IF the Google OAuth authorization is denied by the user, THEN THE Login_Page SHALL display a visible error message indicating that sign-in was cancelled or denied, and SHALL remain on the login screen with all login controls still accessible
5. IF the Google OAuth flow returns an invalid or expired authorization code, THEN THE Auth_Callback_Handler SHALL redirect to the Login_Page with an error query parameter indicating the failure reason
6. IF the Auth_Callback_Handler receives a callback request with no authorization code parameter present, THEN THE Auth_Callback_Handler SHALL redirect to the Login_Page with an error query parameter indicating a missing code
7. IF the code-for-session exchange fails due to a network or service error, THEN THE Auth_Callback_Handler SHALL redirect to the Login_Page with an error query parameter indicating a session exchange failure

### Requirement 2: GitHub OAuth Sign-In

**User Story:** As a developer user, I want to sign in with my GitHub account, so that I can use my preferred developer identity to access Home OS.

#### Acceptance Criteria

1. WHEN the user clicks the GitHub OAuth_Button on the Login_Page, THE Supabase_Auth SHALL initiate a GitHub OAuth authorization redirect to GitHub's authorization endpoint
2. WHEN GitHub returns an authorization code to the Auth_Callback_Handler, THE Auth_Callback_Handler SHALL exchange the code for a valid Session by calling Supabase's `exchangeCodeForSession` and storing the resulting session cookies
3. WHEN the Session is established after GitHub OAuth, THE Auth_Callback_Handler SHALL redirect the user to the `/dashboard` route
4. IF the GitHub OAuth authorization is denied by the user, THEN THE Login_Page SHALL display a visible error message indicating that authorization was denied and SHALL remain on the login screen with all login options still accessible
5. IF the Auth_Callback_Handler receives no authorization code, an invalid code, or the code exchange with Supabase fails, THEN THE Auth_Callback_Handler SHALL redirect to the Login_Page with an error query parameter indicating the failure reason
6. WHEN the GitHub OAuth redirect is initiated, THE Supabase_Auth SHALL complete the redirect to GitHub's authorization page within 5 seconds or THE Login_Page SHALL display an error message indicating the connection could not be established

### Requirement 3: Automatic User Profile Creation on First OAuth Login

**User Story:** As a new user signing in via OAuth, I want my profile to be automatically created, so that I can start using Home OS immediately without additional onboarding steps.

#### Acceptance Criteria

1. WHEN a user authenticates via an OAuth_Provider for the first time (no existing Profile_Record with a matching auth user id), THE Supabase_Auth SHALL create a new auth user record
2. WHEN a new auth user is created via OAuth, THE Home_OS SHALL automatically create a Profile_Record with the user id, email, and created_at timestamp within 5 seconds of successful authentication
3. WHEN a new Profile_Record is created via OAuth, THE Home_OS SHALL store the auth_provider field indicating which OAuth_Provider was used (e.g., "google", "github")
4. WHEN the OAuth_Provider supplies a non-empty display name, THE Home_OS SHALL store the display name in the full_name field of the Profile_Record, truncated to a maximum of 255 characters
5. WHEN the OAuth_Provider supplies a profile image URL, THE Home_OS SHALL store the URL in the avatar_url field of the Profile_Record, limited to a maximum of 2048 characters
6. WHEN an existing user authenticates via an OAuth_Provider (a Profile_Record with the same auth user id already exists), THE Home_OS SHALL use the existing Profile_Record without creating a duplicate
7. IF the OAuth_Provider does not supply a display name or supplies an empty string, THEN THE Home_OS SHALL set the full_name field of the Profile_Record to null
8. IF the OAuth_Provider does not supply a profile image URL, THEN THE Home_OS SHALL set the avatar_url field of the Profile_Record to null
9. IF Profile_Record creation fails due to a database error, THEN THE Home_OS SHALL retry the creation once, and if the retry also fails, SHALL prevent the user session from being established and display an error message indicating that account setup failed

### Requirement 4: OAuth Session Persistence and Validation

**User Story:** As a user, I want my OAuth session to persist across page refreshes and browser restarts, so that I do not need to re-authenticate frequently.

#### Acceptance Criteria

1. WHEN a user authenticates via an OAuth_Provider, THE Supabase_Auth SHALL establish a persistent Session stored in HTTP-only cookies with a maximum lifetime of 7 days
2. WHILE a Session exists with a valid, unexpired access token or a valid refresh token, THE Middleware SHALL allow access to protected routes without re-authentication
3. WHEN a Session access token is within 60 seconds of expiration, THE Supabase_Auth SHALL automatically refresh the token using the refresh token without user intervention
4. IF a Session access token is expired and the refresh token is also expired or invalid, THEN THE Middleware SHALL redirect the user to the Login_Page
5. THE Session SHALL persist across page refreshes, browser restarts, and navigation transitions within the same browser for up to 7 days from the last successful authentication or token refresh
6. IF the auth callback receives an invalid or missing authorization code, THEN THE System SHALL redirect the user to the Login_Page

### Requirement 5: OAuth Login Page UI

**User Story:** As a user, I want the login page to present clear, premium-feeling OAuth buttons, so that I can quickly identify and use my preferred sign-in method.

#### Acceptance Criteria

1. THE Login_Page SHALL display a Google OAuth_Button with the label "Continue with Google" and the Google provider icon positioned to the left of the label text
2. THE Login_Page SHALL display a GitHub OAuth_Button with the label "Continue with GitHub" and the GitHub provider icon positioned to the left of the label text
3. THE OAuth_Button SHALL use full-width layout, a minimum height of 48px, rounded-xl border radius, monochrome color scheme using the Home OS design system semantic tokens (bg-app-elevated for background, text-app for label), and a hover effect that transitions background opacity over 150ms
4. WHILE an OAuth flow is in progress, THE OAuth_Button that was clicked SHALL display an animated spinner in place of the provider icon and the label text "Connecting...", and all OAuth_Buttons SHALL be disabled with reduced opacity (opacity 50%)
5. THE Login_Page SHALL display the OAuth_Buttons above the existing email/password form, separated by a horizontal divider containing the centered text "or"
6. THE OAuth_Buttons SHALL be focusable via keyboard Tab navigation, display a visible focus ring on focus, and include aria-labels in the format "Sign in with {provider name}" for screen readers
7. IF an OAuth provider fails to initiate the authentication flow, THEN THE Login_Page SHALL display an error message indicating the sign-in attempt failed and re-enable all OAuth_Buttons

### Requirement 6: OAuth Callback Route Handling

**User Story:** As a user returning from an OAuth provider, I want to be seamlessly redirected into Home OS, so that the authentication feels instant and invisible.

#### Acceptance Criteria

1. THE Auth_Callback_Handler SHALL accept GET requests at the `/auth/callback` route and extract the authorization code from the `code` query parameter
2. WHEN a valid authorization code is received, THE Auth_Callback_Handler SHALL exchange it for a Session and persist the session via cookies within 5 seconds
3. WHEN the code exchange succeeds, THE Auth_Callback_Handler SHALL redirect the user to `/dashboard`
4. IF the code exchange fails, THEN THE Auth_Callback_Handler SHALL redirect to `/login` with an `error_description` query parameter indicating that authentication failed
5. IF no authorization code is present in the callback request, THEN THE Auth_Callback_Handler SHALL redirect to `/login` with an `error_description` query parameter indicating that the authorization code was missing
6. IF the OAuth provider returns an `error` query parameter in the callback request, THEN THE Auth_Callback_Handler SHALL redirect to `/login` with an `error_description` query parameter indicating the provider-reported failure reason

### Requirement 7: OAuth Error Handling and Recovery

**User Story:** As a user, I want clear feedback when OAuth authentication fails, so that I can understand what went wrong and try again.

#### Acceptance Criteria

1. WHEN the Login_Page receives a non-empty error_description query parameter, THE Login_Page SHALL display the error_description text (truncated to a maximum of 200 characters) as a toast notification that remains visible for at least 5 seconds and is manually dismissible
2. WHEN the Login_Page receives an error query parameter but the error_description parameter is empty or absent, THE Login_Page SHALL display a toast notification with a generic message indicating that authentication failed
3. WHEN an OAuth flow fails due to a network error (request timeout exceeding 10 seconds or no response received), THE Login_Page SHALL display a toast notification indicating a connection problem and present a visible retry button that re-initiates the OAuth flow for the same provider
4. WHEN an OAuth_Provider returns an HTTP 5xx response or the authorization endpoint is unreachable, THE Login_Page SHALL display a toast notification indicating the provider is currently unavailable
5. THE Login_Page SHALL NOT display raw provider error codes, technical stack traces, or internal error details to the user
6. WHEN an OAuth error is displayed, THE Login_Page SHALL keep the OAuth provider sign-in button enabled so the user can attempt authentication again without refreshing the page

### Requirement 8: OAuth Security and Data Isolation

**User Story:** As a user, I want my data to remain secure and isolated when using OAuth, so that other users cannot access my information.

#### Acceptance Criteria

1. THE RLS_Policy on all user-owned tables SHALL enforce that `auth.uid() = user_id` regardless of authentication method
2. THE Auth_Callback_Handler for Supabase login SHALL exchange the authorization code for a session using Supabase's built-in PKCE flow, and each Google OAuth Callback_Handler SHALL validate the state parameter against a server-set httpOnly cookie before processing the authorization code
3. THE Home_OS SHALL NOT expose OAuth tokens, refresh tokens, or provider secrets in browser-accessible responses, HTML source, or cookies readable by client-side JavaScript, and SHALL store all OAuth tokens exclusively in server-side database tables protected by RLS
4. WHILE a user session is active, THE Middleware SHALL validate the session by calling `getUser()` on every request to protected routes and SHALL redirect to the login page if validation fails
5. THE Home_OS SHALL configure OAuth redirect URLs to only allow the application's configured deployment domain as registered in the OAuth provider console
6. IF the OAuth provider returns an error or the user denies consent, THEN THE Auth_Callback_Handler SHALL redirect the user to the originating application page with a query parameter indicating the failure reason without exposing provider error details to the client

### Requirement 9: Extensible OAuth Architecture

**User Story:** As a developer maintaining Home OS, I want the OAuth implementation to be modular and provider-agnostic, so that adding new providers requires minimal code changes.

#### Acceptance Criteria

1. THE Home_OS SHALL centralize OAuth provider configuration in a single configuration source such that adding a new Supabase-supported OAuth_Provider requires changes to no more than 2 files: the provider configuration source and the Login_Page where a new OAuth_Button instance is added
2. THE Auth_Callback_Handler SHALL exchange authorization codes for sessions using Supabase's provider-agnostic session exchange, containing no conditional branches based on provider identity
3. THE Profile_Record schema SHALL include a flexible metadata column (JSONB or equivalent) that stores provider-supplied user attributes as key-value pairs, requiring no schema migration when a new OAuth_Provider is added
4. THE OAuth_Button component SHALL accept provider name (string, maximum 32 characters), icon (React node), and label (string, maximum 64 characters) as parameters and render a functional sign-in button for any provider identified by those parameters
5. WHERE a new OAuth_Provider is added, THE Home_OS SHALL require only the addition of provider credentials in environment configuration, enablement of the provider in the Supabase project dashboard, and a new OAuth_Button instance on the Login_Page — with no modifications to the Auth_Callback_Handler or Profile_Record schema
6. IF the OAuth_Button component receives a provider name that is not enabled in the Supabase project configuration, THEN THE Home_OS SHALL display an error indication to the user and SHALL NOT initiate the OAuth flow

### Requirement 10: OAuth Performance and UX

**User Story:** As a user, I want the OAuth flow to feel fast and stable, so that authentication never feels uncertain or broken.

#### Acceptance Criteria

1. WHEN the user clicks an OAuth_Button, THE Login_Page SHALL initiate the provider redirect within 500 milliseconds and display a visible loading indicator on the clicked button within 100 milliseconds of the click
2. WHEN the Auth_Callback_Handler processes a successful callback, THE redirect to the dashboard SHALL complete such that the dashboard route begins rendering within 2 seconds of the callback URL being loaded
3. WHILE the OAuth callback is being processed, THE Home_OS SHALL display a loading indicator with static layout (no content reflow) and SHALL NOT show an empty document body or unstyled content flash at any point during processing
4. WHEN the user arrives at the dashboard after OAuth, THE Session SHALL be available for server-side data fetching on the initial page render, such that the dashboard displays user-specific content without requiring a client-side re-fetch or showing a secondary loading skeleton
5. THE Login_Page SHALL pre-render OAuth_Buttons during server-side rendering so that the Cumulative Layout Shift (CLS) caused by OAuth_Button rendering is 0
6. IF the Auth_Callback_Handler receives an invalid or expired authorization code, THEN THE Home_OS SHALL redirect the user to the Login_Page and display an error message indicating that authentication failed within 3 seconds of the callback URL being loaded
7. IF the OAuth provider does not respond within 10 seconds of the redirect being initiated, THEN THE Login_Page SHALL display an error message indicating a timeout and re-enable the OAuth_Button for retry
