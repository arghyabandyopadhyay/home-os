# Implementation Plan: Immersive Mobile UX

## Overview

This plan implements the immersive mobile experience for Home OS — a MobileShell layout system with scroll-aware chrome visibility, safe-area handling, bottom navigation, dynamic viewport management, and comprehensive iOS Safari quirks handling. The implementation builds on existing hooks (`useScrollDirection`, `useIsMobile`, `useReducedMotion`, `useLowPerformance`) and the Framer Motion animation system already in place.

All components use TypeScript with React 19, Framer Motion for GPU-accelerated transforms, and integrate with the existing app layout at `app/(app)/layout.tsx`.

## Tasks

- [x] 1. Implement SafeAreaContainer component
  - [x] 1.1 Create `components/layout/safe-area-container.tsx` with edge-to-padding mapping
    - Define `SafeAreaEdge` type and `SafeAreaContainerProps` type
    - Implement edge-to-`env(safe-area-inset-*)` padding mapping logic
    - Handle `edges` prop: undefined → all insets, empty array → no insets, specific values → those insets only
    - Support `as` prop for polymorphic rendering (default: `div`)
    - Append `className` after safe-area styles
    - Render `children` as content
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10_

  - [ ]* 1.2 Write property test for SafeAreaContainer edge-to-padding mapping
    - **Property 1: SafeAreaContainer edge-to-padding mapping**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**
    - Create `__tests__/immersive-mobile-ux/safe-area-edge-mapping.property.test.ts`
    - Generate random subsets of edges and verify exactly the corresponding padding values are applied

- [x] 2. Implement useImmersiveViewport hook
  - [x] 2.1 Create `hooks/use-immersive-viewport.ts` with viewport state management
    - Return `viewportHeight` from `window.visualViewport.height` (fallback: `window.innerHeight`)
    - Return `isKeyboardOpen` (true when visual viewport ≥ 150px smaller than layout viewport)
    - Return `isStandalone` (true when `display-mode: standalone` or `navigator.standalone`)
    - Return `orientation` ("portrait" or "landscape")
    - Throttle resize callbacks via `requestAnimationFrame` (one update per frame)
    - Debounce orientation change by 100ms
    - Use passive event listeners for all viewport events
    - Clean up all listeners on unmount
    - Return safe SSR defaults when `window` is undefined
    - Synchronously measure on mount before events fire
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11_

  - [ ]* 2.2 Write property test for keyboard detection threshold
    - **Property 8: Keyboard detection threshold**
    - **Validates: Requirements 4.2, 7.5**
    - Create `__tests__/immersive-mobile-ux/keyboard-detection-threshold.property.test.ts`
    - Generate random viewport height pairs and verify `isKeyboardOpen` is true iff difference ≥ 150px

