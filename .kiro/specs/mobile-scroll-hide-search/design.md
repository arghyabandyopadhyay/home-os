# Design Document: Mobile Scroll Hide Search

## Overview

This feature adds scroll-driven hide/show behavior to the existing `FloatingSearchBar` component on mobile viewports. When the user scrolls down, the search bar translates downward off-screen. When the user scrolls up (or reaches the top of the page), it slides back into view. The sticky Header remains unaffected.

The implementation introduces a single new hook (`useScrollDirection`) and modifies the existing `FloatingSearchBar` component to consume it. The approach prioritizes performance (passive listeners, rAF throttling, transform-only animation) and accessibility (reduced motion, low-performance degradation).

### Key Design Decisions

1. **Custom hook over library**: A lightweight `useScrollDirection` hook is preferred over a scroll library because the logic is simple (direction + threshold) and the project already uses this pattern (e.g., `useIsMobile`, `useReducedMotion`).
2. **Framer Motion `animate` prop**: The hide/show transition uses Framer Motion's `animate` prop with `translateY` rather than CSS transitions, keeping consistency with the existing entrance animation and allowing mid-transition interruption natively.
3. **Threshold-based debouncing**: A pixel threshold (default 10px, constrained to 8–20px) prevents jitter from micro-scrolls and touch bounce.
4. **No layout animation**: Only `transform` (translateY) is animated — no width, height, top, bottom, or other layout-triggering properties.
5. **Graceful degradation**: Both reduced-motion and low-performance flags result in duration 0 (instant state change) while preserving the hide/show logic itself.

## Architecture

```mermaid
graph TD
    subgraph Browser
        SE[Scroll Events]
    end

    subgraph Hooks
        USD[useScrollDirection]
        UIM[useIsMobile]
        URM[useReducedMotion]
        ULP[useLowPerformance]
    end

    subgraph Components
        FSB[FloatingSearchBar]
        HDR[Header - unchanged]
    end

    subgraph Motion System
        LM[lib/motion.ts]
    end

    SE -->|passive listener + rAF| USD
    USD -->|"up" / "down" / null| FSB
    UIM -->|boolean| FSB
    URM -->|boolean| FSB
    ULP -->|boolean| FSB
    LM -->|duration, easing constants| FSB
    FSB -->|translateY animation| Browser
    HDR -.->|sticky top-0, unaffected| Browser
```

### Data Flow

1. The browser fires scroll events.
2. `useScrollDirection` reads `window.scrollY` inside a rAF callback, compares against the previous position, accumulates a delta, and emits `"up"`, `"down"`, or `null` once the threshold is exceeded.
3. `FloatingSearchBar` maps the direction to a visibility state (`visible` / `hidden`).
4. Framer Motion animates `translateY` between `0` (visible) and `+78px` (hidden, off-screen downward).
5. `pointer-events` toggles between `auto` and `none` based on visibility state.
6. When `scrollY === 0`, the bar is forced to visible regardless of direction.

## Components and Interfaces

### `useScrollDirection` Hook

**File**: `hooks/use-scroll-direction.ts`

```typescript
type ScrollDirection = "up" | "down" | null

interface UseScrollDirectionOptions {
  threshold?: number // default: 10 (pixels), constrained to 8-20
}

function useScrollDirection(options?: UseScrollDirectionOptions): ScrollDirection
```

**Behavior**:
- Registers a `scroll` event listener with `{ passive: true }`.
- Throttles reads via `requestAnimationFrame` (at most one read per frame).
- Tracks `previousScrollY` and `accumulatedDelta` in refs.
- When the user reverses direction, resets `accumulatedDelta` to 0.
- Only updates the returned direction state when `|accumulatedDelta| > threshold`.
- On unmount, removes the listener and cancels any pending rAF via `cancelAnimationFrame`.
- Returns `null` on initial mount (no scroll has occurred yet).
- When `scrollY === 0`, forces direction to `null` (which maps to visible in the component).

### `FloatingSearchBar` Component (Modified)

**File**: `components/layout/floating-search-bar.tsx`

New exports for testing:

```typescript
import { DURATION, EASING } from "@/lib/motion"

/** Hide transition config: ease-in, 200ms */
export const hideTransition: Transition = {
  duration: DURATION.normal, // 0.2s = 200ms
  ease: EASING.exit,         // ease-in
}

/** Show transition config: ease-out, 200ms */
export const showTransition: Transition = {
  duration: DURATION.normal, // 0.2s = 200ms
  ease: EASING.entrance,     // ease-out
}

/** The translateY displacement when hidden (px) */
export const HIDE_DISPLACEMENT = 78 // height(44) + bottom(24) + shadow(~10)

/** Default scroll threshold (px) */
export const SCROLL_THRESHOLD = 10
```

