import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useDebouncedValue } from "@/hooks/use-debounced-value"

/**
 * Unit tests for the useDebouncedValue hook.
 *
 * Tests that:
 * - The hook returns the initial value immediately
 * - The debounced value updates after the specified delay
 * - Rapid value changes only result in the final value being set
 * - Timeout is cleaned up on unmount
 * - Timeout is cleaned up when value changes before delay expires
 */

describe("useDebouncedValue hook", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("hello", 300))
    expect(result.current).toBe("hello")
  })

  it("updates the debounced value after the specified delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "initial", delay: 300 } }
    )

    expect(result.current).toBe("initial")

    rerender({ value: "updated", delay: 300 })

    // Before delay expires, should still be the old value
    expect(result.current).toBe("initial")

    // Advance time past the delay
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(result.current).toBe("updated")
  })

  it("does not update the value before the delay expires", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "initial", delay: 500 } }
    )

    rerender({ value: "updated", delay: 500 })

    // Advance time but not enough
    act(() => {
      vi.advanceTimersByTime(499)
    })

    expect(result.current).toBe("initial")
  })

  it("only applies the latest value when multiple changes occur within the delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "a", delay: 300 } }
    )

    rerender({ value: "b", delay: 300 })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    rerender({ value: "c", delay: 300 })
    act(() => {
      vi.advanceTimersByTime(100)
    })

    rerender({ value: "d", delay: 300 })

    // Should still be the initial value
    expect(result.current).toBe("a")

    // Advance past the delay from the last change
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Only the final value should be applied
    expect(result.current).toBe("d")
  })

  it("cleans up timeout on unmount", () => {
    const clearTimeoutSpy = vi.spyOn(global, "clearTimeout")

    const { unmount, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "initial", delay: 300 } }
    )

    rerender({ value: "changed", delay: 300 })
    unmount()

    // clearTimeout should have been called during cleanup
    expect(clearTimeoutSpy).toHaveBeenCalled()

    clearTimeoutSpy.mockRestore()
  })

  it("works with different types (number)", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: 42, delay: 200 } }
    )

    expect(result.current).toBe(42)

    rerender({ value: 100, delay: 200 })

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe(100)
  })

  it("resets the timer when delay changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebouncedValue(value, delay),
      { initialProps: { value: "initial", delay: 300 } }
    )

    rerender({ value: "updated", delay: 300 })

    // Advance 200ms
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // Change the delay — this should reset the timer
    rerender({ value: "updated", delay: 500 })

    // Advance another 300ms (total 500ms from first change, but timer was reset)
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // Should still not have updated (need 500ms from the delay change)
    expect(result.current).toBe("initial")

    // Advance the remaining time
    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe("updated")
  })
})
