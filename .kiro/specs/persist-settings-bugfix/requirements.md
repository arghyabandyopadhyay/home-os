# Requirements Document

## Introduction

This specification addresses two related bugs in the Home OS user preferences system: the onboarding dialog reappearing after completion, and the theme selection not persisting across page reloads or navigation. Both bugs stem from issues in how the `useUserPreferences` hook manages state initialization, caching, and the lifecycle of fetching remote preferences from Supabase.

## Glossary

- **Preferences_Provider**: The `UserPreferencesProvider` React context that exposes user preferences to the component tree via the `usePreferences()` hook.
- **Preferences_Hook**: The `useUserPreferences` hook that fetches, caches, and updates user preferences.
- **Local_Cache**: The `localStorage` entry at key `home-os:preferences-cache` used to persist preferences client-side between page loads.
- **Remote_Store**: The `profiles.preferences` JSONB column in Supabase where preferences are persisted server-side.
- **Theme_Init_Script**: The blocking `<script>` (`public/theme-init.js`) that reads the Local_Cache before React hydrates to prevent a flash of wrong theme.
- **Onboarding_Dialog**: The multi-step welcome dialog shown to first-time users, rendered on the dashboard page.
- **Theme_Provider**: The component that applies the resolved theme (light/dark class on `<html>`) based on the current preference value.

## Requirements

### Requirement 1: Onboarding completion persists across sessions

**User Story:** As a user who has completed onboarding, I want the onboarding dialog to never reappear, so that I am not interrupted by a setup flow I have already finished.

#### Acceptance Criteria

1. WHEN a user completes the onboarding flow, THE Preferences_Hook SHALL persist `onboardingComplete: true` to both the Local_Cache and the Remote_Store before closing the dialog.
2. WHEN the dashboard page loads and the Local_Cache contains `onboardingComplete: true`, THE Onboarding_Dialog SHALL remain closed without waiting for the remote fetch to complete.
3. WHEN the dashboard page loads and no Local_Cache exists, THE Onboarding_Dialog SHALL remain closed until the Preferences_Hook finishes loading from the Remote_Store.
4. IF the remote fetch fails and the Local_Cache contains `onboardingComplete: true`, THEN THE Onboarding_Dialog SHALL remain closed using the cached value.
5. IF the remote fetch fails and no Local_Cache exists, THEN THE Onboarding_Dialog SHALL remain closed and the Preferences_Provider SHALL retry the fetch on the next navigation.

### Requirement 2: Theme selection persists across page reloads

**User Story:** As a user who has chosen a theme, I want my theme preference to persist across page reloads and navigation, so that the interface always appears in my chosen mode.

#### Acceptance Criteria

1. WHEN a user selects a theme in settings, THE Preferences_Hook SHALL persist the theme value to both the Local_Cache and the Remote_Store.
2. WHEN a page loads, THE Theme_Init_Script SHALL read the theme from the Local_Cache and apply the correct class to `<html>` before React hydrates, preventing a flash of wrong theme.
3. WHEN the Preferences_Hook finishes loading, THE Theme_Provider SHALL apply the fetched theme only if it differs from the currently applied theme.
4. WHILE the Preferences_Hook is in a loading state, THE Theme_Provider SHALL not override the theme already applied by the Theme_Init_Script.
5. IF the Local_Cache and Remote_Store contain different theme values, THEN THE Preferences_Hook SHALL treat the Remote_Store value as authoritative and update the Local_Cache to match.

### Requirement 3: Preferences hook stability

**User Story:** As a user navigating between pages, I want my preferences to remain stable without unnecessary re-fetches or state resets, so that the UI does not flicker or revert settings.

#### Acceptance Criteria

1. THE Preferences_Hook SHALL initialize its state from the Local_Cache synchronously on mount, before any asynchronous fetch begins.
2. WHEN the Preferences_Hook mounts, THE Preferences_Hook SHALL fetch from the Remote_Store exactly once per mount cycle.
3. WHEN the Preferences_Hook re-renders due to parent re-renders, THE Preferences_Hook SHALL not re-trigger the remote fetch.
4. WHEN the `update` function is called, THE Preferences_Hook SHALL apply the change optimistically to state and Local_Cache, then persist to the Remote_Store in the background.
5. IF the Remote_Store write fails, THEN THE Preferences_Hook SHALL retain the optimistic local state and log a warning, without reverting the user-visible preference.

### Requirement 4: First-load and edge-case handling

**User Story:** As a user on a fresh browser or with cleared storage, I want the system to handle missing cache gracefully, so that I get sensible defaults without broken UI.

#### Acceptance Criteria

1. WHEN no Local_Cache exists and the user is authenticated, THE Preferences_Hook SHALL use default preferences as initial state and fetch from the Remote_Store.
2. WHEN no Local_Cache exists and the remote fetch returns preferences, THE Preferences_Hook SHALL write the fetched preferences to the Local_Cache.
3. WHEN the Local_Cache contains malformed JSON, THE Preferences_Hook SHALL discard the cache, use defaults, and fetch from the Remote_Store.
4. WHEN the user is not authenticated, THE Preferences_Hook SHALL use the Local_Cache if available, or defaults otherwise, without attempting a remote fetch.
5. WHEN preferences are updated in one browser tab, THE Preferences_Hook in other tabs SHALL reflect the update on next navigation or focus event.
