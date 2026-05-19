# Implementation Plan

## Overview

Fix the header component on iPhones with the Dynamic Island (and older notched iPhones) where the fixed 64px header height combined with `padding-top: env(safe-area-inset-top)` compresses content to ~5px, and the hardcoded -68px scroll-hide displacement fails to fully hide the expanded header. The fix makes the header height dynamic (`env(safe-area-inset-top) + 64px`) and uses a CSS custom property for the translateY displacement, while preserving existing behavior on desktop and non-notched mobile devices.

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Header Height and Displacement on Notched Devices
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the header height compression and insufficient scroll-hide displacement
  - **Scoped PBT Approach**: Generate random `safeAreaInsetTop` values (1–100) representing notched devices and verify:
    - Header total height equals `safeAreaInsetTop + 64` (not fixed at 64px)
    - Scroll-hide displacement magnitude is at least `safeAreaInsetTop + 64` (not hardcoded -68px)
  - Create test file at `__tests__/dynamic-island-header-overlap/bug-condition.property.test.ts`
  - Use fast-check to generate arbitrary `safeAreaInsetTop` in range [1, 100] with `isMobile = true`
  - Assert: `getHeaderHeight(safeAreaInsetTop) === safeAreaInsetTop + 64`
  - Assert: `Math.abs(getHeaderDisplacement(safeAreaInsetTop)) >= safeAreaInsetTop + 64`
  - From Bug Condition in design: `isBugCondition(input)` where `input.safeAreaInsetTop > 0 AND input.isMobile = true`
  - From Expected Behavior: header expands to accommodate safe area, displacement fully hides header
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists: height stays 64px, displacement stays -68px)
  - Document counterexamples found (e.g., "safeAreaInsetTop=59: header height is 64 instead of 123, displacement is -68 instead of ≥123")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.3_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Desktop and Non-Notched Mobile Behavior Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - Create test file at `__tests__/dynamic-island-header-overlap/preservation.property.test.ts`
  - **Observation phase** (run on UNFIXED code):
    - Observe: Desktop viewports (≥ 768px md breakpoint) → header is sticky, height = 64px, no scroll-hide behavior
    - Observe: Non-notched mobile (safeAreaInsetTop = 0) → header height = 64px, displacement = -68px
    - Observe: At scroll position 0 → header is fully visible (translateY = 0) regardless of device
  - **Property-based tests**:
    - For all viewport widths ≥ 768px: header height = 64, position = sticky, no translateY displacement applied
    - For all mobile viewports with safeAreaInsetTop = 0: header height = 64, displacement = -68
    - For all device configurations at scroll position 0: header translateY = 0
  - Use fast-check to generate random viewport widths (768–2560) for desktop preservation
  - Use fast-check to generate random scroll positions for non-notched mobile verifying displacement = -68
  - Verify tests PASS on UNFIXED code (confirms baseline behavior to preserve)
  - **EXPECTED OUTCOME**: Tests PASS (non-notched and desktop behavior works correctly on unfixed code)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 3.6_

- [x] 3. Fix for Dynamic Island header overlap and scroll-hide displacement

  - [x] 3.1 Update `.safe-area-header` CSS class in `app/globals.css`
    - Add `height: calc(env(safe-area-inset-top) + 64px)` so header expands on notched devices
    - Add `min-height: 64px` as fallback for non-notched devices
    - Add CSS custom property `--header-hide-y: calc(-1 * (env(safe-area-inset-top) + 68px))` for dynamic displacement
    - On non-notched devices, `env(safe-area-inset-top)` resolves to 0px, keeping height at 64px and displacement at -68px
    - _Bug_Condition: isBugCondition(input) where input.safeAreaInsetTop > 0 AND input.isMobile = true_
    - _Expected_Behavior: header height = safeAreaInsetTop + 64, displacement = -(safeAreaInsetTop + 68)_
    - _Preservation: Non-notched devices unaffected (env resolves to 0px)_
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 3.1, 3.3_

  - [x] 3.2 Update `components/layout/header.tsx` to use dynamic height and displacement
    - Remove fixed `h-16` class on mobile; keep `md:h-16` for desktop
    - Let `.safe-area-header` CSS height rule control mobile header height via `calc(env(safe-area-inset-top) + 64px)`
    - Read `--header-hide-y` CSS custom property from header element ref using `getComputedStyle` after mount
    - Use the dynamic displacement value in Framer Motion `animate` prop instead of hardcoded `HEADER_HIDE_DISPLACEMENT`
    - Fallback to -68 if CSS variable is not available (non-notched devices)
    - Preserve `md:sticky` class and desktop behavior (no scroll-hide on desktop)
    - _Bug_Condition: isBugCondition(input) where input.safeAreaInsetTop > 0 AND input.isMobile = true_
    - _Expected_Behavior: translateY uses full dynamic height on scroll-down, returns to 0 on scroll-up_
    - _Preservation: Desktop remains sticky with 64px height, non-notched mobile uses -68px displacement_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.3 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Header Height and Displacement on Notched Devices
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior (height = safeAreaInsetTop + 64, displacement ≥ safeAreaInsetTop + 64)
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1: `npx vitest --run __tests__/dynamic-island-header-overlap/bug-condition.property.test.ts`
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.4 Verify preservation tests still pass
    - **Property 2: Preservation** - Desktop and Non-Notched Mobile Behavior Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2: `npx vitest --run __tests__/dynamic-island-header-overlap/preservation.property.test.ts`
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm desktop header remains sticky at 64px with no scroll-hide
    - Confirm non-notched mobile header remains 64px with -68px displacement
    - Confirm header is visible at scroll position 0 on all devices

- [x] 4. Checkpoint - Ensure all tests pass
  - Run full test suite: `npx vitest --run __tests__/dynamic-island-header-overlap/`
  - Verify bug-condition.property.test.ts passes (bug is fixed)
  - Verify preservation.property.test.ts passes (no regressions)
  - Ensure no other existing tests are broken: `npm run test`
  - Ask the user if questions arise

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1", "2"] },
    { "id": 1, "tasks": ["3.1", "3.2"] },
    { "id": 2, "tasks": ["3.3", "3.4"] },
    { "id": 3, "tasks": ["4"] }
  ]
}
```

## Notes

- Tests use `fast-check` for property-based testing with Vitest as the test runner
- Test files go in `__tests__/dynamic-island-header-overlap/`
- The fix involves two files: `app/globals.css` (CSS custom property + dynamic height) and `components/layout/header.tsx` (read CSS variable, remove fixed h-16 on mobile)
- Exploration test (task 1) is expected to FAIL on unfixed code — this confirms the bug exists (header height fixed at 64px, displacement fixed at -68px)
- Preservation test (task 2) is expected to PASS on unfixed code — this captures baseline behavior for desktop and non-notched mobile
- On non-notched devices, `env(safe-area-inset-top)` resolves to `0px`, so the fix is a no-op for those devices
- The CSS custom property `--header-hide-y` bridges the gap between CSS `env()` values and JS-driven Framer Motion animations
- Older notched iPhones (safe-area-inset-top ≈ 47px) are also covered by the dynamic calculation
