"use client"

import { useEffect, useState } from "react"

/**
 * Generic hook that returns a debounced version of the provided value.
 * The debounced value only updates after the specified delay has elapsed
 * since the last change to the input value.
 *
 * Cleans up the timeout on unmount and whenever value or delay changes.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds before the value updates
 * @returns The debounced value
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [value, delay])

  return debouncedValue
}
