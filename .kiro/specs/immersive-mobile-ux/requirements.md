# Requirements Document

## Introduction

This feature creates an immersive, mobile-first UX system for Home OS that mimics the edge-to-edge, infinite-scroll feel of YouTube mobile, TikTok, and Instagram Reels. It builds on top of the existing scroll-hide header, Dynamic Island safe-area handling, and scroll-hide search bar implementations. The feature introduces a reusable MobileShell layout component, SafeAreaContainer abstraction, BottomNav with scroll-hide behavior, a useImmersiveViewport hook for fullscreen/edge-to-edge mode, and comprehensive handling of mobile-specific edge cases (keyboard, orientation, PWA mode, route transitions).

## Glossary

- **MobileShell**: A reusable layout component that wraps mobile content and orchestrates immersive viewport behavior, safe-area management, and scroll-aware chrome visibility
- **SafeAreaContainer**: A component that abstracts CSS `env(safe-area-inset-*)` values into a consistent, reusable container for safe-area-aware content placement
- **BottomNav**: A fixed-position bottom navigation bar for mobile that hides on scroll-down and reveals on scroll-up, respecting the bottom safe-area inset
- **useImmersiveViewport**: A custom React hook that manages dynamic viewport height (dvh), detects PWA standalone mode, handles keyboard visibility, and provides viewport state to consumers
- **Dynamic_Viewport_Height**: The use of CSS `100dvh` (dynamic viewport height) instead of `100vh` to account for mobile browser chrome (address bar, toolbar) that changes the visible viewport
- **Safe_Area_Inset**: The CSS `env(safe-area-inset-*)` values that represent device-specific regions (notch, Dynamic Island, home indicator) where content must not be placed
- **PWA_Standalone_Mode**: When the app is installed as a Progressive Web App and runs without browser chrome, requiring full safe-area management
- **Scroll_Direction**: The detected direction of user scroll (`"up"`, `"down"`, or `null`), provided by the existing `useScrollDirection` hook
- **Immersive_Mode**: The visual state where all navigation chrome (header, bottom nav) is hidden and content occupies the full viewport edge-to-edge
- **Chrome_Visible_Mode**: The visual state where navigation chrome (header, bottom nav) is visible with proper safe-area padding
- **Visual_Viewport_API**: The `window.visualViewport` browser API that provides the actual visible area dimensions, accounting for on-screen keyboard and pinch-zoom
- **Overscroll_Bounce**: The elastic bounce effect on iOS Safari when scrolling past content boundaries

## Requirements

### Requirement 1: MobileShell Layout Component

**User Story:** As a developer, I want a reusable MobileShell layout component, so that I can wrap mobile content with consistent immersive viewport behavior without duplicating logic across pages.

#### Acceptance Criteria

1. THE MobileShell SHALL render its children within a full-viewport container that uses `100dvh` as the height unit when the viewport width is below 768px
2. WHILE the viewport width is below 768px, THE MobileShell SHALL activate immersive mode orchestration including scroll-aware chrome visibility
3. WHILE the viewport width is at or above 768px, THE MobileShell SHALL render children without immersive mode behavior and pass through to the existing desktop layout
4. THE MobileShell SHALL provide a React context that exposes the current immersive state (chrome visible, chrome hidden, keyboard open) to descendant components, with the initial state set to chrome visible on mount
5. WHEN the Scroll_Direction changes to "down", THE MobileShell SHALL hide the Header and BottomNav components; WHEN the Scroll_Direction changes to "up" or is null, THE MobileShell SHALL show the Header and BottomNav components
6. IF the MobileShell receives a children prop that is undefined or null, THEN THE MobileShell SHALL render an empty container with the full-viewport height without throwing errors or rendering fallback content

### Requirement 2: SafeAreaContainer Component

**User Story:** As a developer, I want a SafeAreaContainer abstraction, so that I can consistently handle device safe-area insets without manually managing CSS env() values in every component.

#### Acceptance Criteria

