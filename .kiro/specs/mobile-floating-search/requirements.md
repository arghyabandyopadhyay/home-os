# Requirements Document

## Introduction

This feature adds a floating search bar that appears at the bottom center of the screen when the app is viewed on mobile devices (below the `md` breakpoint). Currently, the search trigger is hidden on mobile (`hidden sm:inline-flex`), leaving mobile users without a visible way to open the command menu. The floating search bar provides quick, thumb-friendly access to the existing command menu/search functionality. In its resting state, the bar is small and compact. When tapped, it expands wider with an animation before opening the command menu.

## Glossary

- **Floating_Search_Bar**: A fixed-position compact bar rendered at the bottom center of the viewport on mobile screens that displays a search icon and placeholder text, expands on activation, and opens the command menu.
- **Command_Menu**: The existing search and navigation dialog (`CommandMenu` component) that allows users to search content and navigate the app.
- **Mobile_Mode**: The viewport state when the screen width is below the `md` Tailwind breakpoint (less than 768px).
- **Desktop_Mode**: The viewport state when the screen width is at or above the `md` Tailwind breakpoint (768px or greater).
- **Safe_Area**: The device-specific inset area (e.g., iPhone home indicator region) that interactive elements must avoid overlapping.
- **Resting_State**: The default compact appearance of the Floating_Search_Bar before user interaction.
- **Expanded_State**: The wider appearance of the Floating_Search_Bar after the user taps it, displayed briefly before the Command_Menu opens.

## Requirements

### Requirement 1: Mobile Visibility

**User Story:** As a mobile user, I want a visible search bar on screen at all times, so that I can quickly access the command menu without needing a keyboard shortcut.

#### Acceptance Criteria

1. WHILE the viewport is in Mobile_Mode, THE Floating_Search_Bar SHALL be rendered in the DOM, visible, and use CSS `position: fixed` at the bottom center of the screen.
2. WHILE the viewport is in Desktop_Mode, THE Floating_Search_Bar SHALL not be rendered in the DOM.
3. WHEN the viewport transitions between Mobile_Mode and Desktop_Mode (e.g., device rotation or browser resize), THE Floating_Search_Bar SHALL immediately reflect the new viewport state without requiring a page reload.

### Requirement 2: Resting State Appearance

**User Story:** As a mobile user, I want the search bar to be small and unobtrusive in its resting state, so that it does not dominate the screen or distract from content.

#### Acceptance Criteria

1. THE Floating_Search_Bar in Resting_State SHALL render as a compact horizontal bar with a search icon (magnifying glass) on the left and placeholder text "Search" on the right.
2. THE Floating_Search_Bar in Resting_State SHALL have a width between 120px and 160px and a height between 40px and 48px.
3. THE Floating_Search_Bar in Resting_State SHALL use the app's semantic design tokens (`bg-app-surface`, `border-app`, `shadow-lg`) for consistent theming in both light and dark modes.
4. THE Floating_Search_Bar in Resting_State SHALL use `rounded-full` border-radius to create a pill shape.
5. THE Floating_Search_Bar in Resting_State SHALL display the search icon at a size between 16 and 20 CSS pixels and the placeholder text in `text-app-muted` style.

### Requirement 3: Expansion Animation

**User Story:** As a user, I want the search bar to expand smoothly when I tap it, so that the interaction feels responsive and intentional before the command menu opens.

#### Acceptance Criteria

1. WHEN the user activates the Floating_Search_Bar, THE Floating_Search_Bar SHALL animate from Resting_State width to Expanded_State width (between 240px and 280px) with a duration between 150ms and 200ms and ease-out easing.
2. THE Floating_Search_Bar SHALL only animate `transform` (scaleX) and `opacity` properties during the expansion transition.
3. WHEN the expansion animation completes, THE Floating_Search_Bar SHALL dispatch an `open-command-menu` window event, causing the Command_Menu to become visible.
4. WHILE the user has enabled the `prefers-reduced-motion: reduce` OS-level setting, THE Floating_Search_Bar SHALL skip the expansion animation and dispatch the `open-command-menu` event immediately upon activation.
5. WHEN the Command_Menu closes, THE Floating_Search_Bar SHALL return to Resting_State width with a duration between 150ms and 200ms and ease-in easing.