**New internal logic**:
- Consumes `useScrollDirection({ threshold: SCROLL_THRESHOLD })`.
- Consumes `useLowPerformance()`.
- Derives `isScrollHidden` from direction:
  - `"down"` → hidden (translateY = +HIDE_DISPLACEMENT)
  - `"up"` or `null` → visible (translateY = 0)
- Disables scroll-hide while:
  - The entrance animation has not completed (`entranceComplete === false`).
  - The command menu is open (`commandMenuOpen === true`).
  - The viewport is not mobile (`isMobile === false`).
- When `prefersReducedMotion || isLowPerf`, sets transition duration to 0.
- Applies `pointer-events: none` when hidden, `pointer-events: auto` when visible.
- On tap during hide transition: cancels hide, returns to visible, then processes activation.
- On tap during show transition: completes show, then processes activation.

### `Header` Component (Unchanged)

**File**: `components/layout/header.tsx`

No modifications. Remains `sticky top-0 z-40` with full interactivity at all times. The scroll-hide logic is entirely scoped to `FloatingSearchBar`.

## Data Models

This feature is entirely client-side and introduces no new data models, database tables, or API routes.

**State managed in refs within `useScrollDirection`**:

| Field | Type | Description |
|-------|------|-------------|
| `previousScrollY` | `number` (ref) | Last recorded scroll position |
| `accumulatedDelta` | `number` (ref) | Pixels scrolled in current direction since last direction change |
| `currentDirection` | `"up" \| "down" \| null` (ref) | Current accumulated direction before threshold is met |
| `direction` | `ScrollDirection` (state) | Exposed direction value, updated only when threshold exceeded |
| `rafId` | `number \| null` (ref) | Pending rAF callback ID for cleanup |
| `ticking` | `boolean` (ref) | Whether a rAF read is already scheduled |

**State managed in `FloatingSearchBar`**:

| Field | Type | Description |
|-------|------|-------------|
| `isScrollHidden` | `boolean` (derived) | Whether the bar should be off-screen |
| `entranceComplete` | `boolean` (state) | Whether the mount entrance animation has finished |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Direction-to-visibility mapping

*For any* scroll event sequence processed by `useScrollDirection`, if the accumulated delta exceeds the threshold in the downward direction, the hook SHALL return `"down"` and the FloatingSearchBar SHALL be in Hidden_State; if the accumulated delta exceeds the threshold in the upward direction, the hook SHALL return `"up"` and the FloatingSearchBar SHALL be in Visible_State; if no threshold has been exceeded, the hook SHALL return `null` and the FloatingSearchBar SHALL be in Visible_State.

**Validates: Requirements 1.1, 2.1, 1.5, 4.5**

### Property 2: Pointer-events follows visibility state

*For any* visibility state of the FloatingSearchBar, when the bar is in Hidden_State the computed `pointer-events` value SHALL be `"none"`, and when the bar is in Visible_State the computed `pointer-events` value SHALL be `"auto"`.

**Validates: Requirements 1.3, 2.3**

### Property 3: Scroll-top forces visible

*For any* prior scroll direction or visibility state, when `window.scrollY` equals 0 the FloatingSearchBar SHALL be in Visible_State with `pointer-events: auto`.

**Validates: Requirements 2.2**

### Property 4: Direction reversal resets accumulated delta

*For any* scroll sequence where the user reverses direction (from down to up or up to down), the accumulated scroll delta SHALL reset to 0, requiring the Scroll_Threshold to be exceeded again in the new direction before a state change occurs.

**Validates: Requirements 2.5**

### Property 5: Sub-threshold scrolls produce no state change

*For any* scroll delta whose absolute value is less than or equal to the Scroll_Threshold, the `useScrollDirection` hook SHALL not change its returned direction value.

**Validates: Requirements 4.3, 1.4**

### Property 6: Animation duration and easing bounds

*For any* hide/show transition configuration, the hide transition SHALL have a duration between 150ms and 300ms with ease-in easing, and the show transition SHALL have a duration between 150ms and 300ms with ease-out easing.

**Validates: Requirements 3.1, 3.2**

### Property 7: Only transform and opacity are animated

*For any* hide/show animation variant, the animated properties SHALL be limited to `transform` (translateY) and optionally `opacity`. No layout-triggering properties (`width`, `height`, `top`, `bottom`, `left`, `right`, `margin`, `padding`) SHALL be present in the animation variants.

**Validates: Requirements 3.3**

