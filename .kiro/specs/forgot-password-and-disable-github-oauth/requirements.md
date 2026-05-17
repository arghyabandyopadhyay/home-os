# Requirements Document

## Introduction

This feature adds a "forgot password" flow to Home OS, allowing users who sign in with email/password to reset their password via a Supabase-sent email link. Additionally, this feature removes GitHub OAuth as a sign-in provider, leaving Google OAuth as the sole OAuth option. These changes simplify the login experience and provide a necessary recovery path for password-based accounts.

## Glossary

- **Home_OS**: The calm personal organization platform that is the subject of this specification
- **Login_Page**: The client-side page at `app/login/` where users initiate authentication
- **Password_Reset_Page**: A new client-side page where users enter a new password after clicking the reset link in their email
- **Supabase_Auth**: The authentication service provided by Supabase that manages password resets, OAuth flows, sessions, and tokens
- **Reset_Email**: The email sent by Supabase_Auth containing a one-time password reset link
- **Auth_Callback_Handler**: The server-side route handler at `app/auth/callback/` that exchanges authorization codes for sessions
- **OAuth_Provider_Config**: The centralized provider configuration in `lib/auth/oauth-providers.ts` that defines available OAuth sign-in options
- **OAuth_Button_Group**: The component that renders OAuth sign-in buttons based on the OAuth_Provider_Config

## Requirements

### Requirement 1: Forgot Password Link on Login Page

**User Story:** As a user who has forgotten my password, I want to see a clearly visible "Forgot password?" link on the login page, so that I can initiate the password recovery process.

#### Acceptance Criteria

1. THE Login_Page SHALL display a "Forgot password?" link positioned below the password input field and above the login button
2. WHEN the user clicks the "Forgot password?" link, THE Login_Page SHALL display an inline form containing an email input field with a maximum length of 254 characters and a "Send reset link" button
3. THE "Forgot password?" link SHALL be focusable via keyboard Tab navigation and include an aria-label of "Reset your password"
4. WHILE the forgot password form is displayed, THE Login_Page SHALL continue to show a "Back to login" link that returns the user to the standard login form
5. IF the user clicks "Send reset link" with an empty email field or an email that does not match a valid email format, THEN THE Login_Page SHALL display an inline validation error message below the email field and SHALL NOT submit the request
6. WHEN the user clicks "Send reset link" with a valid email address, THE Login_Page SHALL disable the "Send reset link" button during submission and display a confirmation message indicating that a reset link has been sent within 3 seconds of submission
7. IF the password reset request fails due to a network or server error, THEN THE Login_Page SHALL re-enable the "Send reset link" button and display an error message indicating the request could not be completed

### Requirement 2: Password Reset Email Request

**User Story:** As a user who has forgotten my password, I want to receive a password reset email, so that I can securely set a new password.

#### Acceptance Criteria

1. WHEN the user submits a valid email address in the forgot password form, THE Home_OS SHALL call Supabase_Auth's `resetPasswordForEmail` method with the provided email and a redirect URL pointing to the Password_Reset_Page
2. WHEN the reset email request is submitted successfully, THE Login_Page SHALL display a confirmation message indicating that a reset link has been sent to the provided email address, and the confirmation message SHALL remain visible until the user navigates away or initiates another action
3. WHILE the reset email request is in progress, THE "Send reset link" button SHALL display a loading spinner and be disabled to prevent duplicate submissions
4. IF the user submits an empty email field, THEN THE Login_Page SHALL display a validation message indicating that an email address is required, and the email input field SHALL retain focus
5. IF the user submits a malformed email address (missing @ symbol or domain), THEN THE Login_Page SHALL display a validation message indicating that a valid email address is required
6. WHEN the reset email request completes (success or failure from Supabase_Auth), THE Login_Page SHALL display the same confirmation message regardless of whether the email exists in the system, to prevent email enumeration
7. IF the reset email request fails due to a network error or Supabase_Auth service unavailability, THEN THE Login_Page SHALL display an error message indicating that the request could not be completed and allow the user to retry by re-enabling the "Send reset link" button
8. THE Login_Page SHALL restrict the email input field to a maximum length of 254 characters

### Requirement 3: Password Reset Page

**User Story:** As a user who clicked the reset link in my email, I want to set a new password, so that I can regain access to my account.

#### Acceptance Criteria

