# Implementation Plan: Mobile Scroll Hide Search

## Overview

This plan implements scroll-driven hide/show behavior for the `FloatingSearchBar` on mobile viewports. The implementation introduces a `useScrollDirection` hook and modifies the existing `FloatingSearchBar` component to consume it. The approach uses passive scroll listeners, rAF throttling, and transform-only animation via Framer Motion.

## Tasks

- [x] 1. Create the `useScrollDirection` hook
  - [x] 1.1 Implement `useScrollDirection` hook in `hooks/use-scroll-direction.ts`
    - Create the hook with `ScrollDirection` type (`"up" | "down" | null`)
    - Accept `UseScrollDirectionOptions` with optional `threshold` (default: 10, constrained to 8–20px)
    - Register scroll listener with `{ passive: true }`
    - Throttle reads via `requestAnimationFrame` (one read per frame max, use `ticking` ref guard)
    - Track `previousScrollY`, `accumulatedDelta`, `currentDirection` in refs
    - Reset `accumulatedDelta` to 0 on direction reversal
    - Only update returned direction state when `|accumulatedDelta| > threshold`
    - When `scrollY === 0`, force direction to `null` (maps to visible in consumer)
    - Return `null` on initial mount (no scroll occurred)
    - Clean up listener via `removeEventListener` and cancel pending rAF via `cancelAnimationFrame` on unmount
    - Export `ScrollDirection` type and `UseScrollDirectionOptions` interface for testing
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 2.2, 2.5_

  - [ ]* 1.2 Write property tests for scroll direction detection (`__tests__/mobile-scroll-hide-search/scroll-direction-mapping.property.test.ts`)
    - **Property 1: Direction-to-visibility mapping** — verify that accumulated delta exceeding threshold in downward direction returns `"down"`, upward returns `"up"`, and no threshold exceeded returns `null`
    - **Property 3: Scroll-top forces visible** — verify that when scrollY equals 0, direction resets to `null` allowing visible state
    - **Property 4: Direction reversal resets accumulated delta** — verify that reversing direction resets delta to 0 and requires threshold to be exceeded again
    - **Property 5: Sub-threshold scrolls produce no state change** — verify that deltas below threshold do not change direction
    - **Validates: Requirements 1.1, 2.1, 2.2, 2.5, 4.3, 1.4, 1.5, 4.5**

  - [ ]* 1.3 Write property test for rAF throttling (`__tests__/mobile-scroll-hide-search/raf-throttling.property.test.ts`)
    - **Property 11: rAF throttling limits reads to one per frame** — verify that for any burst of N scroll events within a single animation frame, at most one scrollY read occurs via the rAF callback
    - **Validates: Requirements 4.2**

  - [ ]* 1.4 Write unit tests for `useScrollDirection` (`__tests__/mobile-scroll-hide-search/use-scroll-direction.test.ts`)
    - Test initial state is `null` on mount
    - Test default threshold is between 8 and 20
    - Test cleanup removes listener and cancels rAF
    - Test passive listener option is set
    - _Requirements: 4.1, 4.4, 4.6, 1.4_

