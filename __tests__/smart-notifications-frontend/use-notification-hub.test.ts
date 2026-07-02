import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"

// Store callbacks for simulating SignalR events
let onReconnectingCb: (() => void) | null = null
let onReconnectedCb: (() => void) | null = null
let onCloseCb: (() => void) | null = null
let notificationReceivedHandler: ((event: unknown) => void) | null = null

const mockStart = vi.fn<() => Promise<void>>()
const mockStop = vi.fn<() => Promise<void>>()

let capturedWithUrlArgs: unknown[] = []
let capturedReconnectPolicy: {
  nextRetryDelayInMilliseconds: (ctx: { previousRetryCount: number }) => number | null
} | null = null

vi.mock("@microsoft/signalr", () => {
  return {
    HubConnectionBuilder: class {
      withUrl(...args: unknown[]) {
        capturedWithUrlArgs = args
        return this
      }
      withAutomaticReconnect(policy: unknown) {
        capturedReconnectPolicy = policy as typeof capturedReconnectPolicy
        return this
      }
      build() {
        return {
          start: mockStart,
          stop: mockStop,
          on(event: string, handler: (event: unknown) => void) {
            if (event === "NotificationReceived") {
              notificationReceivedHandler = handler
            }
          },
          off: vi.fn(),
          onreconnecting(cb: () => void) {
            onReconnectingCb = cb
          },
          onreconnected(cb: () => void) {
            onReconnectedCb = cb
          },
          onclose(cb: () => void) {
            onCloseCb = cb
          },
        }
      }
    },
    HttpTransportType: {
      WebSockets: 1,
      ServerSentEvents: 2,
      LongPolling: 4,
    },
    HubConnectionState: {
      Connected: "Connected",
      Disconnected: "Disconnected",
      Reconnecting: "Reconnecting",
      Connecting: "Connecting",
    },
  }
})

vi.mock("@/lib/api-client", () => ({
  createClientApiClient: () => ({
    get: vi.fn().mockResolvedValue({
      notifications: [],
      totalCount: 0,
      page: 1,
      pageSize: 5,
      hasNextPage: false,
    }),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  }),
}))

// Set env before importing
process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL = "http://localhost:5000/hubs/notifications"

import { useNotificationHub } from "@/hooks/use-notification-hub"