- [x] 3. Implement BottomNav component
  - [x] 3.1 Create `components/layout/bottom-nav.tsx` with scroll-hide behavior
    - Render only on mobile (< 768px), return `null` on desktop
    - Fixed position at bottom with `env(safe-area-inset-bottom)` padding
    - Accept `items: NavItem[]` prop (max 5 items, min 44x44px touch targets)
    - Read chrome visibility from ImmersiveContext
    - Use Framer Motion `animate` prop: `translateY("100%")` when hidden, `translateY(0)` when visible
    - Set `pointer-events: none` when hidden
    - Set `aria-hidden="true"` when hidden, `aria-hidden="false"` when visible
    - Apply `role="navigation"` and `aria-label="Main navigation"`
    - Each nav item gets descriptive `aria-label` (e.g., "Navigate to Dashboard")
    - Respect reduced motion and low-performance (duration: 0)
    - Apply `will-change: transform` during transitions, remove after 500ms idle
    - Set CSS custom property `--bottom-nav-height` for content area calculations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 14.1, 14.2, 14.3, 14.6_

  - [ ]* 3.2 Write property test for chrome visibility determines pointer-events and aria-hidden
    - **Property 3: Chrome visibility determines pointer-events and aria-hidden**
    - **Validates: Requirements 3.6, 14.2, 14.3**
    - Create `__tests__/immersive-mobile-ux/chrome-pointer-events-aria.property.test.ts`
    - Generate random chrome visibility states and verify pointer-events/aria-hidden mapping

  - [ ]* 3.3 Write property test for BottomNav touch targets minimum size
    - **Property 16: BottomNav touch targets minimum size**
    - **Validates: Requirements 3.8**
    - Create `__tests__/immersive-mobile-ux/touch-targets-minimum.property.test.ts`
    - Generate random NavItem arrays and verify all rendered items have ≥ 44x44px touch targets

  - [ ]* 3.4 Write property test for BottomNav items have descriptive aria-labels
    - **Property 17: BottomNav items have descriptive aria-labels**
    - **Validates: Requirements 14.6**
    - Create `__tests__/immersive-mobile-ux/nav-items-aria-labels.property.test.ts`
    - Generate random NavItem arrays and verify all items have non-empty aria-label attributes

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement MobileShell layout component
  - [x] 5.1 Create `components/layout/mobile-shell.tsx` with ImmersiveContext and state machine
    - Define `ImmersiveState` type ("chrome-visible" | "chrome-hidden" | "keyboard-open")
    - Define `ImmersiveContextValue` type and create React context with provider
    - Implement state machine: chrome-visible ↔ chrome-hidden ↔ keyboard-open
    - Wrap content in `100dvh` container on mobile (< 768px)
    - Pass through to desktop layout when viewport ≥ 768px
    - Set initial state to "chrome-visible" on mount
    - Handle null/undefined children gracefully (render empty container)
    - Expose `useImmersiveContext()` hook for descendants
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6_

  - [x] 5.2 Add scroll-direction-based chrome visibility orchestration to MobileShell
    - Consume `useScrollDirection` hook output
    - When direction is "down" → set state to "chrome-hidden"
    - When direction is "up" or null → set state to "chrome-visible"
    - When `scrollY === 0` → force "chrome-visible"
    - Suppress chrome changes when keyboard is open
    - Suppress chrome changes during iOS overscroll bounce (scrollY < 0 or > max)
    - Suppress chrome changes during Safari toolbar animation (300ms window of rapid viewport resizes)
    - _Requirements: 1.5, 7.6, 8.1, 8.3, 11.1, 11.2_

  - [x] 5.3 Add dynamic viewport height management to MobileShell
    - Set `--app-viewport-height` CSS custom property on `document.documentElement`
    - Update from `window.visualViewport.height` (fallback: `window.innerHeight`)
    - Throttle updates to one per animation frame
    - Use `100dvh` as primary height unit; fall back to `--app-viewport-height`, then `100vh`
    - In PWA standalone mode: use `100vh` directly, skip browser chrome compensation
    - Apply all four safe-area insets in PWA standalone mode
    - Set status bar area background to `bg-app-surface` in standalone mode
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 9.1, 9.2, 9.3_

  - [x] 5.4 Add keyboard visibility handling to MobileShell
    - Consume `isKeyboardOpen` from `useImmersiveViewport`
    - When keyboard opens: hide BottomNav instantly (duration: 0), update `--app-viewport-height`
    - When keyboard closes: restore BottomNav based on current scroll direction, restore viewport height
    - Suppress scroll-direction chrome changes while keyboard is open
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x] 5.5 Add scroll position preservation (ScrollPositionManager) to MobileShell
    - Implement LRU cache (Map) with max 20 entries keyed by pathname (excluding query/hash)
    - Store scroll offset on route exit (client-side navigation)
    - Restore scroll offset on route enter (after content mounts and is tall enough)
    - Cap restored position at max scrollable height
    - Start at scroll position 0 for new routes
    - Clear cache on hard refresh / full page reload
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 5.6 Add orientation change handling to MobileShell
    - Recalculate `--app-viewport-height` on orientation change
    - Preserve chrome visibility state across orientation changes
    - Re-read safe-area inset values on orientation change
    - Debounce orientation handling by 100ms
    - If keyboard is open during orientation change: close keyboard state first, then apply adjustments
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 5.7 Add animation performance optimizations to MobileShell
    - Use only `transform` and `opacity` for all chrome animations
    - Apply `will-change: transform` during transitions
    - Remove `will-change` after 500ms idle
    - Disable all animations when `useLowPerformance()` or `useReducedMotion()` is true (duration: 0)
    - Use Framer Motion `animate` prop for interruptible animations (no animation debt)
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 11.3, 11.4_

  - [ ]* 5.8 Write property test for chrome visibility state machine
    - **Property 2: Chrome visibility state machine**
    - **Validates: Requirements 1.5, 3.3, 3.4, 3.11**
    - Create `__tests__/immersive-mobile-ux/chrome-visibility-state-machine.property.test.ts`
    - Generate random sequences of scroll directions and verify state transitions

  - [ ]* 5.9 Write property test for reduced motion and low-performance disable animations
    - **Property 4: Reduced motion and low-performance disable animations**
    - **Validates: Requirements 3.9, 3.10, 13.4, 14.5**
    - Create `__tests__/immersive-mobile-ux/reduced-motion-zero-duration.property.test.ts`
    - Generate random state transitions with reduced motion/low-perf flags and verify duration is 0

  - [ ]* 5.10 Write property test for zero content displacement during chrome transitions
    - **Property 5: Zero content displacement during chrome transitions**
    - **Validates: Requirements 12.4, 12.5, 12.7**
    - Create `__tests__/immersive-mobile-ux/content-displacement.property.test.ts`
    - Generate random scroll positions and chrome transitions, verify content position unchanged

  - [ ]* 5.11 Write property test for only transform and opacity are animated
    - **Property 6: Only transform and opacity are animated**
    - **Validates: Requirements 13.1, 13.2**
    - Create `__tests__/immersive-mobile-ux/animation-properties-constraint.property.test.ts`
    - Inspect all animation configs and verify only transform/opacity are animated

  - [ ]* 5.12 Write property test for animation duration within bounds
    - **Property 7: Animation duration within bounds**
    - **Validates: Requirements 3.5, 13.3**
    - Create `__tests__/immersive-mobile-ux/animation-duration-bounds.property.test.ts`
    - Generate random animation configs and verify duration is 150–300ms with correct easing

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement scroll position and viewport property tests
  - [ ]* 7.1 Write property test for scroll position store-restore round trip
    - **Property 9: Scroll position store-restore round trip**
    - **Validates: Requirements 6.1, 6.2**
    - Create `__tests__/immersive-mobile-ux/scroll-position-roundtrip.property.test.ts`
    - Generate random route/offset pairs and verify round-trip preservation

  - [ ]* 7.2 Write property test for scroll cache LRU eviction
    - **Property 10: Scroll cache LRU eviction**
    - **Validates: Requirements 6.3**
    - Create `__tests__/immersive-mobile-ux/scroll-cache-lru.property.test.ts`
    - Generate sequences of >20 route visits and verify cache never exceeds 20 entries with correct eviction

  - [ ]* 7.3 Write property test for scroll position capped at content height
    - **Property 11: Scroll position capped at content height**
    - **Validates: Requirements 6.5**
    - Create `__tests__/immersive-mobile-ux/scroll-position-cap.property.test.ts`
    - Generate stored positions exceeding content height and verify capping behavior

  - [ ]* 7.4 Write property test for CSS custom property tracks visual viewport
    - **Property 12: CSS custom property tracks visual viewport**
    - **Validates: Requirements 5.2, 7.2, 7.4**
    - Create `__tests__/immersive-mobile-ux/viewport-height-tracking.property.test.ts`
    - Generate random viewport height changes and verify `--app-viewport-height` matches

