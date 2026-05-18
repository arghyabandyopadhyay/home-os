# Implementation Plan: Mobile Floating Search

## Overview

Implement a `FloatingSearchBar` component that provides mobile users with a fixed-position, pill-shaped search button at the bottom of the viewport. The component uses Framer Motion for expand/collapse animations, communicates with the existing `CommandMenu` via window events, and conditionally renders only on mobile viewports via a `useIsMobile` hook.

## Tasks

- [x] 1. Create the useIsMobile hook and FloatingSearchBar component shell
  - [x] 1.1 Create the `useIsMobile` hook at `hooks/use-is-mobile.ts`
    - Implement a client-side hook using `window.matchMedia("(max-width: 767px)")`
    - Return `true` when viewport is below the md breakpoint (768px)
    - Listen for media query change events to update state dynamically
    - Default to `false` on initial render (SSR safety)
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 1.2 Create the `FloatingSearchBar` component shell at `components/layout/floating-search-bar.tsx`
    - Mark as `"use client"` component
    - Import `useIsMobile` hook and return `null` when not mobile
    - Render a `<button type="button">` with `aria-label="Search"`
    - Include a search icon (Lucide `Search`, 16–20px) and "Search" text in `text-app-muted`
    - Apply styling: `position: fixed`, `rounded-full`, `bg-app-surface`, `border-app`, `shadow-lg`
    - Set dimensions within 120–160px width, 40–48px height
    - Position at bottom center with `bottom: calc(24px + env(safe-area-inset-bottom))`, `left: 50%`, `translateX(-50%)`
    - Set z-index between 31 and 49 (above page content, below command menu overlay)
    - Add visible focus indicator: 2px solid outline with offset of at least 2px
    - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 5.2, 5.3, 5.4, 7.1, 7.2, 7.3_

- [x] 2. Implement expand/collapse animation and command menu integration
  - [x] 2.1 Add Framer Motion expand/collapse animation to `FloatingSearchBar`
    - Wrap the button with `motion.button` from Framer Motion
    - Define `resting` variant: `{ scaleX: 1, opacity: 1 }`
    - Define `expanded` variant: `{ scaleX: 1.75, opacity: 1 }`
    - On click/keyboard activation: set `isExpanded = true` to trigger expansion
    - Use ease-out easing for expansion, ease-in for collapse, duration 150–200ms
    - On `onAnimationComplete` of expansion: dispatch `window.dispatchEvent(new Event("open-command-menu"))`
    - Add a 250ms timeout fallback to dispatch the event if animation callback doesn't fire
    - Import and use `useReducedMotion()` — when active, skip animation and dispatch event immediately
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 7.4_

  - [x] 2.2 Add entrance animation to `FloatingSearchBar`
    - Define entrance variants: `hidden: { opacity: 0, y: 12 }`, `visible: { opacity: 1, y: 0 }`
    - Duration between 150–300ms with ease-out easing
    - Only animate `transform` and `opacity` properties
    - When reduced motion is active, render in final state immediately (duration 0)
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 2.3 Add `close-command-menu` event dispatch to `CommandMenu` and listen in `FloatingSearchBar`
    - In `components/layout/command-menu.tsx`: dispatch `window.dispatchEvent(new Event("close-command-menu"))` inside `handleOpenChange` when `nextOpen === false`
    - In `FloatingSearchBar`: listen for `close-command-menu` event to set `isExpanded = false` (triggers collapse)
    - If command menu is already open when user activates the bar, do not dispatch event and remain in resting state
    - _Requirements: 3.5, 4.2, 8.3_

- [x] 3. Integrate FloatingSearchBar into the app layout
  - [x] 3.1 Add `FloatingSearchBar` to `app/(app)/layout.tsx`
    - Import and render `FloatingSearchBar` inside the layout alongside `CommandMenu`
    - Ensure it does not interfere with existing desktop `SearchTrigger` (the bar only renders on mobile via the hook)
    - Verify positioning does not overlap with `FloatingToolbar` (minimum 16px distance from interactive elements)
    - _Requirements: 1.1, 8.1, 8.2, 8.4_

- [x] 4. Checkpoint - Verify core functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Write property-based tests for FloatingSearchBar
  - [x]* 5.1 Write property test for viewport-conditional rendering
    - **Property 1: Viewport-conditional rendering**
    - **Validates: Requirements 1.1, 1.2, 1.3**
    - Test file: `__tests__/mobile-floating-search/viewport-conditional-rendering.property.test.ts`
    - For any viewport width < 768px, the component should render; for >= 768px, it should not be in the DOM

  - [x]* 5.2 Write property test for animation properties
    - **Property 2: All animations only use transform and opacity**
    - **Validates: Requirements 3.2, 6.2**
    - Test file: `__tests__/mobile-floating-search/animation-properties.property.test.ts`
    - For any animation variant or transition config, only `transform` and `opacity` are animated

  - [x]* 5.3 Write property test for expansion/collapse duration bounds
    - **Property 3: Expansion and collapse duration within bounds**
    - **Validates: Requirements 3.1, 3.5**
    - Test file: `__tests__/mobile-floating-search/expansion-duration-bounds.property.test.ts`
    - Duration must be 150–200ms, expansion uses ease-out, collapse uses ease-in

  - [x]* 5.4 Write property test for entrance animation config
    - **Property 4: Entrance animation config within bounds**
    - **Validates: Requirements 6.1**
    - Test file: `__tests__/mobile-floating-search/entrance-animation-bounds.property.test.ts`
    - Initial state: opacity 0, translateY 12px; final: opacity 1, translateY 0; duration 150–300ms; ease-out

  - [x]* 5.5 Write property test for z-index range
    - **Property 5: Z-index within valid range**
    - **Validates: Requirements 5.3, 8.3**
    - Test file: `__tests__/mobile-floating-search/z-index-range.property.test.ts`
    - Z-index must be > 30 and < 50

- [x] 6. Write unit tests for FloatingSearchBar
  - [x]* 6.1 Write unit tests for component behavior
    - Test file: `__tests__/mobile-floating-search/floating-search-bar.test.tsx`
    - Test: renders search icon and "Search" text in resting state
    - Test: has `aria-label="Search"` on button element
    - Test: uses `<button type="button">` element
    - Test: dispatches `open-command-menu` event on activation
    - Test: does not dispatch event when command menu is already open
    - Test: skips animation and dispatches immediately when reduced motion is active
    - Test: keyboard activation (Enter/Space) triggers expansion
    - Test: not rendered in DOM at desktop viewport widths
    - Test: focus indicator has outline with offset
    - _Requirements: 2.1, 3.3, 3.4, 4.1, 4.2, 7.1, 7.2, 7.3, 7.4, 8.2_

- [x] 7. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript with Framer Motion, matching the existing project patterns
- The `close-command-menu` event addition to `CommandMenu` is a minimal change to enable bidirectional communication

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2"] },
    { "id": 2, "tasks": ["2.1", "2.2"] },
    { "id": 3, "tasks": ["2.3", "3.1"] },
    { "id": 4, "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "6.1"] }
  ]
}
```
