# Requirements Document

## Introduction

Home OS should be installable as a Progressive Web App (PWA) on Android and iOS devices, providing an app-like experience when launched from the home screen. This includes a web app manifest for installability, a service worker for offline caching, proper splash screen and icon configuration, and iOS-specific meta tags for Safari PWA behavior. The implementation should maintain the calm, minimal aesthetic of Home OS.

## Glossary

- **PWA**: Progressive Web App — a web application that uses modern web capabilities to deliver an app-like experience to users
- **Web_App_Manifest**: A JSON file (`manifest.webmanifest`) that provides metadata about the application (name, icons, theme color, display mode) enabling browser install prompts
- **Service_Worker**: A JavaScript file that runs in the background, intercepting network requests and enabling offline caching strategies
- **Standalone_Display**: A PWA display mode where the app runs in its own window without browser UI (address bar, navigation buttons)
- **Cache_Strategy**: The approach used by the Service Worker to decide when to serve cached content vs fetching from the network
- **Install_Prompt**: The browser-native UI that allows users to add the PWA to their home screen
- **Splash_Screen**: The loading screen shown when a PWA is launched from the home screen, composed of the app icon, name, and background color from the manifest
- **App_Shell**: The minimal HTML, CSS, and JavaScript required to render the application's UI skeleton

## Requirements

### Requirement 1: Web App Manifest

**User Story:** As a user, I want the app to declare itself as installable via a web app manifest, so that my browser can offer to install it on my device.

#### Acceptance Criteria

1. THE Web_App_Manifest SHALL include a `name` field set to "Home OS" and a `short_name` field set to "Home OS"
2. THE Web_App_Manifest SHALL specify `display` as "standalone" to provide an app-like experience without browser chrome
3. THE Web_App_Manifest SHALL specify a `start_url` of "/dashboard" so the app opens to the main view when launched
4. THE Web_App_Manifest SHALL specify a `scope` of "/" to allow navigation across all app routes
5. THE Web_App_Manifest SHALL specify a `theme_color` of "#09090b" and a `background_color` of "#09090b" to match the Home OS dark theme background
6. THE Web_App_Manifest SHALL include an `icons` array with at least a 192x192 and a 512x512 PNG icon, each entry specifying `src`, `sizes`, and `type` fields
7. THE Web_App_Manifest SHALL include a 512x512 icon entry with `purpose` set to "maskable" for adaptive icon support on Android
8. WHEN the app is loaded in a browser, THE Root_Layout SHALL reference the manifest file via a `<link rel="manifest">` tag in the document head
9. THE Web_App_Manifest SHALL be served as valid JSON conforming to the W3C Web Application Manifest specification

### Requirement 2: App Icons and Splash Screens

**User Story:** As a user, I want the app to display proper icons and splash screens when installed, so that it feels like a native application.

#### Acceptance Criteria

1. THE PWA SHALL provide PNG icon files at sizes 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, and 512x512 pixels
2. THE PWA SHALL provide at least one maskable icon at 512x512 in PNG format, with all meaningful content contained within the inner 80% circular safe zone to prevent clipping during Android adaptive icon rendering
3. THE Web_App_Manifest SHALL define each icon entry with a `src` path pointing to an accessible icon file, a `sizes` value matching the file's pixel dimensions, a `type` of "image/png", and a `purpose` of either "any" or "maskable" as appropriate
4. THE PWA icons SHALL use a monospace-styled design rendered against a neutral background from the Home OS dark theme palette, with no photographic imagery or gradients
5. WHEN the PWA is launched from the home screen on Android, THE Web_App_Manifest SHALL provide the 512x512 icon and a valid `background_color` value so that the operating system can generate a Splash_Screen displaying the icon centered on that background color

### Requirement 3: Service Worker Registration

**User Story:** As a user, I want the app to register a service worker, so that it can cache resources and provide offline capabilities.

#### Acceptance Criteria

1. WHEN the app loads in the browser, THE Service_Worker_Registrar SHALL register a service worker at `/sw.js` with a scope of `/`
2. IF the browser does not support the Service Worker API, THEN THE Service_Worker_Registrar SHALL skip registration silently without displaying an error to the user
3. IF the current environment is production, THEN THE Service_Worker_Registrar SHALL proceed with service worker registration; otherwise it SHALL skip registration
4. IF the service worker registration fails, THEN THE Service_Worker_Registrar SHALL log the error to the console and SHALL NOT throw an unhandled exception, display an error message to the user, or prevent the app from functioning
5. WHEN a new service worker version is detected by the browser, THE Service_Worker SHALL call `skipWaiting` during the install phase and `clients.claim` during the activate phase to take control of all open tabs without requiring a page reload

### Requirement 4: Offline Caching Strategy

**User Story:** As a user, I want the app to cache essential resources, so that the app shell loads quickly and basic navigation works even with poor connectivity.

