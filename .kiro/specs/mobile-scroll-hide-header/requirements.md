# Requirements Document

## Introduction

This feature adds scroll-driven hide/show behavior to the existing `Header` component on mobile viewports (below 768px). When the user scrolls down, the header translates upward off-screen. When the user scrolls up (or reaches the top of the page), it slides back into view. This mirrors the existing `FloatingSearchBar` scroll-hide pattern but in the opposite direction (negative Y translation since the header is at the top). The implementation reuses the existing `useScrollDirection` hook, converts the Header to a client component, and uses Framer Motion for transform-only animation. The feature respects reduced motion preferences and degrades gracefully on low-performance devices.

## Glossary

- **Header**: The existing navigation bar component (`Header` in `components/layout/header.tsx`) rendered at the top of the app viewport, containing the mobile sidebar toggle, search trigger, and user menu.
- **Floating_Search_Bar**: The existing fixed-position pill-shaped search button rendered at the bottom center of the viewport on mobile screens (independent component, unchanged by this feature).
- **Scroll_Direction_Hook**: The existing `useScrollDirection` custom hook that tracks the user's vertical scroll direction using passive scroll listeners and requestAnimationFrame throttling.
- **Visible_State**: The default state of the Header where it is fully on-screen at its normal top position (translateY = 0).
- **Hidden_State**: The state of the Header where it has been translated upward off the visible viewport (translateY = HEADER_HIDE_DISPLACEMENT).
- **HEADER_HIDE_DISPLACEMENT**: The negative translateY value (-68px) applied to the Header in Hidden_State, calculated as height (64px) + border (1px) + shadow buffer (3px).
- **Scroll_Threshold**: A minimum scroll distance (in pixels) the user must travel in one direction before the hide/show behavior triggers, preventing jitter from small scroll movements.
- **Mobile_Mode**: The viewport state when the screen width is below the `md` Tailwind breakpoint (less than 768px).
- **Desktop_Mode**: The viewport state when the screen width is at or above the `md` Tailwind breakpoint (768px or greater).

## Requirements

### Requirement 1: Hide on Scroll Down

**User Story:** As a mobile user, I want the header to move out of view when I scroll down, so that it does not obstruct the content I am reading and I have more visible screen space.

#### Acceptance Criteria

1. WHEN the user scrolls down by more than the Scroll_Threshold in Mobile_Mode, THE Header SHALL transition from Visible_State to Hidden_State by translating upward off-screen (negative Y direction).
2. THE Header in Hidden_State SHALL be translated along the Y-axis by HEADER_HIDE_DISPLACEMENT (-68px), which is at least the sum of its rendered height (64px) and its border width (1px), so that no part of the element is visible within the viewport.
3. WHILE the Header is in Hidden_State, THE Header SHALL have `pointer-events: none` so that it does not intercept touch events on underlying content.
4. THE Header SHALL use a Scroll_Threshold between 8px and 20px to prevent the hide transition from triggering on incidental micro-scrolls.
5. IF the Header is already in Hidden_State when a subsequent scroll-down event exceeds the Scroll_Threshold, THEN THE Header SHALL remain in Hidden_State without re-triggering the hide transition.

### Requirement 2: Show on Scroll Up

**User Story:** As a mobile user, I want the header to reappear when I scroll up, so that I can quickly access navigation controls without scrolling back to the top.

#### Acceptance Criteria

1. WHEN the user scrolls up by more than the Scroll_Threshold in Mobile_Mode while the Header is in Hidden_State, THE Header SHALL transition from Hidden_State to Visible_State by translating back to its original top position (translateY = 0).
2. WHEN the user reaches the top of the scrollable content (scrollY equals 0), THE Header SHALL be in Visible_State regardless of the previous scroll direction or current state.
3. THE Header in Visible_State SHALL have `pointer-events: auto` so that it is fully interactive.
4. WHEN the user reverses scroll direction from up to down while the Header is transitioning to Visible_State, THE Header SHALL cancel the in-progress show transition and begin transitioning to Hidden_State from its current translateY position.
5. WHEN the user reverses scroll direction (from up to down or down to up), THE Scroll_Direction_Hook SHALL reset the accumulated scroll delta to 0 so that the Scroll_Threshold must be exceeded again in the new direction before triggering a state change.

### Requirement 3: Hide/Show Animation

**User Story:** As a user, I want the hide and show transitions to feel smooth and responsive, so that the header movement does not feel jarring or laggy.

#### Acceptance Criteria

