# Implementation Plan: PWA Installable

## Overview

This plan implements Progressive Web App capabilities for Home OS, enabling installation on Android and iOS devices with offline support, proper icons, and native-like display. The implementation uses a hand-written service worker (no third-party PWA libraries), a build script for icon generation, and Next.js Metadata API for manifest and meta tag integration.

## Tasks

- [x] 1. Create web app manifest and icon assets
  - [x] 1.1 Create the web app manifest file at `public/manifest.webmanifest`
    - Define all required fields: name, short_name, description, start_url, scope, display, theme_color, background_color
    - Include the full icons array with all sizes (72–512px) plus maskable icon entry
    - Ensure valid JSON conforming to W3C Web Application Manifest spec
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.9_

  - [x] 1.2 Create the source SVG icon at `public/icons/icon-source.svg`
    - Design a monospace-styled icon against the Home OS dark theme background (#09090b)
    - Keep meaningful content within the inner 80% safe zone for maskable compatibility
    - No photographic imagery or gradients
    - _Requirements: 2.2, 2.4_

  - [x] 1.3 Create the icon generation script at `scripts/generate-icons.ts`
    - Use `sharp` (dev dependency) to convert SVG to PNG at all required sizes: 72, 96, 128, 144, 152, 192, 384, 512
    - Generate maskable icon at 512x512 with padding for safe zone
    - Generate apple-touch-icon at 180x180
    - Handle errors: missing SVG, missing sharp dependency, unwritable output directory
    - Output all files to `public/icons/`
    - _Requirements: 2.1, 2.2, 2.3, 2.5_

  - [x] 1.4 Run the icon generation script to produce all PNG icon files
    - Execute `npx tsx scripts/generate-icons.ts`
    - Verify all icon files are created at correct sizes
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 2. Implement service worker and registration
  - [x] 2.1 Create the service worker at `public/sw.js`
    - Define CACHE_VERSION constant and PRECACHE_URLS array (offline page + app shell resources)
    - Implement install event: pre-cache resources, call skipWaiting()
    - Implement activate event: delete old caches, call clients.claim()
    - Implement fetch event with request routing:
      - Navigation requests → network-first with 3s timeout, fallback to cached shell, then offline page
      - Static assets (/icons/, fonts, images) → cache-first
      - Supabase API (supabase.co) → network-only
      - Other requests → network-first without timeout
    - Keep total pre-cache payload under 2MB
    - _Requirements: 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.7_

  - [x] 2.2 Create the service worker registration component at `components/providers/sw-register.tsx`
    - Mark as "use client"
    - Register `/sw.js` with scope `/` in a useEffect
    - Only register in production (check `process.env.NODE_ENV`)
    - Skip silently if Service Worker API is not supported
    - Catch registration errors: log to console.error, do not throw or show UI error
    - Return null (renders nothing)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 2.3 Write property test for service worker request routing (Property 2)
    - **Property 2: Service worker applies correct caching strategy based on request classification**
    - Generate random URLs and request modes with fast-check
    - Verify navigation → network-first, static assets → cache-first, Supabase API → network-only
    - **Validates: Requirements 4.2, 4.3, 4.4**

- [x] 3. Create offline fallback page
  - [x] 3.1 Create the offline fallback page at `public/offline.html`
    - Self-contained HTML with inline styles (no external dependencies)
    - Display offline message with app name "Home OS"
    - Use monospace font and dark theme colors matching bg-app (#09090b), text-app, text-app-muted
    - _Requirements: 4.5, 4.6_

- [x] 4. Update root layout metadata and viewport
  - [x] 4.1 Update `app/layout.tsx` metadata export
    - Add `manifest: "/manifest.webmanifest"` to metadata
    - Add `appleWebApp` config: capable=true, statusBarStyle="black-translucent", title="Home OS"
    - Add apple-touch-icon link referencing `/icons/apple-touch-icon.png` at 180x180
    - Add `mobile-web-app-capable: "yes"` in other field
    - _Requirements: 1.8, 5.1, 5.2, 5.3, 5.4_

  - [x] 4.2 Update `app/layout.tsx` viewport export
    - Set width=device-width, initialScale=1, viewportFit="cover"
    - Add themeColor array with light (#f4f4f5) and dark (#09090b) media queries
    - _Requirements: 5.5, 7.1_

- [x] 5. Checkpoint - Verify manifest, icons, and metadata
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement install prompt hook and settings UI
  - [x] 6.1 Create the `useInstallPrompt` hook at `hooks/use-install-prompt.ts`
    - Define BeforeInstallPromptEvent interface
    - Capture `beforeinstallprompt` event, prevent default, store deferred prompt
    - Detect standalone mode via `(display-mode: standalone)` media query
    - Detect platform (ios, android, desktop, unknown) via user agent
    - Expose: canInstall, isStandalone, isPrompting, promptInstall(), platform
    - Handle prompt acceptance (hide install option, clear deferred prompt)
    - Handle prompt dismissal (re-enable install option, retain deferred prompt)
    - Handle prompt() errors (catch, re-enable button, log to console)
    - _Requirements: 6.1, 6.3, 6.4, 6.5, 6.6_

  - [x] 6.2 Create the InstallAppSection component at `components/settings/install-app-section.tsx`
    - Mark as "use client"
    - Use the useInstallPrompt() hook
    - Show "Install App" button when canInstall=true and isStandalone=false
    - Disable button while isPrompting=true
    - Show manual installation instructions when platform is iOS and not standalone
    - Include platform name and at minimum 2 numbered steps (Share menu → Add to Home Screen)
    - Hide entirely when isStandalone=true
    - Use app design system classes (card-app, btn-primary-app, text-app, text-app-muted)
    - _Requirements: 6.2, 6.3, 6.6, 6.7_

  - [x] 6.3 Add InstallAppSection to the settings page at `app/(app)/settings/page.tsx`
    - Import and render InstallAppSection in the appropriate location within the settings page
    - _Requirements: 6.2_

  - [x] 6.4 Write property test for install option visibility (Property 3)
    - **Property 3: Install option visibility when installable and not standalone**
    - Generate random states where canInstall=true and isStandalone=false
    - Verify "Install App" option is visible
    - **Validates: Requirements 6.2**

  - [x] 6.5 Write property test for install option hidden in standalone (Property 4)
    - **Property 4: Install option hidden in standalone mode**
    - Generate random states where isStandalone=true
    - Verify "Install App" option is never visible regardless of canInstall value
    - **Validates: Requirements 6.6**

  - [x] 6.6 Write property test for manual install instructions (Property 5)
    - **Property 5: Manual install instructions completeness**
    - Generate random platform strings for unsupported browsers (no beforeinstallprompt)
    - Verify instructions contain platform name and at minimum 2 numbered steps
    - **Validates: Requirements 6.7**

- [x] 7. Add safe-area CSS
  - [x] 7.1 Add safe-area padding rules to `app/globals.css`
    - Apply `padding-top: env(safe-area-inset-top)`, `padding-bottom: env(safe-area-inset-bottom)`, `padding-left: env(safe-area-inset-left)`, `padding-right: env(safe-area-inset-right)` to the outermost layout container
    - Apply same safe-area padding to fixed-position elements (sidebar, header)
    - Ensure padding resolves to zero on devices without notches
    - _Requirements: 7.2, 7.3, 7.4_

  - [x] 7.2 Write property test for safe-area padding (Property 6)
    - **Property 6: Safe-area padding applied to fixed layout elements**
    - Generate random fixed-position element selectors
    - Verify CSS contains all four env(safe-area-inset-*) padding rules
    - **Validates: Requirements 7.2**

- [x] 8. Checkpoint - Verify install flow and safe-area
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Write manifest and integration tests
  - [x] 9.1 Write property test for manifest icon entries (Property 1)
    - **Property 1: Manifest icon entries are structurally valid**
    - Parse manifest.webmanifest, generate random icon entries
    - Validate each has: src (non-empty string starting with "/"), sizes (NxN pattern), type ("image/png"), purpose ("any" or "maskable")
    - **Validates: Requirements 2.3**

  - [x] 9.2 Write integration/smoke tests for PWA assets
    - Verify all icon files referenced in manifest exist and are valid PNGs
    - Verify apple-touch-icon exists at 180x180
    - Verify manifest.webmanifest is valid JSON with all required fields
    - Verify offline.html exists and contains required content (offline message, app name, monospace font)
    - Verify sw.js exists
    - _Requirements: 1.9, 2.1, 2.3, 4.6, 5.4, 5.6_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The service worker is hand-written (no next-pwa or Workbox) for simplicity and control
- Icon generation uses `sharp` which is already a dev dependency
- All tests use Vitest + fast-check and live in `__tests__/pwa-installable/`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "3.1"] },
    { "id": 1, "tasks": ["1.3", "2.1", "4.1", "4.2", "7.1"] },
    { "id": 2, "tasks": ["1.4", "2.2", "6.1", "7.2"] },
    { "id": 3, "tasks": ["2.3", "6.2", "9.1"] },
    { "id": 4, "tasks": ["6.3", "6.4", "6.5", "6.6"] },
    { "id": 5, "tasks": ["9.2"] }
  ]
}
```
