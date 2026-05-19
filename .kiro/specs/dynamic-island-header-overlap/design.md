# Dynamic Island Header Overlap Bugfix Design

## Overview

On iPhones with the Dynamic Island, the header's fixed 64px height combined with `padding-top: env(safe-area-inset-top)` compresses the content area to ~5px. The scroll-hide animation uses a hardcoded `-68px` translateY that doesn't account for the expanded safe-area height, causing incomplete hide/show transitions. The fix expands the header height dynamically (safe-area-inset-top + 64px) and adjusts the translateY displacement to match, while preserving existing behavior on non-notched and desktop devices.

## Glossary

- **Bug_Condition (C)**: The device has a non-zero `env(safe-area-inset-top)` value (notched/Dynamic Island iPhones) AND the header uses a fixed 64px height that doesn't accommodate the inset
- **Property (P)**: The header's total height equals `env(safe-area-inset-top) + 64px`, content renders below the system UI, and scroll-hide translateY uses the full dynamic height
- **Preservation**: Desktop sticky header behavior, non-notched mobile scroll-hide at -68px, and all existing header interactions remain unchanged
- **`Header`**: The component in `components/layout/header.tsx` that renders the fixed/sticky app header
- **`useScrollDirection`**: The hook in `hooks/use-scroll-direction.ts` that detects scroll direction for hide/show behavior
- **`safe-area-header`**: CSS utility class in `globals.css` that applies `padding-top: env(safe-area-inset-top)`
- **`HEADER_HIDE_DISPLACEMENT`**: The exported constant (-68px) used as the translateY value when hiding the header
- **Dynamic Island iPhone**: iPhone 14 Pro and later with `safe-area-inset-top ≈ 59px`
- **Older notched iPhone**: iPhone X through iPhone 14 with `safe-area-inset-top ≈ 47px`

## Bug Details

### Bug Condition

The bug manifests when the app is viewed on an iPhone with a notch or Dynamic Island (safe-area-inset-top > 0) in Safari or standalone PWA mode. The header component uses a fixed `h-16` (64px) height class and applies `padding-top: env(safe-area-inset-top)` via the `safe-area-header` class. This padding eats into the fixed 64px, compressing the content. Additionally, the `HEADER_HIDE_DISPLACEMENT` constant is hardcoded to -68px, which is insufficient to fully hide a header that is actually 64px + safe-area-inset-top tall.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type { safeAreaInsetTop: number, isMobile: boolean, scrollDirection: "up" | "down" | null }
  OUTPUT: boolean
  
  RETURN input.safeAreaInsetTop > 0
         AND input.isMobile = true
         AND (
           headerContentIsCompressed(input.safeAreaInsetTop)
           OR scrollHideDisplacementInsufficient(input.safeAreaInsetTop, input.scrollDirection)
         )
END FUNCTION

FUNCTION headerContentIsCompressed(safeAreaInsetTop)
  // Header has fixed 64px height but padding-top consumes part of it
  RETURN (64 - safeAreaInsetTop) < 64
END FUNCTION

FUNCTION scrollHideDisplacementInsufficient(safeAreaInsetTop, scrollDirection)
  // The -68px displacement doesn't hide the full header height
  expectedDisplacement := safeAreaInsetTop + 64 + 4  // content + border + buffer
  RETURN scrollDirection = "down" AND abs(HEADER_HIDE_DISPLACEMENT) < expectedDisplacement
