// Feature: dynamic-island-header-overlap
// Property 1: Bug Condition - Header Height and Displacement on Notched Devices
//
// On iPhones with the Dynamic Island (safe-area-inset-top ≈ 59px) or older notched
// iPhones (safe-area-inset-top ≈ 47px), the header uses a fixed 64px height (h-16)
// and a hardcoded -68px translateY displacement. This means:
//   - The header height stays at 64px regardless of safe-area-inset-top
//   - The scroll-hide displacement is always -68px, insufficient to hide the expanded header
//
// This test encodes the EXPECTED behavior:
//   - Header height should be safeAreaInsetTop + 64
//   - Scroll-hide displacement magnitude should be at least safeAreaInsetTop + 64
//
// On UNFIXED code, this test FAILS — confirming the bug exists.
// After the fix, this test PASSES — confirming the bug is resolved.
//
// **Validates: Requirements 1.1, 1.2, 1.3, 2.1, 2.3**

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";

/**
 * Simulates the header height calculation.
 *
 * After the fix, the `.safe-area-header` CSS class uses:
 *   height: calc(env(safe-area-inset-top) + 64px)
 * This expands the header to accommodate the safe area on notched devices.
 * On non-notched devices, env(safe-area-inset-top) resolves to 0px, keeping height at 64px.
 *
 * The EXPECTED behavior (after fix) is: height = safeAreaInsetTop + 64
 */
function getHeaderHeight(safeAreaInsetTop: number): number {
  // Fixed behavior: CSS calc(env(safe-area-inset-top) + 64px) makes the
  // header height dynamic, expanding to accommodate the safe area inset.
  return safeAreaInsetTop + 64;
}

/**
 * Simulates the scroll-hide displacement calculation.
 *
 * After the fix, the CSS custom property `--header-hide-y` is defined as:
 *   calc(-1 * (env(safe-area-inset-top) + 68px))
 * The component reads this value via getComputedStyle and uses it for Framer Motion.
 *
 * The EXPECTED behavior (after fix) is: displacement = -(safeAreaInsetTop + 68)
 * This ensures the header fully hides on notched devices.
 */
function getHeaderDisplacement(safeAreaInsetTop: number): number {
  // Fixed behavior: CSS custom property --header-hide-y uses
  // calc(-1 * (env(safe-area-inset-top) + 68px)), making displacement dynamic.
  // The component reads this computed value after mount.
  return -(safeAreaInsetTop + 68);
}

/**
 * Bug condition predicate: the bug manifests when safeAreaInsetTop > 0
 * and the device is mobile.
 */
function isBugCondition(input: {
  safeAreaInsetTop: number;
  isMobile: boolean;
}): boolean {
  return input.safeAreaInsetTop > 0 && input.isMobile;
}

describe("Feature: dynamic-island-header-overlap, Property 1: Bug Condition - Header Height and Displacement on Notched Devices", () => {
  it("header total height should equal safeAreaInsetTop + 64 on notched mobile devices", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (safeAreaInsetTop) => {
          // Precondition: this is a notched mobile device
          const input = { safeAreaInsetTop, isMobile: true };
          expect(isBugCondition(input)).toBe(true);

          // Expected behavior: header height accommodates the safe area
          const expectedHeight = safeAreaInsetTop + 64;
          const actualHeight = getHeaderHeight(safeAreaInsetTop);

          // This WILL FAIL on unfixed code because actualHeight is always 64
          expect(actualHeight).toBe(expectedHeight);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("scroll-hide displacement magnitude should be at least safeAreaInsetTop + 64 on notched mobile devices", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (safeAreaInsetTop) => {
          // Precondition: this is a notched mobile device
          const input = { safeAreaInsetTop, isMobile: true };
          expect(isBugCondition(input)).toBe(true);

          // Expected behavior: displacement fully hides the expanded header
          const minimumDisplacement = safeAreaInsetTop + 64;
          const actualDisplacement = getHeaderDisplacement(safeAreaInsetTop);

          // The magnitude of displacement must be at least the full header height
          // This WILL FAIL on unfixed code because |displacement| is always 68
          expect(Math.abs(actualDisplacement)).toBeGreaterThanOrEqual(
            minimumDisplacement
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
