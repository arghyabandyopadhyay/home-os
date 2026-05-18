"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * Browser-provided event fired when the app meets PWA installability criteria.
 * Not in standard TypeScript lib types, so we define it here.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
  prompt(): Promise<void>
}

type Platform = "ios" | "android" | "desktop" | "unknown"

type InstallPromptState = {
  /** Whether the deferred prompt is available */
  canInstall: boolean
  /** Whether the app is already running in standalone mode */
  isStandalone: boolean
  /** Whether the install prompt is currently showing */
  isPrompting: boolean
  /** Trigger the native install prompt */
  promptInstall: () => Promise<void>
  /** Platform hint for manual instructions (ios | android | desktop | unknown) */
  platform: Platform
}

/**
 * Detect the user's platform from the user agent string.
 * Used to show platform-specific manual install instructions.
 */
function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "unknown"

  const ua = navigator.userAgent

  // iOS detection: iPhone, iPad, iPod
  if (/iPhone|iPad|iPod/.test(ua)) return "ios"

  // Android detection
  if (/Android/.test(ua)) return "android"

  // Desktop fallback — if it's not mobile, treat as desktop
  if (/Windows|Macintosh|Linux/.test(ua)) return "desktop"

  return "unknown"
}

/**
 * Detect whether the app is running in standalone (installed PWA) mode.
 * Checks both the standard media query and the iOS-specific navigator property.
 */
function getIsStandalone(): boolean {
  if (typeof window === "undefined") return false

  // Standard check via media query
  const standaloneMedia = window.matchMedia("(display-mode: standalone)")
  if (standaloneMedia.matches) return true

  // iOS Safari check
  if ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true) {
    return true
  }

  return false
}

/**
 * Custom hook that captures the browser's `beforeinstallprompt` event and
 * exposes install state for the settings UI.
 *
 * - Captures and defers the install prompt for later use
 * - Detects standalone mode via `(display-mode: standalone)` media query
 * - Detects platform (ios, android, desktop, unknown) via user agent
 * - Handles prompt acceptance, dismissal, and errors
 *
 * Validates: Requirements 6.1, 6.3, 6.4, 6.5, 6.6
 */
export function useInstallPrompt(): InstallPromptState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isPrompting, setIsPrompting] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [platform] = useState<Platform>(() => detectPlatform())

  // Detect standalone mode on mount and listen for changes
  useEffect(() => {
    setIsStandalone(getIsStandalone())

    const standaloneMedia = window.matchMedia("(display-mode: standalone)")
    const handler = (event: MediaQueryListEvent) => {
      setIsStandalone(event.matches)
    }

    standaloneMedia.addEventListener("change", handler)
    return () => standaloneMedia.removeEventListener("change", handler)
  }, [])

  // Capture the beforeinstallprompt event
  useEffect(() => {
    const handler = (event: Event) => {
      // Prevent the default mini-infobar from appearing
      event.preventDefault()
      // Store the deferred prompt for later use
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handler)
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  // Trigger the native install prompt
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return

    try {
      setIsPrompting(true)

      // Show the install prompt
      await deferredPrompt.prompt()

      // Wait for the user's choice
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        // User accepted — hide install option, clear deferred prompt
        setDeferredPrompt(null)
      }
      // If dismissed — re-enable install option, retain deferred prompt (no action needed)
    } catch (error) {
      // Handle prompt() errors — re-enable button, log to console
      console.error("Install prompt error:", error)
    } finally {
      setIsPrompting(false)
    }
  }, [deferredPrompt])

  return {
    canInstall: deferredPrompt !== null,
    isStandalone,
    isPrompting,
    promptInstall,
    platform,
  }
}
