import { describe, it, expect, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useSearchKeyboardNav } from "@/hooks/use-search-keyboard-nav"

/**
 * Unit tests for useSearchKeyboardNav hook.
 * Validates: Requirements 5.1, 5.2, 5.4, 5.5, 5.6, 5.8
 *
 * Tests keyboard navigation through search results:
 * - ArrowDown/ArrowUp move focus index
 * - Enter selects the focused item
 * - Escape resets focus and calls onEscape
 * - Cycling at boundaries
 * - Reset on resultCount change
 */

function createKeyboardEvent(key: string): React.KeyboardEvent {
  return {
    key,
    preventDefault: vi.fn(),
  } as unknown as React.KeyboardEvent
}

describe("useSearchKeyboardNav", () => {
  it("initializes focusIndex to -1 (input focused)", () => {
    const { result } = renderHook(() =>
      useSearchKeyboardNav(5, vi.fn(), vi.fn())
    )
    expect(result.current.focusIndex).toBe(-1)
  })

  describe("ArrowDown", () => {
    it("moves focus from -1 to 0 when results exist", () => {
      const { result } = renderHook(() =>
        useSearchKeyboardNav(3, vi.fn(), vi.fn())
      )

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })

      expect(result.current.focusIndex).toBe(0)
    })

    it("increments focus index when not at last result", () => {
      const { result } = renderHook(() =>
        useSearchKeyboardNav(3, vi.fn(), vi.fn())
      )

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })

      expect(result.current.focusIndex).toBe(1)
    })

    it("cycles back to -1 when at last result", () => {
      const { result } = renderHook(() =>
        useSearchKeyboardNav(2, vi.fn(), vi.fn())
      )

      // Move to index 0
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })
      // Move to index 1 (last)
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })
      // Should cycle to -1
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })

      expect(result.current.focusIndex).toBe(-1)
    })

    it("does NOT move focus when resultCount is 0", () => {
      const { result } = renderHook(() =>
        useSearchKeyboardNav(0, vi.fn(), vi.fn())
      )

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })

      expect(result.current.focusIndex).toBe(-1)
    })
  })

  describe("ArrowUp", () => {
    it("moves focus from index 1 to 0", () => {
      const { result } = renderHook(() =>
        useSearchKeyboardNav(3, vi.fn(), vi.fn())
      )

      // Move to index 0, then 1
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })
      expect(result.current.focusIndex).toBe(1)

      // ArrowUp should go to 0
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowUp"))
      })

      expect(result.current.focusIndex).toBe(0)
    })

    it("moves focus from index 0 to -1 (input)", () => {
      const { result } = renderHook(() =>
        useSearchKeyboardNav(3, vi.fn(), vi.fn())
      )

      // Move to index 0
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })
      expect(result.current.focusIndex).toBe(0)

      // ArrowUp should go to -1
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowUp"))
      })

      expect(result.current.focusIndex).toBe(-1)
    })

    it("stays at -1 when already at input focus", () => {
      const { result } = renderHook(() =>
        useSearchKeyboardNav(3, vi.fn(), vi.fn())
      )

      expect(result.current.focusIndex).toBe(-1)

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowUp"))
      })

      expect(result.current.focusIndex).toBe(-1)
    })
  })

  describe("Enter", () => {
    it("calls onSelect with focusIndex when a result is focused", () => {
      const onSelect = vi.fn()
      const { result } = renderHook(() =>
        useSearchKeyboardNav(3, onSelect, vi.fn())
      )

      // Move to index 0
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("Enter"))
      })

      expect(onSelect).toHaveBeenCalledWith(0)
    })

    it("calls preventDefault when a result is focused", () => {
      const { result } = renderHook(() =>
        useSearchKeyboardNav(3, vi.fn(), vi.fn())
      )

      // Move to index 0
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })

      const event = createKeyboardEvent("Enter")
      act(() => {
        result.current.handleKeyDown(event)
      })

      expect(event.preventDefault).toHaveBeenCalled()
    })

    it("does NOT call onSelect when focusIndex is -1 (input)", () => {
      const onSelect = vi.fn()
      const { result } = renderHook(() =>
        useSearchKeyboardNav(3, onSelect, vi.fn())
      )

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("Enter"))
      })

      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe("Escape", () => {
    it("calls onEscape and resets focusIndex to -1", () => {
      const onEscape = vi.fn()
      const { result } = renderHook(() =>
        useSearchKeyboardNav(3, vi.fn(), onEscape)
      )

      // Move to index 1
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })
      expect(result.current.focusIndex).toBe(1)

      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("Escape"))
      })

      expect(onEscape).toHaveBeenCalled()
      expect(result.current.focusIndex).toBe(-1)
    })
  })

  describe("resultCount changes", () => {
    it("resets focusIndex to -1 when resultCount changes", () => {
      const { result, rerender } = renderHook(
        ({ count }) => useSearchKeyboardNav(count, vi.fn(), vi.fn()),
        { initialProps: { count: 5 } }
      )

      // Move to index 2
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })
      act(() => {
        result.current.handleKeyDown(createKeyboardEvent("ArrowDown"))
      })
      expect(result.current.focusIndex).toBe(2)

      // Change resultCount
      rerender({ count: 3 })

      expect(result.current.focusIndex).toBe(-1)
    })
  })

  describe("setFocusIndex", () => {
    it("allows setting focusIndex manually", () => {
      const { result } = renderHook(() =>
        useSearchKeyboardNav(5, vi.fn(), vi.fn())
      )

      act(() => {
        result.current.setFocusIndex(3)
      })

      expect(result.current.focusIndex).toBe(3)
    })
  })
})