### Property 8: Degraded mode applies zero duration

*For any* hide/show transition triggered while either `prefers-reduced-motion: reduce` is active OR the device is detected as low-performance, the effective transition duration SHALL be 0, resulting in an instant state change with no intermediate animation frames. The visibility state and pointer-events SHALL still update correctly in response to scroll direction.

**Validates: Requirements 3.4, 6.1, 6.2, 7.1, 7.2, 7.3**

### Property 9: Command menu open pauses scroll-hide

*For any* scroll event sequence occurring while the Command_Menu is open, the FloatingSearchBar visibility state SHALL not change from whatever state it was in when the Command_Menu opened.

**Validates: Requirements 8.4**

### Property 10: Entrance gate blocks scroll-hide

*For any* scroll event sequence occurring before the FloatingSearchBar entrance animation has completed, the scroll-hide system SHALL not change the visibility state of the FloatingSearchBar (it remains in Visible_State).

**Validates: Requirements 8.5**

### Property 11: rAF throttling limits reads to one per frame

*For any* burst of N scroll events fired within a single animation frame, the `useScrollDirection` hook SHALL perform at most one `window.scrollY` read (via the rAF callback), regardless of how many scroll events were fired.

**Validates: Requirements 4.2**

## Error Handling

This feature has minimal error surface since it is entirely client-side with no network calls or data persistence.

| Scenario | Handling |
|----------|----------|
| `window` undefined (SSR) | Hook returns `null`; bar renders in Visible_State. The `"use client"` directive ensures hooks only run client-side. |
| `requestAnimationFrame` unavailable | Fallback: read scroll position synchronously on each event (degrades performance but maintains correctness). |
| Scroll event listener fails to attach | Bar remains permanently visible (safe default). |
| Framer Motion animation interrupted | Framer Motion handles mid-transition interruption natively — new `animate` values start from current position. |
| `useIsMobile` returns false mid-session (resize) | Scroll listener is cleaned up; bar is not rendered on desktop. |
| Multiple rapid direction changes | Threshold + delta reset prevents jitter; at most one state update per rAF frame. |

## Testing Strategy

### Property-Based Tests (fast-check)

Property-based tests use **fast-check** with a minimum of 100 iterations per property. Each test references its design property via a tag comment.

**Tag format**: `Feature: mobile-scroll-hide-search, Property {N}: {title}`

**Test directory**: `__tests__/mobile-scroll-hide-search/`

| Test File | Properties Covered |
|-----------|-------------------|
| `scroll-direction-mapping.property.test.ts` | Property 1, 3, 4, 5 |
| `pointer-events-visibility.property.test.ts` | Property 2 |
| `animation-constraints.property.test.ts` | Property 6, 7 |
| `degraded-mode-duration.property.test.ts` | Property 8 |
| `scroll-hide-gating.property.test.ts` | Property 9, 10 |
| `raf-throttling.property.test.ts` | Property 11 |

**Configuration**: Each property test runs with `fc.assert(fc.property(...), { numRuns: 100 })`.

### Unit Tests (example-based)

| Test | Validates |
|------|-----------|
| Initial state is null / visible on mount | 4.6 |
| HIDE_DISPLACEMENT >= 78 | 1.2, 3.6 |
| Default threshold is between 8 and 20 | 1.4 |
| Header remains sticky top-0 z-40 | 5.1, 5.2, 5.3 |
| Cleanup removes listener and cancels rAF | 4.4 |
| Passive listener option is set | 4.1 |
| Tap during show transition completes then activates | 8.2 |
| Tap during hide transition cancels and activates | 8.3 |
| Desktop mode does not attach listeners | 8.6 |
| Both reduced-motion and low-perf active → duration 0 | 7.3 |
| Mid-transition interruption starts from current position | 3.5 |
| Runtime reduced-motion toggle takes effect on next scroll | 6.3 |

### Integration Tests

| Test | Validates |
|------|-----------|
| Existing tap-to-expand behavior works in Visible_State | 8.1 |
| Full scroll down → hide → scroll up → show cycle | 1.1, 2.1 |

### Test Generators (for property tests)

- **Scroll sequence generator**: Produces arrays of `{ scrollY: number }` positions simulating realistic scroll behavior (monotonic segments with occasional reversals).
- **Threshold generator**: Produces threshold values in [8, 20] range.
- **Delta generator**: Produces individual scroll deltas (positive for down, negative for up) with magnitudes from 1 to 500px.
- **Boolean flag generator**: For `reducedMotion`, `isLowPerf`, `commandMenuOpen`, `entranceComplete` combinations.