1. THE Password_Reset_Page SHALL be accessible at the route `/reset-password` and SHALL display two password input fields: "New password" and "Confirm password"
2. WHEN the user submits matching passwords that are at least 6 characters and at most 128 characters long, THE Home_OS SHALL call Supabase_Auth's `updateUser` method to set the new password
3. WHEN the password update succeeds, THE Password_Reset_Page SHALL display a success message and redirect the user to the dashboard within 2 seconds
4. IF the two password fields do not match, THEN THE Password_Reset_Page SHALL display a validation message indicating that the passwords do not match
5. IF the new password is fewer than 6 characters, THEN THE Password_Reset_Page SHALL display a validation message indicating that the password must be at least 6 characters
6. IF the new password exceeds 128 characters, THEN THE Password_Reset_Page SHALL display a validation message indicating that the password must not exceed 128 characters
7. IF the password update fails due to an expired or invalid reset token, THEN THE Password_Reset_Page SHALL display an error message indicating that the reset link has expired and provide a link back to the forgot password form
8. IF the password update fails due to a network or service error, THEN THE Password_Reset_Page SHALL display an error message indicating that the update failed and allow the user to retry
9. WHILE the password update request is in progress, THE submit button SHALL display a loading spinner and be disabled to prevent duplicate submissions

### Requirement 4: Password Reset Route Protection

**User Story:** As a user, I want the password reset page to only be accessible with a valid reset token, so that unauthorized users cannot set passwords on my account.

#### Acceptance Criteria

1. WHEN a user navigates to the Password_Reset_Page without any active Supabase session, THE Password_Reset_Page SHALL redirect the user to the Login_Page
2. THE Password_Reset_Page SHALL NOT be listed in the protected routes that require a full authenticated session, allowing Supabase's token-based access from the reset email link
3. WHEN the Auth_Callback_Handler receives a callback with a `type=recovery` parameter from Supabase, THE Auth_Callback_Handler SHALL exchange the code for a session and redirect to the Password_Reset_Page instead of the dashboard
4. IF the Auth_Callback_Handler receives a `type=recovery` callback and the code exchange fails, THEN THE Auth_Callback_Handler SHALL redirect the user to the Login_Page with an error message indicating the reset link is invalid or expired
5. WHEN a user with a normal authenticated session (non-recovery) navigates directly to the Password_Reset_Page, THE Password_Reset_Page SHALL redirect the user to the Dashboard_Page

### Requirement 5: Remove GitHub OAuth Provider

**User Story:** As the product owner, I want to remove GitHub OAuth as a sign-in option, so that the login experience is simplified to Google OAuth and email/password only.

#### Acceptance Criteria

1. THE OAuth_Provider_Config SHALL contain only the Google provider entry, with the GitHub provider entry removed from the OAUTH_PROVIDERS array
2. THE Login_Page SHALL display only the Google OAuth button, with no GitHub OAuth button visible in the rendered DOM
3. THE OAuth_Button_Group SHALL render exactly one OAuth button with the label "Continue with Google" and no other OAuth provider buttons
4. THE Auth_Callback_Handler SHALL successfully exchange an authorization code for a session and redirect to /dashboard when processing a Google OAuth callback
5. IF an existing user previously signed in exclusively via GitHub OAuth, THEN THE Home_OS SHALL retain the user's Profile_Record, notes, tasks, books, and contacts in the database without deletion or modification
6. IF a user attempts to initiate a GitHub OAuth sign-in by any means, THEN THE Login_Page SHALL NOT offer a GitHub sign-in option, and the Auth_Callback_Handler SHALL redirect to /login with an error indication when receiving an unrecognized provider callback

### Requirement 6: Password Reset UI Design

**User Story:** As a user, I want the password reset flow to feel calm and consistent with the rest of Home OS, so that the experience does not feel jarring or stressful.

#### Acceptance Criteria

1. THE Password_Reset_Page SHALL use the `panel-app` container class with a maximum width of `max-w-md`, `input-app` for input fields, and `btn-primary-app` for the submit button, matching the Login_Page class usage
2. THE Password_Reset_Page SHALL display an `h1` heading with text "Set new password" and a paragraph subheading with text "Enter your new password below", using `text-app` for the heading and `text-app-muted` for the subheading
3. THE forgot password inline form on the Login_Page SHALL contain an email input field using the `input-app` class and a submit button using the `btn-primary-app` class, matching the existing login form input styling
4. WHEN a success or error message is displayed on the Password_Reset_Page, THE Home_OS SHALL use Sonner toast notifications with `richColors` enabled and positioned at `top-right`, matching the Login_Page toast configuration
5. THE Password_Reset_Page SHALL use the `bg-app` background class and center the form panel both vertically and horizontally using flexbox, with a minimum viewport height of 100vh
6. THE Password_Reset_Page SHALL contain a "New password" input field and a "Confirm password" input field, both using `input-app` class with `type="password"`, followed by a single submit button using `btn-primary-app`