1. IF the `edges` prop includes "top", THEN THE SafeAreaContainer SHALL apply `padding-top: env(safe-area-inset-top)` to the rendered element
2. IF the `edges` prop includes "bottom", THEN THE SafeAreaContainer SHALL apply `padding-bottom: env(safe-area-inset-bottom)` to the rendered element
3. IF the `edges` prop includes "left", THEN THE SafeAreaContainer SHALL apply `padding-left: env(safe-area-inset-left)` to the rendered element
4. IF the `edges` prop includes "right", THEN THE SafeAreaContainer SHALL apply `padding-right: env(safe-area-inset-right)` to the rendered element
5. IF no `edges` prop is provided, THEN THE SafeAreaContainer SHALL apply all four safe-area insets (top, bottom, left, right) by default
6. IF the `edges` prop is provided as an empty array, THEN THE SafeAreaContainer SHALL apply no safe-area inset padding
7. THE SafeAreaContainer SHALL accept a `className` prop and append its value to the element's class list after the safe-area padding styles, so that additional styling is applied without removing the safe-area padding
8. THE SafeAreaContainer SHALL render as the HTML element specified by the `as` prop, defaulting to `div` when the `as` prop is not provided
9. THE SafeAreaContainer SHALL render its `children` prop as the content of the rendered element
10. THE SafeAreaContainer SHALL accept the `edges` prop as an array of zero or more values from the set: "top", "bottom", "left", "right"

### Requirement 3: BottomNav Component

**User Story:** As a mobile user, I want a bottom navigation bar that hides when I scroll down and reappears when I scroll up, so that I have more screen space for content while maintaining easy access to navigation.

#### Acceptance Criteria

1. THE BottomNav SHALL render as a fixed-position element at the bottom of the viewport on mobile viewports (below 768px)
2. THE BottomNav SHALL apply `padding-bottom: env(safe-area-inset-bottom)` to prevent overlap with the device home indicator
3. WHEN the Scroll_Direction is "down", THE BottomNav SHALL hide by applying a translateY equal to 100% of its own height (moving it fully below the viewport edge) using ease-in easing
4. WHEN the Scroll_Direction is "up" or null, THE BottomNav SHALL reveal by applying translateY(0) returning it to its visible position using ease-out easing
5. THE BottomNav SHALL use GPU-accelerated `transform` properties for hide/show animations with duration between 150ms and 300ms, using ease-out easing for reveal and ease-in easing for hide
6. WHILE the BottomNav is hidden, THE BottomNav SHALL set `pointer-events: none` to prevent accidental taps on invisible elements
7. WHEN the viewport width is at or above 768px, THE BottomNav SHALL not render (desktop uses the sidebar for navigation)
8. THE BottomNav SHALL contain navigation items with minimum touch target size of 44x44px and a maximum of 5 navigation items
9. WHEN the user prefers reduced motion, THE BottomNav SHALL hide and show with zero animation duration while maintaining state changes and pointer-events toggling
10. WHEN the device is detected as low-performance (device memory ≤ 4 GB or no backdrop-filter support), THE BottomNav SHALL hide and show with zero animation duration while maintaining state changes and pointer-events toggling
11. WHEN the scroll position is at the top of the page (scrollY equals 0), THE BottomNav SHALL be in the visible state regardless of the previous Scroll_Direction

### Requirement 4: useImmersiveViewport Hook

**User Story:** As a developer, I want a useImmersiveViewport hook, so that I can access dynamic viewport dimensions, keyboard state, and PWA mode detection in any component that needs viewport-aware behavior.

#### Acceptance Criteria

1. THE useImmersiveViewport hook SHALL return the current viewport height in pixels using the Visual_Viewport_API when available, falling back to `window.innerHeight`
2. THE useImmersiveViewport hook SHALL return a boolean `isKeyboardOpen` that is true when the visual viewport height is at least 150px smaller than the layout viewport height (`window.innerHeight`)
3. THE useImmersiveViewport hook SHALL return a boolean `isStandalone` that is true when the app is running in PWA_Standalone_Mode (detected via `display-mode: standalone` media query or `navigator.standalone`)
4. WHEN the device orientation changes, THE useImmersiveViewport hook SHALL return the updated orientation value ("portrait" or "landscape") within one animation frame after the orientationchange event fires
5. WHEN the visual viewport resizes due to keyboard open or close, THE useImmersiveViewport hook SHALL emit the updated viewport height within one animation frame
6. WHEN the orientation changes, THE useImmersiveViewport hook SHALL emit updated dimensions after a 100ms debounce to allow the viewport to stabilize after rotation
7. THE useImmersiveViewport hook SHALL clean up all event listeners (visualViewport resize, orientationchange) on unmount
8. THE useImmersiveViewport hook SHALL use passive event listeners for all viewport-related events
9. THE useImmersiveViewport hook SHALL throttle viewport resize callbacks using requestAnimationFrame to limit updates to one per frame
10. IF the hook is executed in a server-side rendering environment where `window` is undefined, THEN THE useImmersiveViewport hook SHALL return default values of viewport height 0, `isKeyboardOpen` false, `isStandalone` false, and orientation "portrait" without registering any event listeners
11. WHEN the hook mounts in a browser environment, THE useImmersiveViewport hook SHALL synchronously measure and return the current viewport height, keyboard state, standalone status, and orientation before any events fire

