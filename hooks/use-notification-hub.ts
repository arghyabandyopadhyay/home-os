"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import * as signalR from "@microsoft/signalr"
import { createClientApiClient } from "@/lib/api-client"
import type { NotificationHubEvent, NotificationPage } from "@/types/notification"

type NotificationConnectionStatus = "connected" | "connecting" | "reconnecting" | "disconnected"

export type UseNotificationHubOptions = {
  enabled: boolean
  token: string
  onNotification: (event: NotificationHubEvent) => void
  onStatusChange: (status: NotificationConnectionStatus) => void
}

const MAX_RETRY_ATTEMPTS = 10
const MAX_RETRY_DELAY_MS = 30_000
const POLLING_INTERVAL_MS = 60_000

function getRetryDelay(retryCount: number): number {
  return Math.min(1000 * Math.pow(2, retryCount), MAX_RETRY_DELAY_MS)
}

export function useNotificationHub(options: UseNotificationHubOptions): {
  status: NotificationConnectionStatus
  reconnect: () => Promise<void>
} {
  const { enabled, token, onNotification, onStatusChange } = options

  const hubUrl = process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL ?? ""

  const [status, setStatus] = useState<NotificationConnectionStatus>("disconnected")
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const retriesExhaustedRef = useRef(false)
  const hubUrlRef = useRef(hubUrl)

  // Keep latest callbacks in refs to avoid re-triggering effects
  const onNotificationRef = useRef(onNotification)
  const onStatusChangeRef = useRef(onStatusChange)
  const tokenRef = useRef(token)

  useEffect(() => {
    onNotificationRef.current = onNotification
  }, [onNotification])

  useEffect(() => {
    onStatusChangeRef.current = onStatusChange
  }, [onStatusChange])

  useEffect(() => {
    tokenRef.current = token
  }, [token])

  useEffect(() => {
    hubUrlRef.current = hubUrl
  }, [hubUrl])

  const updateStatus = useCallback((newStatus: NotificationConnectionStatus) => {
    setStatus(newStatus)
    onStatusChangeRef.current(newStatus)
  }, [])

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
  }, [])

  const startPolling = useCallback(() => {
    stopPolling()
    const api = createClientApiClient()

    pollingIntervalRef.current = setInterval(async () => {
      try {
        const result = await api.get<NotificationPage>("/notifications", {
          params: { page: 1, pageSize: 5 },
        })
        // Emit each notification from the first page as if received in real-time
        if (result.notifications.length > 0) {
          for (const notification of result.notifications) {
            onNotificationRef.current({ notification })
          }
        }
      } catch {
        // Silently ignore polling errors — next interval will retry
      }
    }, POLLING_INTERVAL_MS)
  }, [stopPolling])

  const buildConnection = useCallback((): signalR.HubConnection => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrlRef.current, {
        accessTokenFactory: () => tokenRef.current,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= MAX_RETRY_ATTEMPTS) {
            return null // Stop retrying — will trigger onclose
          }
          return getRetryDelay(retryContext.previousRetryCount)
        },
      })
      .build()

    return connection
  }, [])

  const setupCallbacks = useCallback(
    (connection: signalR.HubConnection) => {
      connection.on("NotificationReceived", (event: NotificationHubEvent) => {
        onNotificationRef.current(event)
      })

      connection.onreconnecting(() => {
        updateStatus("reconnecting")
      })

      connection.onreconnected(() => {
        retriesExhaustedRef.current = false
        stopPolling()
        updateStatus("connected")
      })

      connection.onclose(() => {
        updateStatus("disconnected")
        // If retries were exhausted, start polling fallback
        if (!retriesExhaustedRef.current) {
          retriesExhaustedRef.current = true
        }
        startPolling()
      })
    },
    [updateStatus, stopPolling, startPolling]
  )

  const startConnection = useCallback(async () => {
    // Clean up any existing connection
    if (connectionRef.current) {
      try {
        await connectionRef.current.stop()
      } catch {
        // Ignore errors on cleanup
      }
      connectionRef.current = null
    }

    stopPolling()
    retriesExhaustedRef.current = false
    updateStatus("connecting")

    const connection = buildConnection()
    setupCallbacks(connection)
    connectionRef.current = connection

    try {
      await connection.start()
      updateStatus("connected")
    } catch {
      updateStatus("disconnected")
      startPolling()
    }
  }, [buildConnection, setupCallbacks, updateStatus, stopPolling, startPolling])

  // Main effect: connect when enabled, disconnect on cleanup
  useEffect(() => {
    if (!enabled || !token || !hubUrl) {
      return
    }

    startConnection()

    return () => {
      stopPolling()
      if (connectionRef.current) {
        connectionRef.current.stop().catch(() => {
          // Best effort disconnect on unmount
        })
        connectionRef.current = null
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, token])

  const reconnect = useCallback(async () => {
    stopPolling()
    retriesExhaustedRef.current = false
    await startConnection()
  }, [startConnection, stopPolling])

  return { status, reconnect }
}
