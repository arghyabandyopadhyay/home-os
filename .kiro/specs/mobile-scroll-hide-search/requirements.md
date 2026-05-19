# Requirements Document

## Introduction

This feature enhances the mobile experience by hiding the Floating_Search_Bar when the user scrolls down (moving it off-screen downward) and revealing it again when the user scrolls up. This keeps the content area unobstructed during active reading while maintaining quick access to search when the user reverses scroll direction. The existing sticky Header remains fixed at the top throughout. The scroll-driven hide/show behavior uses performant transform-only animations, respects reduced motion preferences, and degrades gracefully on low-performance devices.

## Glossary

- **Floating_Search_Bar**: The existing fixed-position pill-shaped search button rendered at the bottom center of the viewport on mobile screens (the `FloatingSearchBar` component).
- **Header**: The existing sticky navigation bar at the top of the app viewport (`Header` component, `sticky top-0 z-40`).
- **Scroll_Direction_Hook**: A custom hook that tracks the user's vertical scroll direction (up or down) using passive scroll listeners and requestAnimationFrame throttling.
- **Visible_State**: The default state of the Floating_Search_Bar where it is fully on-screen at its normal bottom position.
- **Hidden_State**: The state of the Floating_Search_Bar where it has been translated downward off the visible viewport.
- **Scroll_Threshold**: A minimum scroll distance (in pixels) the user must travel in one direction before the hide/show behavior triggers, preventing jitter from small scroll movements.
- **Mobile_Mode**: The viewport state when the screen width is below the `md` Tailwind breakpoint (less than 768px).

## Requirements

### Requirement 1: Hide on Scroll Down

**User Story:** As a mobile user, I want the floating search bar to move out of view when I scroll down, so that it does not obstruct the content I am reading.

#### Acceptance Criteria

1. WHEN the user scrolls down by more than the Scroll_Threshold in Mobile_Mode, THE Floating_Search_Bar SHALL transition from Visible_State to Hidden_State by translating downward off-screen.
2. THE Floating_Search_Bar in Hidden_State SHALL be translated along the Y-axis by at least the sum of its own rendered height, its bottom offset, and its box-shadow spread so that no part of the element or its shadow is visible within the viewport.
3. WHILE the Floating_Search_Bar is in Hidden_State, THE Floating_Search_Bar SHALL remain in the DOM with `pointer-events: none` so that it does not intercept touch events on underlying content.
4. THE Floating_Search_Bar SHALL use a Scroll_Threshold between 8px and 20px to prevent the hide transition from triggering on incidental micro-scrolls.
5. IF the Floating_Search_Bar is already in Hidden_State when a subsequent scroll-down event exceeds the Scroll_Threshold, THEN THE Floating_Search_Bar SHALL remain in Hidden_State without re-triggering the hide transition.

### Requirement 2: Show on Scroll Up

**User Story:** As a mobile user, I want the floating search bar to reappear when I scroll up, so that I can quickly access search without scrolling back to the top.

#### Acceptance Criteria

1. WHEN the user scrolls up by more than the Scroll_Threshold in Mobile_Mode while the Floating_Search_Bar is in Hidden_State, THE Floating_Search_Bar SHALL transition from Hidden_State to Visible_State by translating back to its original bottom position (translateY 0).
2. WHEN the user reaches the top of the scrollable content (scrollY equals 0), THE Floating_Search_Bar SHALL be in Visible_State regardless of the previous scroll direction or current state.
3. THE Floating_Search_Bar in Visible_State SHALL have `pointer-events: auto` so that it is interactive.
4. WHEN the user reverses scroll direction from up to down while the Floating_Search_Bar is transitioning to Visible_State, THE Floating_Search_Bar SHALL cancel the in-progress show transition and begin transitioning to Hidden_State from its current translateY position.
5. WHEN the user reverses scroll direction (from up to down or down to up), THE Scroll_Direction_Hook SHALL reset the accumulated scroll delta to 0 so that the Scroll_Threshold must be exceeded again in the new direction before triggering a state change.

### Requirement 3: Hide/Show Animation

**User Story:** As a user, I want the hide and show transitions to feel smooth and responsive, so that the search bar movement does not feel jarring or laggy.

#### Acceptance Criteria

1. WHEN the Floating_Search_Bar transitions from Visible_State to Hidden_State, THE Floating_Search_Bar SHALL animate using only the `transform` property (translateY) with a duration between 150ms and 300ms and ease-in easing.
2. WHEN the Floating_Search_Bar transitions from Hidden_State to Visible_State, THE Floating_Search_Bar SHALL animate using only the `transform` property (translateY) with a duration between 150ms and 300ms and ease-out easing.
3. THE Floating_Search_Bar SHALL not animate `width`, `height`, `top`, `bottom`, `left`, `right`, or any layout-triggering property during the hide/show transition.
4. WHILE the user has enabled the `prefers-reduced-motion: reduce` OS-level setting, THE Floating_Search_Bar SHALL transition between Visible_State and Hidden_State with duration 0 (instant, no intermediate animation frames).
5. IF a hide/show transition is in progress and the opposite transition is triggered, THEN THE Floating_Search_Bar SHALL begin the new transition from its current translateY position without snapping to the start or end of the interrupted transition.
6. THE hide transition displacement SHALL be at least the sum of the element height (44px), bottom offset (24px), and shadow spread (approximately 10px), totaling a minimum translateY of 78px downward.