### Requirement 5: Dynamic Viewport Height Support

**User Story:** As a mobile user, I want the app content to fill the actual visible screen area, so that the experience feels truly fullscreen without gaps caused by mobile browser chrome.

#### Acceptance Criteria

1. THE MobileShell SHALL use `100dvh` as the primary height unit for the main content container on mobile viewports (below 768px)
2. THE MobileShell SHALL set a CSS custom property `--app-viewport-height` on the document root element with a pixel value equal to the current visual viewport height (via `window.visualViewport.height` when available, otherwise `window.innerHeight`), updated at most once per animation frame
3. WHEN the mobile browser chrome (address bar/toolbar) collapses or expands, THE MobileShell SHALL adjust the content height using a CSS transition on the custom property with duration between 150ms and 300ms using ease-out easing, preventing layout reflow by applying height only via the `--app-viewport-height` custom property
4. IF the browser does not support `dvh` units, THEN THE MobileShell SHALL fall back to setting the container height to the `--app-viewport-height` custom property value derived from the Visual_Viewport_API, and if the Visual_Viewport_API is also unavailable, SHALL fall back to `100vh` without JavaScript correction
5. WHILE in PWA_Standalone_Mode, THE MobileShell SHALL use `100vh` directly and SHALL not apply browser chrome compensation logic

### Requirement 6: Scroll State Preservation Across Route Transitions

**User Story:** As a mobile user, I want my scroll position preserved when navigating between pages and returning, so that I do not lose my place in long content feeds.

#### Acceptance Criteria

1. WHEN the user navigates away from a route via any client-side route transition, THE MobileShell SHALL store the current vertical scroll offset (in pixels) keyed by the route pathname excluding query parameters and hash fragments
2. WHEN the user navigates to a route that has a stored scroll position, THE MobileShell SHALL restore the stored vertical scroll offset within 1 frame after the route's content container has mounted and reached a scrollable height equal to or greater than the stored offset
3. THE MobileShell SHALL store scroll positions for a maximum of 20 routes using a least-recently-used eviction strategy where the least recently visited route entry is removed when the cache exceeds 20 entries
4. WHEN a route is visited for the first time with no stored scroll position, THE MobileShell SHALL start at scroll position 0
5. IF the stored scroll position exceeds the current content height of the restored route, THEN THE MobileShell SHALL scroll to the maximum available scroll position (bottom of content) instead of the stored value
6. WHEN the user performs a hard refresh or full page reload, THE MobileShell SHALL clear all stored scroll positions and start at scroll position 0 for the current route

### Requirement 7: Keyboard Visibility Handling

**User Story:** As a mobile user, I want the app layout to adapt when the on-screen keyboard opens, so that input fields remain visible and the navigation chrome does not overlap the keyboard.

#### Acceptance Criteria

1. WHEN the on-screen keyboard opens (visual viewport height decreases by at least 150px from the layout viewport height), THE MobileShell SHALL hide the BottomNav with zero animation duration to prevent it from floating above the keyboard
2. WHEN the on-screen keyboard opens, THE MobileShell SHALL update the `--app-viewport-height` CSS custom property to reflect the reduced visible area (visual viewport height in pixels)
3. WHEN the on-screen keyboard closes (visual viewport height returns to within 150px of the layout viewport height), THE MobileShell SHALL restore the BottomNav visibility based on the current Scroll_Direction state
4. WHEN the on-screen keyboard closes, THE MobileShell SHALL restore the `--app-viewport-height` CSS custom property to the full visual viewport height
5. THE MobileShell SHALL detect keyboard visibility using the Visual_Viewport_API resize event, comparing `window.visualViewport.height` against `window.innerHeight` with the 150px threshold
6. WHILE the keyboard is open, THE MobileShell SHALL not trigger scroll-direction-based chrome visibility changes to prevent the header from hiding while the user is typing

