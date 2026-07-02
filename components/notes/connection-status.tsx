"use client"

import { useState, useEffect } from "react"
import type { ConnectionStatus } from "@/types/collaboration"

type ConnectionStatusIndicatorProps = {
  status: ConnectionStatus
  onReconnect: () => void
}

export function ConnectionStatusIndicator({ status, onReconnect }: ConnectionStatusIndicatorProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2"
    >
      <StatusContent key={status} status={status} onReconnect={onReconnect} />
    </div>
  )
}

/**
 * Inner component keyed by status to reset the auto-collapse timer
 * whenever the connection status changes.
 */
function StatusContent({ status, onReconnect }: ConnectionStatusIndicatorProps) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    if (status !== "connected") return

    const timer = setTimeout(() => {
      setCollapsed(true)
    }, 3000)

    return () => clearTimeout(timer)
  }, [status])

  const dotClass = getDotClass(status)
  const label = getLabel(status, collapsed)

  return (
    <>
      <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} />
      {label && (
        <span className="text-xs text-app-muted">{label}</span>
      )}
      {status === "disconnected" && (
        <button
          type="button"
          onClick={onReconnect}
          className="text-xs text-app-muted underline hover:text-app"
        >
          Reconnect
        </button>
      )}
    </>
  )
}

function getDotClass(status: ConnectionStatus): string {
  switch (status) {
    case "connected":
      return "bg-emerald-500"
    case "connecting":
    case "reconnecting":
      return "bg-amber-500 animate-pulse"
    case "disconnected":
      return "bg-red-500"
  }
}

function getLabel(status: ConnectionStatus, collapsed: boolean): string | null {
  switch (status) {
    case "connected":
      return collapsed ? null : "Connected"
    case "connecting":
      return "Connecting..."
    case "reconnecting":
      return "Reconnecting..."
    case "disconnected":
      return "Offline"
  }
}
