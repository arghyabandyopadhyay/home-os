"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * Hook managing virtual focus index for keyboard navigation of search results.
 * Focus index of -1 means the input is focused, 0+ means a result item.
 *
 * Handles ArrowDown, ArrowUp, Enter, and Escape with cycling at boundaries.
 * Resets focus index to -1 when resultCount changes.
 *
 * @param resultCount - Number of results currently displayed
 * @param onSelect - Callback invoked with the focused index when Enter is pressed
 * @param onEscape - Callback invoked when Escape is pressed
 */
export function useSearchKeyboardNav(
  resultCount: number,
  onSelect: (index: number) => void,
  onEscape: () => void
) {
  const [focusIndex, setFocusIndex] = useState(-1)

  // Reset focus index when result count changes
  useEffect(() => {
    setFocusIndex(-1)
  }, [resultCount])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault()
          if (resultCount === 0) return
          setFocusIndex((prev) => (prev < resultCount - 1 ? prev + 1 : -1))
          break
        }
        case "ArrowUp": {
          e.preventDefault()
          if (focusIndex > -1) {
            setFocusIndex((prev) => prev - 1)
          }
          break
        }
        case "Enter": {
          if (focusIndex >= 0) {
            e.preventDefault()
            onSelect(focusIndex)
          }
          break
        }
        case "Escape": {
          e.preventDefault()
          onEscape()
          setFocusIndex(-1)
          break
        }
      }
    },
    [resultCount, focusIndex, onSelect, onEscape]
  )

  return { focusIndex, setFocusIndex, handleKeyDown }
}