### Requirement 4: Scroll Direction Detection

**User Story:** As a developer, I want scroll direction detection to be performant and reusable, so that the feature does not cause jank or excessive re-renders.

#### Acceptance Criteria

1. THE Scroll_Direction_Hook SHALL register the scroll event listener with `{ passive: true }` to avoid blocking the browser's scroll thread.
2. THE Scroll_Direction_Hook SHALL throttle scroll position reads using `requestAnimationFrame` so that at most one read occurs per animation frame.
3. THE Scroll_Direction_Hook SHALL compare the current scroll position against the previous position to determine direction, only updating state when the delta exceeds the Scroll_Threshold.
4. WHEN the component using the Scroll_Direction_Hook unmounts, THE Scroll_Direction_Hook SHALL remove all event listeners and cancel any pending requestAnimationFrame callbacks.
5. THE Scroll_Direction_Hook SHALL return a direction value of "up", "down", or null (null representing the initial state before any scroll exceeds the threshold).
6. WHEN the page first loads and no scroll has occurred, THE Scroll_Direction_Hook SHALL return null and the Floating_Search_Bar SHALL remain in Visible_State.

### Requirement 5: Header Sticky Preservation

**User Story:** As a mobile user, I want the navigation header to remain visible at the top of the screen at all times, so that I can always access navigation controls.

#### Acceptance Criteria

1. THE Header SHALL remain `sticky` with `top: 0` and a z-index of 40 at all times, regardless of scroll direction or Floating_Search_Bar state.
2. THE Header SHALL not be affected by the scroll-based hide/show logic applied to the Floating_Search_Bar.
3. WHILE the user scrolls in any direction, THE Header SHALL remain fully visible and interactive at the top of the viewport.

### Requirement 6: Reduced Motion Accessibility

**User Story:** As a user with motion sensitivity, I want the search bar to hide and show without animation, so that the movement does not cause discomfort.

#### Acceptance Criteria

1. WHILE the user has enabled the `prefers-reduced-motion: reduce` OS-level setting, THE Floating_Search_Bar SHALL apply duration 0 to all hide/show transitions (both CSS transitions and Framer Motion animations), resulting in an instant state change with no visible intermediate animation frames.
2. WHILE the user has enabled the `prefers-reduced-motion: reduce` OS-level setting, THE Floating_Search_Bar SHALL still respond to scroll direction changes (hide on scroll down, show on scroll up) by immediately applying the final positional state and the corresponding `pointer-events` value (`none` in Hidden_State, `auto` in Visible_State) without animated movement.
3. WHILE the user has enabled the `prefers-reduced-motion: reduce` OS-level setting, IF the user toggles the OS reduced-motion preference at runtime, THEN THE Floating_Search_Bar SHALL adopt the new motion behavior (animated or instant) on the next scroll-triggered state change without requiring a page reload.

### Requirement 7: Low-Performance Device Degradation

**User Story:** As a user on a low-performance device, I want the scroll-hide behavior to degrade gracefully, so that the app remains responsive.

#### Acceptance Criteria

1. WHILE the device is detected as low-performance (via the `useLowPerformance` hook), THE Floating_Search_Bar SHALL apply duration 0 to all hide/show transitions so that the transform to the target position is applied immediately with no intermediate animation frames.
2. WHILE the device is detected as low-performance, THE Scroll_Direction_Hook SHALL continue to detect scroll direction using the same Scroll_Threshold, update the hide/show state accordingly, and toggle `pointer-events` between `none` (Hidden_State) and `auto` (Visible_State), but with all transition durations set to 0.
3. IF both the `prefers-reduced-motion: reduce` setting and low-performance detection are active simultaneously, THEN THE Floating_Search_Bar SHALL apply duration 0 (the behaviors are additive and non-conflicting).

### Requirement 8: Non-Interference with Existing Behavior

**User Story:** As a user, I want the scroll-hide feature to work alongside the existing search bar functionality without breaking anything.

#### Acceptance Criteria

1. WHILE the Floating_Search_Bar is in Visible_State, THE Floating_Search_Bar SHALL retain all existing tap-to-expand and command menu activation behavior (expansion animation followed by `open-command-menu` event dispatch) without modification.
2. IF the user taps the Floating_Search_Bar while it is animating from Hidden_State to Visible_State, THEN THE Floating_Search_Bar SHALL complete the show transition and then process the tap activation (trigger expansion animation and open Command_Menu).
3. IF the user taps the Floating_Search_Bar while it is animating from Visible_State to Hidden_State, THEN THE Floating_Search_Bar SHALL cancel the hide transition, return to Visible_State, and then process the tap activation (trigger expansion animation and open Command_Menu).
4. WHILE the Command_Menu is open, THE Floating_Search_Bar SHALL not respond to scroll direction changes and SHALL remain in whichever state (Visible_State or Hidden_State) it was in at the moment the Command_Menu opened.
5. WHEN the Floating_Search_Bar entrance animation (initial mount) completes, THE Floating_Search_Bar SHALL enable the scroll-based hide/show logic; any scroll events occurring before entrance completion SHALL be ignored by the scroll-hide system.
6. WHILE the viewport is in Mobile_Mode, THE scroll-hide behavior SHALL be active; WHILE the viewport is in Desktop_Mode, THE Floating_Search_Bar SHALL not be rendered and no scroll event listeners SHALL be attached.