- [ ] 8. Implement iOS Safari and orientation property tests
  - [ ]* 8.1 Write property test for iOS overscroll bounce suppression
    - **Property 13: iOS overscroll bounce suppression**
    - **Validates: Requirements 8.1**
    - Create `__tests__/immersive-mobile-ux/ios-overscroll-suppression.property.test.ts`
    - Generate scroll events at overscroll bounds and verify no chrome state change

  - [ ]* 8.2 Write property test for orientation change preserves chrome state
    - **Property 14: Orientation change preserves chrome state**
    - **Validates: Requirements 10.2**
    - Create `__tests__/immersive-mobile-ux/orientation-preserves-chrome.property.test.ts`
    - Generate random chrome states + orientation changes and verify state preservation

  - [ ]* 8.3 Write property test for keyboard open suppresses scroll-direction chrome changes
    - **Property 15: Keyboard open suppresses scroll-direction chrome changes**
    - **Validates: Requirements 7.6**
    - Create `__tests__/immersive-mobile-ux/keyboard-suppresses-scroll-chrome.property.test.ts`
    - Generate scroll direction changes while keyboard is open and verify no chrome state update

  - [ ]* 8.4 Write property test for no animation debt from rapid direction changes
    - **Property 18: No animation debt from rapid direction changes**
    - **Validates: Requirements 11.3, 11.4**
    - Create `__tests__/immersive-mobile-ux/no-animation-debt.property.test.ts`
    - Generate rapid direction change sequences and verify at most one pending animate value