### Requirement 8: iOS Safari Viewport Quirks Handling

**User Story:** As an iOS Safari user, I want the app to handle Safari-specific viewport behaviors correctly, so that the experience feels native without visual glitches.

#### Acceptance Criteria

1. THE MobileShell SHALL handle iOS Safari Overscroll_Bounce by not triggering scroll direction changes when `window.scrollY` is less than 0 or when `window.scrollY` exceeds `document.documentElement.scrollHeight - window.innerHeight`
2. THE MobileShell SHALL handle Safari toolbar collapse/expand by using `100dvh` which automatically accounts for toolbar state
3. WHILE the iOS Safari address bar is animating (detected by visual viewport resize events occurring within 300ms of each other without user scroll input), THE MobileShell SHALL suppress chrome visibility changes for a 300ms window to prevent flickering
4. THE MobileShell SHALL require the viewport meta tag to include `viewport-fit=cover` to enable edge-to-edge rendering on notched devices
5. THE MobileShell SHALL apply `-webkit-overflow-scrolling: touch` on the main scrollable content container for momentum scrolling on iOS Safari (where supported)

### Requirement 9: PWA Standalone Mode Support

**User Story:** As a user who has installed Home OS as a PWA, I want the app to utilize the full screen without browser chrome, so that the experience feels like a native app.

#### Acceptance Criteria

