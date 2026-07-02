import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import React from "react"

// Mock the api-client module
vi.mock("@/lib/api-client", () => ({
  createClientApiClient: () => ({
    get: vi.fn(),
    post: vi.fn().mockResolvedValue(undefined),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
  }),
}))

import { usePushManager, type PushPermissionState } from "@/hooks/use-push-manager"

/**
 * Unit tests for usePushManager hook.
 *
 * Tests:
 * - Returns "unsupported" when Push API is not available
 * - Returns correct initial permission state
 * - Detects existing subscriptions on mount
 * - subscribe() requests permission and registers service worker
 * - unsubscribe() removes subscription and calls backend
 */

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    )
  }
}

describe("usePushManager", () => {
  const originalNavigator = global.navigator
  const originalWindow = global.window
  const originalNotification = global.Notification

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original globals
    Object.defineProperty(global, "Notification", {
      value: originalNotification,
      writable: true,
      configurable: true,
    })
  })

  describe("when Push API is not supported", () => {
    beforeEach(() => {
      // Remove serviceWorker from navigator to simulate unsupported
      Object.defineProperty(navigator, "serviceWorker", {
        value: undefined,
        writable: true,
        configurable: true,
      })
    })

    afterEach(() => {
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          register: vi.fn(),
          getRegistration: vi.fn(),
          ready: Promise.resolve({}),
        },
        writable: true,
        configurable: true,
      })
    })

    it("returns 'unsupported' permission state", () => {
      const { result } = renderHook(() => usePushManager(), {
        wrapper: createWrapper(),
      })

      expect(result.current.permissionState).toBe("unsupported")
      expect(result.current.isSubscribed).toBe(false)
    })

    it("subscribe does nothing when unsupported", async () => {
      const { result } = renderHook(() => usePushManager(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.subscribe()
      })

      expect(result.current.permissionState).toBe("unsupported")
      expect(result.current.isSubscribed).toBe(false)
    })
  })

  describe("when Push API is supported", () => {
    const mockUnsubscribe = vi.fn().mockResolvedValue(true)
    const mockSubscription = {
      endpoint: "https://push.example.com/sub/123",
      unsubscribe: mockUnsubscribe,
      toJSON: () => ({
        endpoint: "https://push.example.com/sub/123",
        keys: {
          p256dh: "test-p256dh-key",
          auth: "test-auth-key",
        },
      }),
    }
    const mockGetSubscription = vi.fn().mockResolvedValue(null)
    const mockPushManagerSubscribe = vi.fn().mockResolvedValue(mockSubscription)
    const mockRegister = vi.fn().mockResolvedValue({
      pushManager: {
        subscribe: mockPushManagerSubscribe,
        getSubscription: mockGetSubscription,
      },
    })
    const mockGetRegistration = vi.fn().mockResolvedValue(null)

    beforeEach(() => {
      // Set up serviceWorker support
      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          register: mockRegister,
          getRegistration: mockGetRegistration,
          ready: Promise.resolve({
            pushManager: {
              subscribe: mockPushManagerSubscribe,
              getSubscription: mockGetSubscription,
            },
          }),
        },
        writable: true,
        configurable: true,
      })

      // Set up PushManager in window
      Object.defineProperty(window, "PushManager", {
        value: class PushManager {},
        writable: true,
        configurable: true,
      })

      // Set up Notification with default permission
      Object.defineProperty(global, "Notification", {
        value: {
          permission: "default",
          requestPermission: vi.fn().mockResolvedValue("granted"),
        },
        writable: true,
        configurable: true,
      })
    })

    it("returns 'default' permission state initially", () => {
      const { result } = renderHook(() => usePushManager(), {
        wrapper: createWrapper(),
      })

      expect(result.current.permissionState).toBe("default")
      expect(result.current.isSubscribed).toBe(false)
    })

    it("detects existing subscription on mount", async () => {
      const existingSubscription = { endpoint: "https://example.com/push" }
      const mockRegistrationWithSub = {
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(existingSubscription),
        },
      }
      mockGetRegistration.mockResolvedValue(mockRegistrationWithSub)

      const { result } = renderHook(() => usePushManager(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.isSubscribed).toBe(true)
      })
    })

    it("returns granted permission state when permission already granted", () => {
      Object.defineProperty(global, "Notification", {
        value: {
          permission: "granted",
          requestPermission: vi.fn().mockResolvedValue("granted"),
        },
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => usePushManager(), {
        wrapper: createWrapper(),
      })

      expect(result.current.permissionState).toBe("granted")
    })

    it("returns denied permission state when permission denied", () => {
      Object.defineProperty(global, "Notification", {
        value: {
          permission: "denied",
          requestPermission: vi.fn().mockResolvedValue("denied"),
        },
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => usePushManager(), {
        wrapper: createWrapper(),
      })

      expect(result.current.permissionState).toBe("denied")
    })

    it("subscribe requests permission and registers when granted", async () => {
      const { result } = renderHook(() => usePushManager(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.subscribe()
      })

      expect(Notification.requestPermission).toHaveBeenCalled()
      expect(mockRegister).toHaveBeenCalledWith("/sw-notifications.js")
      expect(result.current.permissionState).toBe("granted")
      expect(result.current.isSubscribed).toBe(true)
    })

    it("subscribe does not register when permission denied", async () => {
      // Reset getRegistration to return null (no existing subscription)
      mockGetRegistration.mockResolvedValue(null)

      Object.defineProperty(global, "Notification", {
        value: {
          permission: "default",
          requestPermission: vi.fn().mockResolvedValue("denied"),
        },
        writable: true,
        configurable: true,
      })

      const { result } = renderHook(() => usePushManager(), {
        wrapper: createWrapper(),
      })

      await act(async () => {
        await result.current.subscribe()
      })

      expect(mockRegister).not.toHaveBeenCalled()
      expect(result.current.permissionState).toBe("denied")
      expect(result.current.isSubscribed).toBe(false)
    })

    it("unsubscribe removes subscription and updates state", async () => {
      // Set up existing subscription
      const mockRegistrationWithSub = {
        pushManager: {
          getSubscription: vi.fn().mockResolvedValue(mockSubscription),
        },
      }
      mockGetRegistration.mockResolvedValue(mockRegistrationWithSub)

      const { result } = renderHook(() => usePushManager(), {
        wrapper: createWrapper(),
      })

      // Wait for mount effect to detect subscription
      await waitFor(() => {
        expect(result.current.isSubscribed).toBe(true)
      })

      await act(async () => {
        await result.current.unsubscribe()
      })

      expect(mockUnsubscribe).toHaveBeenCalled()
      expect(result.current.isSubscribed).toBe(false)
    })
  })
})