- [x] 2. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Modify `FloatingSearchBar` to integrate scroll-hide behavior
  - [x] 3.1 Add hide/show transition exports and constants to `components/layout/floating-search-bar.tsx`
    - Import `DURATION` and `EASING` from `@/lib/motion`
    - Export `hideTransition: Transition` (duration: `DURATION.normal`, ease: `EASING.exit`)
    - Export `showTransition: Transition` (duration: `DURATION.normal`, ease: `EASING.entrance`)
    - Export `HIDE_DISPLACEMENT = 78` constant (height 44 + bottom offset 24 + shadow ~10)
    - Export `SCROLL_THRESHOLD = 10` constant (default threshold in pixels)
    - _Requirements: 3.1, 3.2, 3.6, 1.2, 1.4_

  - [x] 3.2 Integrate `useScrollDirection` and visibility state into `FloatingSearchBar`
    - Import and consume `useScrollDirection({ threshold: SCROLL_THRESHOLD })`
    - Import and consume `useLowPerformance()` hook
    - Add `entranceComplete` state (boolean), set to `true` via `onAnimationComplete` on entrance motion.div
    - Derive `isScrollHidden` from direction: `"down"` → hidden, `"up"` or `null` → visible
    - Gate scroll-hide: disable while `entranceComplete === false` OR `commandMenuOpen === true` OR `!isMobile`
    - Apply `pointer-events: none` style when hidden, `pointer-events: auto` when visible
    - Animate outer container `translateY` between `0` (visible) and `+HIDE_DISPLACEMENT` (hidden)
    - When `prefersReducedMotion || isLowPerf`, use `{ duration: 0 }` for hide/show transition
    - Otherwise use `hideTransition` / `showTransition` based on direction
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 3.4, 4.6, 6.1, 6.2, 7.1, 7.2, 8.4, 8.5, 8.6_

  - [x] 3.3 Handle tap interactions during hide/show transitions
    - On tap during hide transition: cancel hide, return to visible, then process activation
    - On tap during show transition: complete show, then process activation
    - Ensure existing tap-to-expand and command menu activation behavior is preserved in Visible_State
    - Framer Motion handles mid-transition interruption natively (new `animate` values start from current position)
    - _Requirements: 8.1, 8.2, 8.3, 2.4, 3.5_

  - [ ]* 3.4 Write property tests for pointer-events visibility (`__tests__/mobile-scroll-hide-search/pointer-events-visibility.property.test.ts`)
    - **Property 2: Pointer-events follows visibility state** — verify that Hidden_State has `pointer-events: none` and Visible_State has `pointer-events: auto`
    - **Validates: Requirements 1.3, 2.3**

  - [ ]* 3.5 Write property tests for animation constraints (`__tests__/mobile-scroll-hide-search/animation-constraints.property.test.ts`)
    - **Property 6: Animation duration and easing bounds** — verify hide transition has duration 150–300ms with ease-in, show transition has duration 150–300ms with ease-out
    - **Property 7: Only transform and opacity are animated** — verify no layout-triggering properties (`width`, `height`, `top`, `bottom`, `left`, `right`, `margin`, `padding`) are present in hide/show animation config
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 3.6 Write property tests for degraded mode (`__tests__/mobile-scroll-hide-search/degraded-mode-duration.property.test.ts`)
    - **Property 8: Degraded mode applies zero duration** — verify that when reduced motion or low-performance is active, transition duration is 0 while visibility state and pointer-events still update correctly
    - **Validates: Requirements 3.4, 6.1, 6.2, 7.1, 7.2, 7.3**

  - [ ]* 3.7 Write property tests for scroll-hide gating (`__tests__/mobile-scroll-hide-search/scroll-hide-gating.property.test.ts`)
    - **Property 9: Command menu open pauses scroll-hide** — verify visibility state does not change while command menu is open
    - **Property 10: Entrance gate blocks scroll-hide** — verify scroll-hide does not activate before entrance animation completes
    - **Validates: Requirements 8.4, 8.5**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Verify header sticky preservation and write integration tests
  - [x] 5.1 Write unit tests verifying header is unaffected (`__tests__/mobile-scroll-hide-search/header-preservation.test.ts`)
    - Verify Header component renders with `sticky top-0 z-40` classes
    - Verify Header is not affected by scroll-hide logic
    - Verify Header remains fully visible and interactive during scroll
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 5.2 Write integration tests for full scroll cycle (`__tests__/mobile-scroll-hide-search/scroll-hide-integration.test.tsx`)
    - Test full scroll down → hide → scroll up → show cycle
    - Test existing tap-to-expand behavior works in Visible_State
    - Test desktop mode does not attach listeners
    - Test mid-transition interruption starts from current position
    - Test runtime reduced-motion toggle takes effect on next scroll
    - Test both reduced-motion and low-perf active → duration 0
    - _Requirements: 1.1, 2.1, 8.1, 8.6, 3.5, 6.3, 7.3_

- [x] 6. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The `useScrollDirection` hook follows the same pattern as existing hooks (`useReducedMotion`, `useLowPerformance`)
- All animation config reuses constants from `lib/motion.ts` for consistency
- The Header component requires no modifications — only verification tests

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "3.1"] },
    { "id": 2, "tasks": ["3.2"] },
    { "id": 3, "tasks": ["3.3", "3.4", "3.5", "3.6", "3.7"] },
    { "id": 4, "tasks": ["5.1", "5.2"] }
  ]
}
```