1. WHEN the Header transitions from Visible_State to Hidden_State, THE Header SHALL animate using only the `transform` property (translateY) with a duration between 150ms and 300ms and ease-in easing.
2. WHEN the Header transitions from Hidden_State to Visible_State, THE Header SHALL animate using only the `transform` property (translateY) with a duration between 150ms and 300ms and ease-out easing.
3. THE Header SHALL not animate `width`, `height`, `top`, `bottom`, `left`, `right`, or any layout-triggering property during the hide/show transition.
4. IF a hide/show transition is in progress and the opposite transition is triggered, THEN THE Header SHALL begin the new transition from its current translateY position without snapping to the start or end of the interrupted transition.
5. THE hide transition displacement (absolute value of HEADER_HIDE_DISPLACEMENT) SHALL be at least the sum of the element height (64px) and border width (1px), totaling a minimum absolute translateY of 65px upward.

### Requirement 4: Mobile-Only Gating

**User Story:** As a desktop user, I want the header to remain permanently visible and sticky, so that I always have access to navigation controls without scroll-hide behavior interfering.

#### Acceptance Criteria

1. WHILE the viewport is in Desktop_Mode (width ≥ 768px), THE Header SHALL remain in Visible_State with `sticky` positioning, `top: 0`, and z-index 40, regardless of scroll direction.
2. WHILE the viewport is in Desktop_Mode, THE Header SHALL not attach scroll event listeners or consume the Scroll_Direction_Hook for hide/show purposes.
3. WHILE the viewport is in Mobile_Mode, THE Header SHALL use `fixed` positioning with `top: 0` and z-index 40, and the scroll-hide behavior SHALL be active.
4. WHEN the viewport transitions from Mobile_Mode to Desktop_Mode (e.g., device rotation or window resize), THE Header SHALL immediately return to Visible_State (translateY = 0) with no animation.

### Requirement 5: Reduced Motion Accessibility

**User Story:** As a user with motion sensitivity, I want the header to hide and show without animation, so that the movement does not cause discomfort.

#### Acceptance Criteria

1. WHILE the user has enabled the `prefers-reduced-motion: reduce` OS-level setting, THE Header SHALL apply duration 0 to all hide/show transitions, resulting in an instant state change with no visible intermediate animation frames.
2. WHILE the user has enabled the `prefers-reduced-motion: reduce` OS-level setting, THE Header SHALL still respond to scroll direction changes (hide on scroll down, show on scroll up) by immediately applying the final positional state and the corresponding `pointer-events` value (`none` in Hidden_State, `auto` in Visible_State) without animated movement.
3. WHILE the user has enabled the `prefers-reduced-motion: reduce` OS-level setting, IF the user toggles the OS reduced-motion preference at runtime, THEN THE Header SHALL adopt the new motion behavior (animated or instant) on the next scroll-triggered state change without requiring a page reload.

### Requirement 6: Low-Performance Device Degradation

**User Story:** As a user on a low-performance device, I want the scroll-hide behavior to degrade gracefully, so that the app remains responsive.

#### Acceptance Criteria

1. WHILE the device is detected as low-performance (via the `useLowPerformance` hook), THE Header SHALL apply duration 0 to all hide/show transitions so that the transform to the target position is applied immediately with no intermediate animation frames.
2. WHILE the device is detected as low-performance, THE Scroll_Direction_Hook SHALL continue to detect scroll direction using the same Scroll_Threshold, update the hide/show state accordingly, and toggle `pointer-events` between `none` (Hidden_State) and `auto` (Visible_State), but with all transition durations set to 0.
3. IF both the `prefers-reduced-motion: reduce` setting and low-performance detection are active simultaneously, THEN THE Header SHALL apply duration 0 (the behaviors are additive and non-conflicting).

### Requirement 7: Non-Interference with Existing Behavior

**User Story:** As a user, I want the header scroll-hide feature to work alongside the existing FloatingSearchBar scroll-hide and other header functionality without breaking anything.

#### Acceptance Criteria

1. THE Header scroll-hide behavior SHALL operate independently of the Floating_Search_Bar scroll-hide behavior; the visibility state of one component SHALL not affect the visibility state of the other.
2. WHILE the Header is in Visible_State, THE Header SHALL retain all existing child component functionality (MobileSidebar toggle, SearchTrigger, UserMenu) without modification.
3. THE Header and the Floating_Search_Bar SHALL use the same Scroll_Threshold value for consistent user experience when both components respond to the same scroll events.
4. WHEN the Header component mounts, THE Header SHALL render in Visible_State (translateY = 0) with no entrance animation delay.
5. THE Header SHALL maintain z-index 40 in both Visible_State and Hidden_State to preserve correct layering with other UI elements.
