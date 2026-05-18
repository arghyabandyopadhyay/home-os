"use client"

import { useLowPerformance } from "@/hooks/use-low-performance"

/**
 * A headless component that detects low-performance conditions and applies
 * the `.low-perf` class to the HTML element. Renders nothing visible.
 *
 * Place this inside the app providers tree so it runs on mount.
 *
 * Validates: Requirements 17.1, 17.4, 17.6
 */
export function LowPerformanceDetector() {
  useLowPerformance()
  return null
}