1. WHEN running in PWA_Standalone_Mode, THE MobileShell SHALL set the main content container height to `100vh` (bypassing `100dvh`) since there is no browser chrome to compensate for
2. WHEN running in PWA_Standalone_Mode, THE MobileShell SHALL apply all four safe-area insets (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)`, `env(safe-area-inset-right)`) to the outermost layout container since there is no browser chrome providing them
3. WHEN running in PWA_Standalone_Mode, THE MobileShell SHALL set the background color of the element occupying the `env(safe-area-inset-top)` region to `bg-app-surface` so the status bar area visually matches the app theme
4. THE MobileShell SHALL detect PWA_Standalone_Mode using the `display-mode: standalone` media query combined with `navigator.standalone` for iOS, evaluating both on initial mount and on media query change events
5. IF neither the `display-mode: standalone` media query nor `navigator.standalone` is supported by the browser, THEN THE MobileShell SHALL default to non-standalone behavior (using `100dvh` with browser chrome compensation)

### Requirement 10: Orientation Change Handling

**User Story:** As a mobile user, I want the app to adapt smoothly when I rotate my device, so that the layout adjusts without visual glitches or lost state.

#### Acceptance Criteria

1. WHEN the device orientation changes, THE MobileShell SHALL recalculate and update the `--app-viewport-height` CSS custom property to reflect the new viewport dimensions
2. WHEN the device orientation changes, THE MobileShell SHALL preserve the current chrome visibility state (hidden or visible) without resetting to the default visible state
3. WHEN the device orientation changes, THE MobileShell SHALL re-read safe-area inset values which may differ between portrait and landscape orientations
4. THE MobileShell SHALL debounce orientation change handling by 100ms to wait for the viewport to stabilize after rotation before updating the `--app-viewport-height` value
5. WHEN the device orientation changes while the keyboard is open, THE MobileShell SHALL close the keyboard state and restore the full viewport height before applying orientation-specific adjustments

### Requirement 11: Rapid Scroll Direction Change Handling

**User Story:** As a mobile user, I want the navigation chrome to respond smoothly to rapid scroll direction changes, so that the UI does not flicker or jank during fast scrolling.

#### Acceptance Criteria

1. THE MobileShell SHALL rely on the existing `useScrollDirection` hook's built-in threshold (10px accumulated delta) to debounce rapid direction changes, and SHALL not apply additional time-based debouncing on top of the hook's output
2. THE MobileShell SHALL require a minimum scroll delta of 10px (the existing useScrollDirection threshold) before triggering a chrome visibility change
3. WHILE a hide or show animation is in progress and the Scroll_Direction reverses, THE MobileShell SHALL pass the new `animate` value to Framer Motion which will interrupt the current animation and start the reverse animation from the current interpolated position
4. THE MobileShell SHALL not accumulate animation debt from rapid direction changes — each new Scroll_Direction value results in a single Framer Motion `animate` prop update that starts from the current rendered position

### Requirement 12: Immersive Content Area

**User Story:** As a mobile user, I want the content area to feel edge-to-edge and infinite when scrolling, so that the experience is immersive like YouTube mobile or TikTok.

#### Acceptance Criteria

1. WHILE the chrome is hidden (Immersive_Mode), THE content area SHALL occupy the full viewport height as defined by the `--app-viewport-height` CSS custom property, including the areas previously occupied by the header and bottom nav
2. WHILE the chrome is visible (Chrome_Visible_Mode), THE content area SHALL occupy the viewport height minus the combined height of the visible header and bottom nav, without requiring a re-layout when chrome visibility changes
3. THE content area SHALL use `overflow-y: auto` with `-webkit-overflow-scrolling: touch` applied for momentum scrolling on iOS Safari
4. WHEN transitioning from Chrome_Visible_Mode to Immersive_Mode, THE content area SHALL not shift or jump — the chrome elements SHALL animate away using `transform: translateY` independently while the content scroll position remains unchanged
5. WHEN transitioning from Immersive_Mode to Chrome_Visible_Mode, THE content area SHALL not shift or jump — the chrome elements SHALL animate into view using `transform: translateY` independently while the content scroll position remains unchanged
6. THE content area background SHALL extend edge-to-edge including behind the status bar area (enabled by `viewport-fit=cover`) to prevent any visible background gaps at the screen edges
7. THE content area SHALL maintain a continuous scroll position during both Chrome_Visible_Mode to Immersive_Mode and Immersive_Mode to Chrome_Visible_Mode transitions, with zero pixels of content displacement

### Requirement 13: Animation Performance

**User Story:** As a mobile user, I want all animations to feel smooth and native, so that the app does not feel sluggish or janky on my device.

#### Acceptance Criteria

1. THE MobileShell SHALL use only `transform` and `opacity` CSS properties for all hide/show animations to ensure GPU acceleration
2. THE MobileShell SHALL not animate layout-triggering properties (width, height, top, bottom, left, right, margin, padding) during chrome visibility transitions
3. THE MobileShell SHALL use Framer Motion with `transform` animations for the BottomNav hide/show behavior, with a duration between 150ms and 300ms
4. WHEN the device is detected as low-performance via the `useLowPerformance` hook (device RAM ≤ 4 GB or missing `backdrop-filter` CSS support), THE MobileShell SHALL disable all transition animations and apply state changes with zero duration (0ms transition)
5. WHILE the header or bottom nav is visible and subject to scroll-triggered hide/show transitions, THE MobileShell SHALL apply `will-change: transform` on those elements
6. WHEN a hide/show transition on the header or bottom nav completes and the element remains in a fixed position for more than 500ms without further transition, THE MobileShell SHALL remove the `will-change` property from that element

### Requirement 14: Accessibility

**User Story:** As a user with accessibility needs, I want the immersive mobile experience to remain fully accessible, so that I can navigate and interact with the app using assistive technologies.

#### Acceptance Criteria

1. THE BottomNav SHALL have `role="navigation"` and an `aria-label` of "Main navigation" describing its purpose
2. WHEN the BottomNav is hidden (translateY moves it off-screen), THE BottomNav SHALL set `aria-hidden="true"` to prevent screen readers from announcing hidden navigation items
3. WHEN the BottomNav is visible (translateY is 0), THE BottomNav SHALL set `aria-hidden="false"` to allow screen reader access to navigation items
4. THE MobileShell SHALL not interfere with focus management — keyboard focus SHALL remain functional and tab order SHALL be preserved regardless of chrome visibility state
5. WHEN the user prefers reduced motion (detected via `useReducedMotion` hook), THE MobileShell SHALL respect the preference by applying all state changes with zero animation duration while maintaining functional visibility toggling
6. THE BottomNav navigation items SHALL have descriptive `aria-label` attributes for screen reader users that describe the destination (e.g., "Navigate to Dashboard")
