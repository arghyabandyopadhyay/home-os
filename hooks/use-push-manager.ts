"use client"

import { useState, useEffect, useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import { createClientApiClient } from "@/lib/api-client"
import type { PushSubscriptionPayload } from "@/types/notification"

export type PushPermissionState = "granted" | "denied" | "default" | "unsupported"

const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
const SERVICE_WORKER_PATH = "/sw-notifications.js"

const api = createClientApiClient()

/**
 * Converts a base64-encoded VAPID public key to a Uint8Array
 * suitable for the applicationServerKey option in pushManager.subscribe().
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Checks whether the Push API and Service Worker API are supported in this browser.
 */
function isPushSupported(): boolean {
  if (typeof window === "undefined") return false
  return "serviceWorker" in navigator && "PushManager" in window
}

/**
 * Extracts the subscription keys from a PushSubscription into the payload
 * format expected by the backend.
 */
function extractSubscriptionPayload(subscription: PushSubscription): PushSubscriptionPayload {
  const json = subscription.toJSON()
  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    },
  }
}

/**
 * Hook that manages Web Push notification subscription state.
 *
 * Handles:
 * - Detecting Push API support
 * - Tracking permission state
 * - Subscribing to push notifications (service worker registration + VAPID key)
 * - Unsubscribing from push notifications
 * - Coordinating with backend via push subscription API
 */
export function usePushManager(): {
  permissionState: PushPermissionState
  isSubscribed: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
} {
  const [permissionState, setPermissionState] = useState<PushPermissionState>(() => {
    if (!isPushSupported()) return "unsupported"
    if (typeof Notification !== "undefined") {
      return Notification.permission as PushPermissionState
    }
    return "default"
  })
  const [isSubscribed, setIsSubscribed] = useState(false)

  // Mutation: register push subscription with backend
  const pushSubscriptionMutation = useMutation({
    mutationFn: (payload: PushSubscriptionPayload) =>
      api.post<void>("/notifications/push-subscription", { body: payload }),
  })

  // Mutation: remove push subscription from backend
  const removePushSubscriptionMutation = useMutation({
    mutationFn: () => api.delete<void>("/notifications/push-subscription"),
  })

  // Check for existing subscription on mount
  useEffect(() => {
    if (!isPushSupported()) return

    async function checkExistingSubscription() {
      try {
        const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH)
        if (!registration) {
          setIsSubscribed(false)
          return
        }
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(subscription !== null)
      } catch {
        setIsSubscribed(false)
      }
    }

    checkExistingSubscription()
  }, [])

  // Update permission state when it changes (e.g., user grants/denies in browser prompt)
  useEffect(() => {
    if (!isPushSupported()) return
    if (typeof Notification === "undefined") return

    setPermissionState(Notification.permission as PushPermissionState)
  }, [])

  const subscribe = useCallback(async () => {
    if (!isPushSupported()) return

    // Request notification permission
    const permission = await Notification.requestPermission()
    setPermissionState(permission as PushPermissionState)

    if (permission !== "granted") return

    // Register service worker
    const registration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH)
    await navigator.serviceWorker.ready

    // Subscribe to push manager
    const applicationServerKey = urlBase64ToUint8Array(VAPID_KEY)
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
    })

    // Extract keys and send to backend
    const payload = extractSubscriptionPayload(subscription)
    await pushSubscriptionMutation.mutateAsync(payload)

    setIsSubscribed(true)
  }, [pushSubscriptionMutation])

  const unsubscribe = useCallback(async () => {
    if (!isPushSupported()) return

    try {
      const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH)
      if (!registration) return

      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
      }

      // Remove subscription from backend
      await removePushSubscriptionMutation.mutateAsync()

      setIsSubscribed(false)
    } catch {
      // If unsubscribe fails, still update local state
      setIsSubscribed(false)
    }
  }, [removePushSubscriptionMutation])

  return {
    permissionState,
    isSubscribed,
    subscribe,
    unsubscribe,
  }
}
