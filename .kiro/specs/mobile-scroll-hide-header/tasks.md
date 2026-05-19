# Implementation Plan: Mobile Scroll Hide Header

## Overview

This plan converts the existing `Header` server component into a client component with scroll-driven hide/show behavior on mobile viewports. The implementation reuses the existing `useScrollDirection` hook, adds Framer Motion translateY animation, and respects reduced motion and low-performance preferences. On desktop, the header remains sticky with no scroll-hide logic.

## Tasks

- [x] 1. Convert Header to client component with scroll-hide constants
  - [x] 1.1 Add `"use client"` directive and export animation constants in `components/layout/header.tsx`
    - Add `"use client"` at the top of the file
    - Import `motion` and `Transition` type from `framer-motion`
    - Import `useIsMobile` from `@/hooks/use-is-mobile`
    - Import `useReducedMotion` from `@/hooks/use-reduced-motion`
    - Import `useLowPerformance` from `@/hooks/use-low-performance`
    - Import `useScrollDirection` from `@/hooks/use-scroll-direction`
    - Import `DURATION` and `EASING` from `@/lib/motion`
    - Export `HEADER_HIDE_DISPLACEMENT = -68` constant
    - Export `HEADER_SCROLL_THRESHOLD = 10` constant
    - Export `headerHideTransition: Transition` (duration: `DURATION.normal`, ease: `EASING.exit`)
    - Export `headerShowTransition: Transition` (duration: `DURATION.normal`, ease: `EASING.entrance`)
    - _Requirements: 1.2, 1.4, 3.1, 3.2, 3.5, 7.3_

  - [ ]* 1.2 Write property tests for animation constraints (`__tests__/mobile-scroll-hide-header/animation-constraints.property.test.ts`)
    - **Property 5: Animation duration and easing bounds** — verify hide transition has duration 150–300ms with ease-in, show transition has duration 150–300ms with ease-out
    - **Property 6: Only transform is animated** — verify no layout-triggering properties (`width`, `height`, `top`, `bottom`, `left`, `right`, `margin`, `padding`) are present in hide/show animation config
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [ ]* 1.3 Write property test for hide displacement bounds (`__tests__/mobile-scroll-hide-header/hide-displacement-bounds.property.test.ts`)
    - **Property 8: Hide displacement fully removes header from viewport** — verify absolute value of `HEADER_HIDE_DISPLACEMENT` is ≥ 65 (height 64px + border 1px)
    - **Validates: Requirements 1.2, 3.5**

- [x] 2. Implement scroll-hide behavior in Header component
  - [x] 2.1 Integrate `useScrollDirection` and visibility logic into `Header`
    - Consume `useScrollDirection({ threshold: HEADER_SCROLL_THRESHOLD })`
    - Consume `useIsMobile()`, `useReducedMotion()`, `useLowPerformance()`
    - Derive `isScrollHidden = isMobile && scrollDirection === "down"`
    - Determine `pointerEvents`: `"none"` when hidden, `"auto"` when visible
    - Determine transition: duration 0 when `prefersReducedMotion || isLowPerf`, otherwise `headerHideTransition` / `headerShowTransition` based on state
    - Replace `<header>` with `<motion.header>`
    - Add `animate={{ y: isScrollHidden ? HEADER_HIDE_DISPLACEMENT : 0 }}`
    - Add `transition={scrollTransition}` prop
    - Add `style={{ pointerEvents }}` prop
    - On mobile: use `fixed top-0 left-0 right-0 z-40` positioning
    - On desktop: keep `sticky top-0 z-40` positioning (use responsive classes: `fixed md:sticky md:left-auto md:right-auto`)
    - Preserve all existing child components (`MobileSidebar`, `SearchTrigger`, `UserMenu`) unchanged
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.4, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 6.1, 6.2, 6.3, 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 2.2 Write property tests for direction-to-visibility mapping (`__tests__/mobile-scroll-hide-header/direction-visibility-mapping.property.test.ts`)
    - **Property 1: Direction-to-visibility mapping** — verify that `"down"` on mobile → Hidden_State (translateY = HEADER_HIDE_DISPLACEMENT), `"up"` or `null` → Visible_State (translateY = 0)
    - **Property 3: Scroll-top forces visible** — verify that when scrollDirection is `null`, header is in Visible_State
    - **Property 4: Desktop viewport disables scroll-hide** — verify that when `isMobile` is false, header is always in Visible_State regardless of scroll direction
    - **Validates: Requirements 1.1, 1.5, 2.1, 2.2, 4.1, 4.4, 7.4**

  - [ ]* 2.3 Write property tests for pointer-events state (`__tests__/mobile-scroll-hide-header/pointer-events-state.property.test.ts`)
    - **Property 2: Pointer-events follows visibility state** — verify Hidden_State has `pointer-events: none` and Visible_State has `pointer-events: auto`
    - **Validates: Requirements 1.3, 2.3**

  - [ ]* 2.4 Write property tests for degraded mode (`__tests__/mobile-scroll-hide-header/degraded-mode-duration.property.test.ts`)
    - **Property 7: Degraded mode applies zero duration** — verify that when reduced motion or low-performance is active, transition duration is 0 while visibility state and pointer-events still update correctly
    - **Validates: Requirements 5.1, 5.2, 6.1, 6.2, 6.3**

- [x] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Write unit and integration tests
  - [x] 4.1 Write unit tests for Header component (`__tests__/mobile-scroll-hide-header/header.test.tsx`)
    - Test Header renders with `sticky top-0 z-40` classes on desktop
    - Test Header renders with `fixed top-0` positioning on mobile
    - Test `HEADER_HIDE_DISPLACEMENT` absolute value ≥ 65 (height + border)
    - Test `HEADER_SCROLL_THRESHOLD` is between 8 and 20
    - Test `headerHideTransition` has ease-in easing
    - Test `headerShowTransition` has ease-out easing
    - Test duration is 0 when `prefersReducedMotion` is true
    - Test duration is 0 when `isLowPerf` is true
    - Test `isScrollHidden` is false when `isMobile` is false
    - Test `pointer-events` is "none" when hidden
    - Test `pointer-events` is "auto" when visible
    - Test Header visible when scrollDirection is null
    - Test Header mounts in Visible_State with no entrance animation delay
    - Test Header maintains z-index 40 in both states
    - _Requirements: 1.2, 1.3, 1.4, 2.2, 2.3, 3.1, 3.2, 4.1, 5.1, 6.1, 7.4, 7.5_

  - [ ]* 4.2 Write integration tests for full scroll cycle (`__tests__/mobile-scroll-hide-header/scroll-hide-integration.test.tsx`)
    - Test full scroll down → hide → scroll up → show cycle on mobile
    - Test Header and FloatingSearchBar hide/show independently
    - Test desktop mode does not activate scroll-hide
    - Test viewport resize from mobile to desktop restores header immediately
    - Test mid-transition interruption starts from current position
    - Test runtime reduced-motion toggle takes effect on next scroll
    - Test both reduced-motion and low-perf active → duration 0
    - _Requirements: 1.1, 2.1, 2.4, 3.4, 4.4, 5.3, 6.3, 7.1_

- [x] 5. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The `useScrollDirection` hook already exists and requires no modifications
- All animation config reuses constants from `lib/motion.ts` for consistency
- The FloatingSearchBar component requires no modifications — both components independently consume `useScrollDirection`
- The Header uses negative Y translation (upward) unlike the FloatingSearchBar which uses positive Y (downward)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4"] },
    { "id": 3, "tasks": ["4.1", "4.2"] }
  ]
}
```