END FUNCTION
```

### Examples

- **Dynamic Island iPhone (59px inset), header visible**: Header renders at 64px total height. The 59px padding-top leaves only 5px for content — navigation toggle, search trigger, and user menu are clipped or invisible.
- **Dynamic Island iPhone (59px inset), scroll down**: Header translates by -68px, but the full header height is 123px (59 + 64). The header remains partially visible (55px still showing).
- **Dynamic Island iPhone (59px inset), scroll up after scrolling down**: Header reappears at translateY: 0, but content still overlaps with the Dynamic Island because the height hasn't been expanded.
- **Older notched iPhone (47px inset), scroll down**: Header translates by -68px, but full height should be 111px (47 + 64). Header remains partially visible (43px still showing).

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Desktop (md breakpoint and above): header remains sticky, no fixed positioning, no safe-area adjustments, no scroll-hide behavior
- Non-notched mobile devices (safe-area-inset-top = 0): header remains 64px height with -68px scroll-hide displacement
- Mouse/touch interactions with header buttons (navigation toggle, search trigger, user menu) continue to work identically
- The `useScrollDirection` hook behavior is unchanged — same threshold, same direction detection logic
- Header z-index, backdrop-blur, border, and background styling remain the same
- Reduced motion and low-performance degradation paths continue to work (instant transitions)
- At scroll position 0, header is always fully visible regardless of device

**Scope:**
All inputs that do NOT involve a device with `safe-area-inset-top > 0` on mobile should be completely unaffected by this fix. This includes:
- All desktop viewports (md breakpoint and above)
- Mobile devices without a notch (Android, older iPhones)
- Any non-scroll interactions (button clicks, menu opens, search triggers)

## Hypothesized Root Cause

Based on the bug description, the most likely issues are:

1. **Fixed height doesn't accommodate safe area**: The header uses `h-16` (64px) as a fixed height. The `safe-area-header` class adds `padding-top: env(safe-area-inset-top)` which consumes space inside the 64px box, compressing content. The height should be `env(safe-area-inset-top) + 64px` so the padding is additive, not subtractive.

2. **Hardcoded translateY displacement**: `HEADER_HIDE_DISPLACEMENT = -68px` is calculated as `64px + 1px border + 3px buffer`. On notched devices, the actual visible height is `safe-area-inset-top + 64px`, so the displacement must be dynamic: `-(safe-area-inset-top + 64 + 4)px`.

3. **CSS vs JS disconnect**: The safe-area padding is applied via CSS (`env(safe-area-inset-top)`) but the translateY is a JS constant. There's no mechanism to read the computed safe-area value in JS or to express the displacement as a CSS calculation that includes the env() value.

4. **No height expansion mechanism**: The header needs its height to grow on notched devices. Currently `h-16` is unconditional. The fix needs either a CSS-only approach (using `calc()` with `env()`) or a JS measurement approach to determine the actual header height.

## Correctness Properties

Property 1: Bug Condition - Header Height Accommodates Safe Area

_For any_ device where `env(safe-area-inset-top) > 0` and the viewport is mobile (below md breakpoint), the fixed header's total rendered height SHALL equal `env(safe-area-inset-top) + 64px`, ensuring the 64px content area is fully available below the system UI with no compression or overlap.

**Validates: Requirements 2.1, 2.2**

Property 2: Bug Condition - Scroll-Hide Uses Full Dynamic Height

_For any_ device where `env(safe-area-inset-top) > 0` and the user scrolls down on mobile, the header SHALL translate upward by at least `env(safe-area-inset-top) + 64px` so that it completely exits the viewport, creating a full-screen immersive experience.

**Validates: Requirements 2.3, 2.5**

Property 3: Bug Condition - Scroll-Show Restores Correct Position

_For any_ device where `env(safe-area-inset-top) > 0` and the user scrolls up on mobile, the header SHALL translate back to `translateY(0)` with the safe-area padding intact, so header content appears entirely below the Dynamic Island without overlap.

**Validates: Requirements 2.4, 2.5**

Property 4: Preservation - Desktop Layout Unchanged

_For any_ viewport at or above the md breakpoint, the header SHALL remain a sticky element with 64px height, no fixed positioning, no safe-area adjustments, and no scroll-hide behavior, producing the same layout as the original code.

**Validates: Requirements 3.2**

Property 5: Preservation - Non-Notched Mobile Unchanged

_For any_ mobile device where `env(safe-area-inset-top) = 0`, the header SHALL render at 64px height and use the existing -68px translateY displacement for scroll-hide, preserving the original behavior exactly.

**Validates: Requirements 3.1, 3.3, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `app/globals.css`

**Class**: `.safe-area-header`

**Specific Changes**:
1. **Add dynamic height**: Add `height: calc(env(safe-area-inset-top) + 64px)` to `.safe-area-header` so the header expands to accommodate the safe area on notched devices. On non-notched devices, `env(safe-area-inset-top)` resolves to `0px`, keeping the height at 64px.
2. **Add min-height fallback**: Set `min-height: 64px` to ensure the header never shrinks below its content height.

**File**: `components/layout/header.tsx`

**Component**: `Header`

**Specific Changes**:
3. **Remove fixed h-16 on mobile for notched devices**: Replace the unconditional `h-16` class with a responsive approach. On desktop (`md:`), keep `h-16`. On mobile, let the CSS `.safe-area-header` height rule control the height via `calc(env(safe-area-inset-top) + 64px)`.
4. **Make translateY displacement dynamic**: Instead of the hardcoded `HEADER_HIDE_DISPLACEMENT = -68`, use a CSS custom property or a CSS `calc()` approach. The displacement should be `calc(-1 * (env(safe-area-inset-top) + 68px))` on notched devices. This can be achieved by:
   - Using a CSS custom property `--header-hide-y` set via `calc(-1 * (env(safe-area-inset-top) + 68px))` in the `.safe-area-header` class
   - Reading this value in the component via `getComputedStyle` or using a CSS-only transform approach
   - Alternatively, using Framer Motion's `animate` with a CSS variable reference
5. **Preserve desktop behavior**: Ensure the `md:sticky` class and lack of scroll-hide on desktop remain unchanged. The `md:h-16` class should keep desktop at exactly 64px.

**Preferred approach — CSS custom property for displacement**:
- Define `--header-hide-y: calc(-1 * (env(safe-area-inset-top) + 68px))` in `.safe-area-header`
- In the Header component, read the computed `--header-hide-y` value from the header element ref using `getComputedStyle` after mount
- Use this dynamic value in the Framer Motion `animate` prop instead of the hardcoded constant
- Fallback to `-68` if the CSS variable is not available (non-notched devices)

**File**: `app/globals.css`

**Specific Changes**:
6. **Define CSS custom property for header displacement**: Add `--header-hide-y: calc(-1 * (env(safe-area-inset-top) + 68px))` to `.safe-area-header` so the JS layer can read the computed displacement value.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate the header rendering with various `safe-area-inset-top` values and verify the computed height and translateY displacement. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **Height Compression Test**: Render header with simulated `env(safe-area-inset-top) = 59px` and assert total height is 123px, not 64px (will fail on unfixed code)
2. **Displacement Insufficiency Test**: Assert that `HEADER_HIDE_DISPLACEMENT` is at least `-(59 + 64 + 4) = -127` for Dynamic Island devices (will fail on unfixed code — currently -68)
3. **Content Overlap Test**: Verify header content (buttons) renders below the 59px safe area zone (will fail on unfixed code)
4. **Older Notch Test**: Render with `env(safe-area-inset-top) = 47px` and verify height is 111px (will fail on unfixed code)

**Expected Counterexamples**:
- Header height remains 64px regardless of safe-area-inset-top value
- HEADER_HIDE_DISPLACEMENT is always -68px, insufficient for notched devices
- Possible causes: fixed `h-16` class overriding dynamic height, hardcoded constant not accounting for env() value

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  renderedHeight := getHeaderHeight(input.safeAreaInsetTop)
  ASSERT renderedHeight = input.safeAreaInsetTop + 64

  IF input.scrollDirection = "down" THEN
    displacement := getHeaderDisplacement(input.safeAreaInsetTop)
    ASSERT abs(displacement) >= input.safeAreaInsetTop + 64
  END IF

  IF input.scrollDirection = "up" THEN
    translateY := getHeaderTranslateY()
    ASSERT translateY = 0
  END IF
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  IF input.isDesktop THEN
    ASSERT headerIsSticky(input) = true
    ASSERT headerHeight(input) = 64
    ASSERT scrollHideDisabled(input) = true
  END IF

  IF input.isMobile AND input.safeAreaInsetTop = 0 THEN
    ASSERT headerHeight(input) = 64
    ASSERT headerDisplacement(input) = -68
  END IF
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (various viewport widths, safe-area values, scroll positions)
- It catches edge cases that manual unit tests might miss (boundary between mobile/desktop, zero vs near-zero insets)
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for desktop viewports and non-notched mobile devices, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Desktop Preservation**: Verify header remains sticky with 64px height and no scroll-hide for all viewports ≥ md breakpoint
2. **Non-Notched Mobile Preservation**: Verify header is 64px with -68px displacement when safe-area-inset-top = 0
3. **Scroll Direction Preservation**: Verify useScrollDirection hook behavior is unchanged (same threshold, same direction detection)
4. **Interaction Preservation**: Verify header buttons (MobileSidebar, SearchTrigger, UserMenu) remain interactive in all states

### Unit Tests

- Test that `.safe-area-header` CSS produces correct computed height for various env() values
- Test that the header component reads and applies the dynamic displacement correctly
- Test that `md:` responsive classes override mobile safe-area behavior on desktop
- Test edge cases: safe-area-inset-top = 0, very large values, fractional values

### Property-Based Tests

- Generate random `safeAreaInsetTop` values (0–100px) and verify header height = max(64, safeAreaInsetTop + 64)
- Generate random viewport widths and verify desktop/mobile behavior boundary at md breakpoint
- Generate random scroll sequences and verify displacement always fully hides the header on notched devices
- Generate random device configurations and verify non-notched devices are completely unaffected

### Integration Tests

- Test full scroll-down/scroll-up cycle on simulated Dynamic Island device — header fully hides and fully shows
- Test transition between desktop and mobile viewport (resize) — header switches between sticky and fixed correctly
- Test that reduced motion preference disables animation but still applies correct positioning
- Test PWA standalone mode with Dynamic Island — header content never overlaps system UI
