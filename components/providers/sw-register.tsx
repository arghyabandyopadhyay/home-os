"use client"

import { useEffect } from "react"

/**
 * A headless component that registers the service worker in production.
 * Renders nothing visible.
 *
 * Place this inside the app providers tree so it runs on mount.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */
export function ServiceWorkerRegister(): null {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return
    if (!("serviceWorker" in navigator)) return

    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((error) => {
      console.error("Service worker registration failed:", error)
    })
  }, [])

  return null
}