### Requirement 4: Command Menu Activation

**User Story:** As a mobile user, I want to tap the floating search bar to open the command menu, so that I can search my content and navigate the app.

#### Acceptance Criteria

1. WHEN the expansion animation completes, THE Floating_Search_Bar SHALL dispatch an `open-command-menu` window event using the same event dispatch mechanism as the existing desktop SearchTrigger component.
2. IF the Command_Menu is already open when the user activates the Floating_Search_Bar, THEN THE Floating_Search_Bar SHALL not dispatch the event and shall remain in Resting_State.

### Requirement 5: Positioning and Layout

**User Story:** As a mobile user, I want the search bar positioned within easy thumb reach, so that I can use it comfortably with one hand.

#### Acceptance Criteria

1. THE Floating_Search_Bar SHALL be positioned with `position: fixed`, a bottom offset of 24px (plus the device Safe_Area bottom inset), and centered horizontally using `left: 50%` with `translateX(-50%)`.
2. THE Floating_Search_Bar SHALL apply `padding-bottom: env(safe-area-inset-bottom)` or equivalent offset to its bottom position so that it does not overlap with system UI elements (e.g., iPhone home indicator) on devices with non-zero Safe_Area insets.
3. THE Floating_Search_Bar SHALL use a z-index value greater than 30 (above page content and the FloatingToolbar) and less than 50 (below the Command_Menu overlay and other dialog overlays).
4. IF the device does not report Safe_Area insets, THEN THE Floating_Search_Bar bottom offset SHALL resolve to 24px with no additional inset spacing.

### Requirement 6: Entrance Animation

**User Story:** As a user, I want the search bar to appear smoothly, so that it does not feel jarring.

#### Acceptance Criteria

1. WHEN the Floating_Search_Bar enters the viewport, THE Floating_Search_Bar SHALL animate from opacity 0 and translateY of 12px to opacity 1 and translateY of 0px with a duration between 150ms and 300ms and ease-out easing.
2. THE Floating_Search_Bar SHALL only animate `transform` and `opacity` properties during the entrance transition.
3. WHILE the user has enabled the `prefers-reduced-motion: reduce` OS-level setting, THE Floating_Search_Bar SHALL render in its final visible state (opacity 1, translateY 0) with duration 0 and no intermediate animation frames.

### Requirement 7: Accessibility

**User Story:** As a user relying on assistive technology, I want the floating search bar to be fully accessible, so that I can use it with a screen reader or keyboard.

#### Acceptance Criteria

1. THE Floating_Search_Bar SHALL have an `aria-label` of "Search" to describe its action to screen readers.
2. THE Floating_Search_Bar SHALL be focusable via keyboard Tab navigation and display a visible focus indicator consisting of a 2px solid outline with at least 3:1 contrast ratio against adjacent background colors and an outline-offset of at least 2px.
3. THE Floating_Search_Bar SHALL use a `<button>` element with `type="button"`.
4. WHEN the Floating_Search_Bar has focus and the user presses Enter or Space, THE Floating_Search_Bar SHALL activate and trigger the expansion animation followed by opening the Command_Menu.

### Requirement 8: Non-Interference

**User Story:** As a user, I want the floating search bar to not obstruct important content, so that I can still read and interact with the page.

#### Acceptance Criteria

1. THE Floating_Search_Bar SHALL be positioned such that no part of its bounding box overlaps with the FloatingToolbar component's bounding box when both are visible simultaneously.
2. THE Floating_Search_Bar SHALL not intercept pointer events or keyboard focus that would otherwise reach the desktop SearchTrigger component.
3. WHILE the Command_Menu is open, THE Floating_Search_Bar SHALL render at a z-index lower than the Command_Menu overlay so that it is not interactive or visually above the overlay.
4. THE Floating_Search_Bar SHALL maintain a minimum distance of 16px from the nearest edge of any interactive page content (links, buttons, form inputs) to prevent accidental activation of adjacent elements.