- [x] 9. Integrate MobileShell into app layout and wire components together
  - [x] 9.1 Update `app/(app)/layout.tsx` to wrap mobile content with MobileShell
    - Import MobileShell component
    - Wrap the `<div className="flex-1 bg-app">{children}</div>` with MobileShell on mobile
    - Ensure Header reads chrome visibility from ImmersiveContext when inside MobileShell
    - Add BottomNav inside MobileShell with navigation items (Dashboard, Notes, Tasks, Library, Calendar)
    - Ensure FloatingSearchBar continues to work within the MobileShell context
    - Verify viewport meta tag includes `viewport-fit=cover`
    - Apply `-webkit-overflow-scrolling: touch` on main scrollable container
    - _Requirements: 1.1, 1.2, 1.3, 1.5, 3.1, 5.1, 8.2, 8.4, 8.5, 9.4, 9.5, 12.1, 12.2, 12.3, 12.6_

  - [x] 9.2 Update Header component to consume ImmersiveContext for chrome visibility
    - Import and consume `useImmersiveContext` when available
    - Use context-driven visibility state instead of local scroll direction on mobile
    - Maintain backward compatibility (Header still works without MobileShell context)
    - Ensure `will-change` lifecycle management (apply during transition, remove after 500ms)
    - _Requirements: 1.5, 13.5, 13.6, 14.4_

  - [ ]* 9.3 Write unit and integration tests for MobileShell integration
    - Test MobileShell renders 100dvh container on mobile
    - Test MobileShell passes through on desktop (≥ 768px)
    - Test initial context state is "chrome-visible"
    - Test full scroll-hide flow: scroll down → chrome hides → scroll up → chrome shows
    - Test keyboard open → BottomNav hides → keyboard close → BottomNav restores
    - Test BottomNav role="navigation" and aria-label
    - Test focus management preserved during chrome toggle
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 7.1, 7.3, 14.1, 14.4_

- [x] 10. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The existing `useScrollDirection` hook, `useIsMobile`, `useReducedMotion`, `useLowPerformance` hooks, and `lib/motion.ts` constants are used as-is — no modifications needed
- The Header component's existing Framer Motion animation pattern is the template for BottomNav
- All animations use only `transform` and `opacity` per the motion system constraints

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1"] },
    { "id": 1, "tasks": ["1.2", "2.2", "3.1"] },
    { "id": 2, "tasks": ["3.2", "3.3", "3.4", "5.1"] },
    { "id": 3, "tasks": ["5.2", "5.3", "5.4", "5.5", "5.6"] },
    { "id": 4, "tasks": ["5.7", "5.8", "5.9", "5.10", "5.11", "5.12"] },
    { "id": 5, "tasks": ["7.1", "7.2", "7.3", "7.4", "8.1", "8.2", "8.3", "8.4"] },
    { "id": 6, "tasks": ["9.1", "9.2"] },
    { "id": 7, "tasks": ["9.3"] }
  ]
}
```