#### Acceptance Criteria

1. WHEN the service worker is installed, THE Service_Worker SHALL pre-cache the App_Shell resources (HTML shell, CSS bundles, JavaScript bundles required to render the app layout and navigation) and the offline fallback page, with a total pre-cache payload not exceeding 2 MB
2. WHEN a navigation request is made, THE Service_Worker SHALL use a network-first strategy with a network timeout of 3 seconds, falling back to the cached App_Shell if the network request fails or times out
3. WHEN a static asset request is made (fonts, icons, images), THE Service_Worker SHALL use a cache-first strategy, serving the cached version if available and fetching from the network only on cache miss
4. WHEN a Supabase API request is made, THE Service_Worker SHALL use a network-only strategy to ensure data freshness
5. IF the network is unavailable and no cached response exists for a navigation request, THEN THE Service_Worker SHALL serve the pre-cached offline fallback page
6. THE Offline_Fallback_Page SHALL display a message indicating the user is offline, use the app's monospace font and semantic color tokens (bg-app, text-app, text-app-muted), and include the app name
7. WHEN a new service worker version activates, THE Service_Worker SHALL delete previously versioned caches and replace them with the updated pre-cache resources

### Requirement 5: iOS PWA Meta Tags

**User Story:** As a user on an iOS device, I want the app to behave correctly as a PWA in Safari, so that I get a proper app-like experience on my iPhone or iPad.

#### Acceptance Criteria

1. THE Root_Layout SHALL include a `<meta name="apple-mobile-web-app-capable" content="yes">` tag in the document head
2. THE Root_Layout SHALL include a `<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">` tag in the document head
3. THE Root_Layout SHALL include a `<meta name="apple-mobile-web-app-title" content="Home OS">` tag in the document head
4. THE Root_Layout SHALL include a `<link rel="apple-touch-icon" sizes="180x180">` tag referencing a 180x180 pixel PNG icon file that exists at the specified path
5. THE Root_Layout SHALL include a `<meta name="theme-color">` tag with a value matching the app's light-mode background color, and a second `<meta name="theme-color" media="(prefers-color-scheme: dark)">` tag with a value matching the app's dark-mode background color
6. IF the icon file referenced by the apple-touch-icon link tag does not exist at the specified path, THEN the build or deployment process SHALL fail or produce a warning indicating the missing asset

### Requirement 6: Install Prompt Handling

**User Story:** As a user, I want to be guided on how to install the app, so that I can easily add it to my home screen.

#### Acceptance Criteria

1. WHEN the browser fires a `beforeinstallprompt` event, THE Install_Prompt_Handler SHALL capture the event, prevent its default behavior, and store the deferred prompt reference in memory for later use
2. IF the deferred prompt is available and the app is not running in standalone display mode, THEN THE Settings_Page SHALL display an "Install App" option
3. WHEN the user taps the "Install App" option, THE Install_Prompt_Handler SHALL trigger the deferred browser install prompt and disable the "Install App" option until the user responds to the prompt
4. WHEN the user accepts the browser install prompt, THE Install_Prompt_Handler SHALL hide the "Install App" option from the Settings_Page and clear the stored deferred prompt reference
5. WHEN the user dismisses the browser install prompt, THE Install_Prompt_Handler SHALL re-enable the "Install App" option and retain the deferred prompt reference for future use
6. WHILE the app is running in standalone display mode (detected via `display-mode: standalone` media query), THE Settings_Page SHALL hide the "Install App" option
7. IF the browser does not support the `beforeinstallprompt` event and the app is not running in standalone display mode, THEN THE Settings_Page SHALL display a manual installation instructions panel containing: the platform name (e.g., "iOS"), a step-by-step description referencing the Share menu and "Add to Home Screen" action, and at minimum 2 numbered steps

### Requirement 7: Viewport and Display Configuration

**User Story:** As a user, I want the installed app to use the full screen properly, so that it feels native and handles device-specific UI elements like notches.

#### Acceptance Criteria

1. THE Root_Layout SHALL include a viewport meta tag with `width=device-width, initial-scale=1, viewport-fit=cover` to enable edge-to-edge rendering on notched devices
2. THE App_Shell CSS SHALL apply `padding-top: env(safe-area-inset-top)`, `padding-bottom: env(safe-area-inset-bottom)`, `padding-left: env(safe-area-inset-left)`, and `padding-right: env(safe-area-inset-right)` to the outermost layout container and any fixed-position elements (sidebar, header) so that interactive content is never obscured by device notches or system UI
3. WHILE the app is running in standalone display mode, THE App_Shell SHALL render without browser navigation UI, verified by the web app manifest declaring `display` as `standalone` and the app matching the `(display-mode: standalone)` media query
4. IF the device does not have notches or system UI overlays, THEN THE App_Shell safe-area padding SHALL resolve to zero, introducing no additional spacing beyond the app's default layout padding
