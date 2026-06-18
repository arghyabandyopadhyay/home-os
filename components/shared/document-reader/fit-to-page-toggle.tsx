"use client"

import { Maximize, Minimize } from "lucide-react"

type FitToPageToggleProps = {
  enabled: boolean
  onToggle: () => void
}

export function FitToPageToggle({ enabled, onToggle }: FitToPageToggleProps) {
  return (
    <button
      onClick={onToggle}
      aria-pressed={enabled}
      aria-label={`Fit to page, ${enabled ? "enabled" : "disabled"}`}
      className={`flex h-11 w-11 items-center justify-center rounded-lg transition-colors ${
        enabled
          ? "bg-app-elevated text-app"
          : "text-app-muted hover:bg-app-elevated hover:text-app"
      }`}
    >
      {enabled ? <Minimize size={20} /> : <Maximize size={20} />}
    </button>
  )
}
