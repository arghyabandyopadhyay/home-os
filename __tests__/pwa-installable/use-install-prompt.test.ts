import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"

/**
 * Unit tests for the useInstallPrompt hook.
 * Validates: Requirements 6.1, 6.3, 6.4, 6.5, 6.6
 *
 * Tests that:
 * - The hook captures the beforeinstallprompt event and stores the deferred prompt
 * - Standalone mode is detected via media query and navigator.standalone
 * - Platform detection works for iOS, Android, and desktop
 * - promptInstall() triggers the deferred prompt and handles acceptance/dismissal
 * - Errors in prompt() are caught and logged
 */

describe("useInstallPrompt hook", () => {
  let standaloneListeners: Array<(event: MediaQueryListEvent) => void> = []
  let standaloneMatches = false
  let windowListeners: Record<string, Array<(event: Event) => void>> = {}

  beforeEach(() => {
    standaloneListeners = []
    standaloneMatches = false
    windowListeners = {}

    // Mock matchMedia for standalone detection
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(display-mode: standalone)" ? standaloneMatches : false,
        media: query,
        addEventListener: (_event: string, handler: (event: MediaQueryListEvent) => void) => {
          standaloneListeners.push(handler)
        },
        removeEventListener: (_event: string, handler: (event: MediaQueryListEvent) => void) => {
          standaloneListeners = standaloneListeners.filter((l) => l !== handler)
        },
      })),
    })

    // Mock window.addEventListener/removeEventListener for beforeinstallprompt
    const originalAddEventListener = window.addEventListener.bind(window)
    const originalRemoveEventListener = window.removeEventListener.bind(window)

    vi.spyOn(window, "addEventListener").mockImplementation((type: string, handler: EventListenerOrEventListenerObject) => {
      if (type === "beforeinstallprompt") {
        if (!windowListeners[type]) windowListeners[type] = []
        windowListeners[type].push(handler as (event: Event) => void)
      } else {
        originalAddEventListener(type, handler)
      }
    })

    vi.spyOn(window, "removeEventListener").mockImplementation((type: string, handler: EventListenerOrEventListenerObject) => {
      if (type === "beforeinstallprompt") {
        if (windowListeners[type]) {
          windowListeners[type] = windowListeners[type].filter((l) => l !== handler)
        }
      } else {
        originalRemoveEventListener(type, handler)
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  function createMockPromptEvent(outcome: "accepted" | "dismissed" = "accepted") {
    const event = new Event("beforeinstallprompt", { cancelable: true })
    Object.defineProperty(event, "platforms", { value: ["web"] })
    Object.defineProperty(event, "userChoice", {
      value: Promise.resolve({ outcome, platform: "web" }),
    })
    Object.defineProperty(event, "prompt", {
      value: vi.fn().mockResolvedValue(undefined),
    })
    return event
  }

  it("returns canInstall=false initially when no beforeinstallprompt event has fired", async () => {
    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.canInstall).toBe(false)
    expect(result.current.isPrompting).toBe(false)
  })

  it("returns isStandalone=false when not in standalone mode", async () => {
    standaloneMatches = false
    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.isStandalone).toBe(false)
  })

  it("returns isStandalone=true when in standalone mode", async () => {
    standaloneMatches = true
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query === "(display-mode: standalone)" ? true : false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.isStandalone).toBe(true)
  })

  it("sets canInstall=true after beforeinstallprompt event fires", async () => {
    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.canInstall).toBe(false)

    // Simulate beforeinstallprompt event
    const mockEvent = createMockPromptEvent()
    act(() => {
      windowListeners["beforeinstallprompt"]?.forEach((handler) => handler(mockEvent))
    })

    expect(result.current.canInstall).toBe(true)
  })

  it("prevents default on beforeinstallprompt event", async () => {
    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    renderHook(() => useInstallPrompt())

    const mockEvent = createMockPromptEvent()
    const preventDefaultSpy = vi.spyOn(mockEvent, "preventDefault")

    act(() => {
      windowListeners["beforeinstallprompt"]?.forEach((handler) => handler(mockEvent))
    })

    expect(preventDefaultSpy).toHaveBeenCalled()
  })

  it("handles prompt acceptance: hides install option and clears deferred prompt", async () => {
    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { result } = renderHook(() => useInstallPrompt())

    // Fire beforeinstallprompt
    const mockEvent = createMockPromptEvent("accepted")
    act(() => {
      windowListeners["beforeinstallprompt"]?.forEach((handler) => handler(mockEvent))
    })

    expect(result.current.canInstall).toBe(true)

    // Trigger install prompt
    await act(async () => {
      await result.current.promptInstall()
    })

    // After acceptance, canInstall should be false
    expect(result.current.canInstall).toBe(false)
    expect(result.current.isPrompting).toBe(false)
  })

  it("handles prompt dismissal: re-enables install option and retains deferred prompt", async () => {
    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { result } = renderHook(() => useInstallPrompt())

    // Fire beforeinstallprompt with dismissal outcome
    const mockEvent = createMockPromptEvent("dismissed")
    act(() => {
      windowListeners["beforeinstallprompt"]?.forEach((handler) => handler(mockEvent))
    })

    expect(result.current.canInstall).toBe(true)

    // Trigger install prompt
    await act(async () => {
      await result.current.promptInstall()
    })

    // After dismissal, canInstall should still be true (prompt retained)
    expect(result.current.canInstall).toBe(true)
    expect(result.current.isPrompting).toBe(false)
  })

  it("handles prompt() errors: catches, re-enables button, logs to console", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { result } = renderHook(() => useInstallPrompt())

    // Create a mock event where prompt() throws
    const mockEvent = new Event("beforeinstallprompt", { cancelable: true })
    Object.defineProperty(mockEvent, "platforms", { value: ["web"] })
    Object.defineProperty(mockEvent, "userChoice", {
      value: Promise.resolve({ outcome: "dismissed", platform: "web" }),
    })
    Object.defineProperty(mockEvent, "prompt", {
      value: vi.fn().mockRejectedValue(new Error("Prompt failed")),
    })

    act(() => {
      windowListeners["beforeinstallprompt"]?.forEach((handler) => handler(mockEvent))
    })

    // Trigger install prompt (should catch error)
    await act(async () => {
      await result.current.promptInstall()
    })

    // Should log error and re-enable button
    expect(consoleErrorSpy).toHaveBeenCalledWith("Install prompt error:", expect.any(Error))
    expect(result.current.isPrompting).toBe(false)

    consoleErrorSpy.mockRestore()
  })

  it("does nothing when promptInstall is called without a deferred prompt", async () => {
    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { result } = renderHook(() => useInstallPrompt())

    // No beforeinstallprompt event fired, so no deferred prompt
    await act(async () => {
      await result.current.promptInstall()
    })

    expect(result.current.isPrompting).toBe(false)
    expect(result.current.canInstall).toBe(false)
  })

  it("responds to standalone mode changes via media query", async () => {
    standaloneMatches = false
    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.isStandalone).toBe(false)

    // Simulate entering standalone mode
    act(() => {
      standaloneListeners.forEach((listener) =>
        listener({ matches: true } as MediaQueryListEvent)
      )
    })

    expect(result.current.isStandalone).toBe(true)
  })
})

describe("useInstallPrompt platform detection", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.resetModules()
  })

  function setupMocks() {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    })

    vi.spyOn(window, "addEventListener").mockImplementation(() => {})
    vi.spyOn(window, "removeEventListener").mockImplementation(() => {})
  }

  it("detects iOS platform from iPhone user agent", async () => {
    setupMocks()
    Object.defineProperty(navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)",
    })

    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.platform).toBe("ios")
  })

  it("detects iOS platform from iPad user agent", async () => {
    setupMocks()
    Object.defineProperty(navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)",
    })

    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.platform).toBe("ios")
  })

  it("detects Android platform", async () => {
    setupMocks()
    Object.defineProperty(navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (Linux; Android 13; Pixel 7)",
    })

    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.platform).toBe("android")
  })

  it("detects desktop platform from Windows user agent", async () => {
    setupMocks()
    Object.defineProperty(navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    })

    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.platform).toBe("desktop")
  })

  it("detects desktop platform from macOS user agent", async () => {
    setupMocks()
    Object.defineProperty(navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    })

    const { useInstallPrompt } = await import("@/hooks/use-install-prompt")
    const { result } = renderHook(() => useInstallPrompt())

    expect(result.current.platform).toBe("desktop")
  })
})
