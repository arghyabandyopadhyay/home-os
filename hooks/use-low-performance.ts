"use client"

import { useEffect, useState } from "react"

/**
 * Detects whether the device is low-performance based on:
 * - `navigator.deviceMemory <= 4` (low RAM)
 * - Lack of `backdrop-filter` CSS support
 *
 * When true, the app should disable backdrop-blur effects and use solid
 * backgrounds, and limit box-shadow to a single layer.
 *
 * This hook also adds/removes the `.low-perf` class on the `<html>` element
 * so CSS fallbacks can be applied globally.
 *
 * Validates: Requirements 17.1, 17.4, 17.6
 */
export function useLowPerformance(): boolean {
  const [isLowPerf, setIsLowPerf] = useState(false)

  useEffect(() => {
    const lowMemory = checkLowMemory()
    const noBackdropFilter = !checkBackdropFilterSupport()

    const shouldDegrade = lowMemory || noBackdropFilter
    setIsLowPerf(shouldDegrade)

    if (shouldDegrade) {
      document.documentElement.classList.add("low-perf")
    } else {
      document.documentElement.classList.remove("low-perf")
    }

    return () => {
      document.documentElement.classList.remove("low-perf")
    }
  }, [])

  return isLowPerf
}

/**
 * Checks if the device has low memory (≤ 4 GB).
 * Uses the Navigator.deviceMemory API (Chrome/Edge only).
 * Returns false if the API is not available (assumes capable device).
 */
function checkLowMemory(): boolean {
  if (typeof navigator === "undefined") return false
  // deviceMemory is not in the standard Navigator type but exists in Chromium browsers
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (memory === undefined) return false
  return memory <= 4
}

/**
 * Checks if the browser supports the `backdrop-filter` CSS property.
 * Uses CSS.supports() API with fallback for older browsers.
 */
function checkBackdropFilterSupport(): boolean {
  if (typeof CSS === "undefined" || typeof CSS.supports !== "function") {
    return false
  }
  return (
    CSS.supports("backdrop-filter", "blur(1px)") ||
    CSS.supports("-webkit-backdrop-filter", "blur(1px)")
  )
}