describe("useNotificationHub", () => {
  let defaultOptions: {
    enabled: boolean
    token: string
    onNotification: ReturnType<typeof vi.fn>
    onStatusChange: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    mockStart.mockResolvedValue(undefined)
    mockStop.mockResolvedValue(undefined)
    onReconnectingCb = null
    onReconnectedCb = null
    onCloseCb = null
    notificationReceivedHandler = null
    capturedWithUrlArgs = []
    capturedReconnectPolicy = null

    defaultOptions = {
      enabled: true,
      token: "test-token-123",
      onNotification: vi.fn(),
      onStatusChange: vi.fn(),
    }
  })

  it("starts with disconnected status", () => {
    const { result } = renderHook(() =>
      useNotificationHub({ ...defaultOptions, enabled: false })
    )

    expect(result.current.status).toBe("disconnected")
  })

  it("does not connect when enabled is false", async () => {
    renderHook(() =>
      useNotificationHub({ ...defaultOptions, enabled: false })
    )

    // Give effect time to run (it shouldn't)
    await waitFor(() => {
      expect(mockStart).not.toHaveBeenCalled()
    })
  })

  it("does not connect when token is empty", async () => {
    renderHook(() =>
      useNotificationHub({ ...defaultOptions, token: "" })
    )

    await waitFor(() => {
      expect(mockStart).not.toHaveBeenCalled()
    })
  })

  it("builds connection with correct URL and access token factory", async () => {
    renderHook(() => useNotificationHub(defaultOptions))

    await waitFor(() => {
      expect(capturedWithUrlArgs.length).toBeGreaterThan(0)
    })

    expect(capturedWithUrlArgs[0]).toBe("http://localhost:5000/hubs/notifications")
    expect(capturedWithUrlArgs[1]).toHaveProperty("accessTokenFactory")
    const factory = (capturedWithUrlArgs[1] as { accessTokenFactory: () => string }).accessTokenFactory
    expect(factory()).toBe("test-token-123")
  })

  it("configures withAutomaticReconnect with custom retry policy", async () => {
    renderHook(() => useNotificationHub(defaultOptions))

    await waitFor(() => {
      expect(capturedReconnectPolicy).not.toBeNull()
    })

    expect(capturedReconnectPolicy!.nextRetryDelayInMilliseconds).toBeTypeOf("function")
  })

  it("custom retry policy returns exponential backoff capped at 30s", async () => {
    renderHook(() => useNotificationHub(defaultOptions))

    await waitFor(() => {
      expect(capturedReconnectPolicy).not.toBeNull()
    })

    const getDelay = capturedReconnectPolicy!.nextRetryDelayInMilliseconds

    // 1s, 2s, 4s, 8s, 16s, 30s (capped), 30s...
    expect(getDelay({ previousRetryCount: 0 })).toBe(1000)
    expect(getDelay({ previousRetryCount: 1 })).toBe(2000)
    expect(getDelay({ previousRetryCount: 2 })).toBe(4000)
    expect(getDelay({ previousRetryCount: 3 })).toBe(8000)
    expect(getDelay({ previousRetryCount: 4 })).toBe(16000)
    expect(getDelay({ previousRetryCount: 5 })).toBe(30000) // capped
    expect(getDelay({ previousRetryCount: 6 })).toBe(30000) // still capped
    expect(getDelay({ previousRetryCount: 9 })).toBe(30000) // last valid attempt
  })

  it("custom retry policy returns null after 10 attempts", async () => {
    renderHook(() => useNotificationHub(defaultOptions))

    await waitFor(() => {
      expect(capturedReconnectPolicy).not.toBeNull()
    })

    const getDelay = capturedReconnectPolicy!.nextRetryDelayInMilliseconds

    expect(getDelay({ previousRetryCount: 10 })).toBeNull()
    expect(getDelay({ previousRetryCount: 15 })).toBeNull()
  })

  it("registers NotificationReceived handler on connection", async () => {
    renderHook(() => useNotificationHub(defaultOptions))

    await waitFor(() => {
      expect(notificationReceivedHandler).toBeTypeOf("function")
    })
  })

  it("calls onNotification when NotificationReceived fires", async () => {
    renderHook(() => useNotificationHub(defaultOptions))

    await waitFor(() => {
      expect(notificationReceivedHandler).toBeTypeOf("function")
    })

    const event = {
      notification: {
        id: "1",
        type: "task_due",
        title: "Test",
        body: "Body",
        read: false,
        dismissed: false,
        targetRoute: null,
        createdAt: new Date().toISOString(),
        metadata: {},
      },
    }

    act(() => {
      notificationReceivedHandler!(event)
    })

    expect(defaultOptions.onNotification).toHaveBeenCalledWith(event)
  })

  it("transitions to connecting then connected on successful start", async () => {
    const { result } = renderHook(() => useNotificationHub(defaultOptions))

    await waitFor(() => {
      expect(result.current.status).toBe("connected")
    })

    expect(defaultOptions.onStatusChange).toHaveBeenCalledWith("connecting")
    expect(defaultOptions.onStatusChange).toHaveBeenCalledWith("connected")
  })

  it("transitions to disconnected when connection start fails", async () => {
    mockStart.mockRejectedValueOnce(new Error("Connection failed"))

    const { result } = renderHook(() => useNotificationHub(defaultOptions))

    await waitFor(() => {
      expect(result.current.status).toBe("disconnected")
    })

    expect(defaultOptions.onStatusChange).toHaveBeenCalledWith("connecting")
    expect(defaultOptions.onStatusChange).toHaveBeenCalledWith("disconnected")
  })

  it("calls onStatusChange with reconnecting when onreconnecting fires", async () => {
    const { result } = renderHook(() => useNotificationHub(defaultOptions))

    await waitFor(() => {
      expect(result.current.status).toBe("connected")
    })

    act(() => {
      onReconnectingCb?.()
    })

    expect(defaultOptions.onStatusChange).toHaveBeenCalledWith("reconnecting")
    expect(result.current.status).toBe("reconnecting")
  })

  it("calls onStatusChange with connected when onreconnected fires", async () => {
    const { result } = renderHook(() => useNotificationHub(defaultOptions))

    await waitFor(() => {
      expect(result.current.status).toBe("connected")
    })

    // Simulate going to reconnecting first
    act(() => {
      onReconnectingCb?.()
    })

    defaultOptions.onStatusChange.mockClear()

    act(() => {
      onReconnectedCb?.()
    })

    expect(defaultOptions.onStatusChange).toHaveBeenCalledWith("connected")
    expect(result.current.status).toBe("connected")
  })

  it("calls onStatusChange with disconnected when connection closes", async () => {
    const { result } = renderHook(() => useNotificationHub(defaultOptions))

    await waitFor(() => {
      expect(result.current.status).toBe("connected")
    })

    act(() => {
      onCloseCb?.()
    })

    expect(defaultOptions.onStatusChange).toHaveBeenCalledWith("disconnected")
    expect(result.current.status).toBe("disconnected")
  })

  it("stops connection on unmount", async () => {
    const { result, unmount } = renderHook(() => useNotificationHub(defaultOptions))

    await waitFor(() => {
      expect(result.current.status).toBe("connected")
    })

    unmount()

    expect(mockStop).toHaveBeenCalled()
  })

  it("reconnect() restarts the connection", async () => {
    const { result } = renderHook(() => useNotificationHub(defaultOptions))

    await waitFor(() => {
      expect(result.current.status).toBe("connected")
    })

    mockStart.mockClear()
    mockStop.mockClear()
    mockStart.mockResolvedValue(undefined)
    mockStop.mockResolvedValue(undefined)

    await act(async () => {
      await result.current.reconnect()
    })

    expect(mockStop).toHaveBeenCalled()
    expect(mockStart).toHaveBeenCalled()
  })

  it("exposes reconnect as a function", async () => {
    const { result } = renderHook(() => useNotificationHub(defaultOptions))

    await waitFor(() => {
      expect(result.current.status).toBe("connected")
    })

    expect(typeof result.current.reconnect).toBe("function")
  })
})
