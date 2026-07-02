"use client"

import { AlertTriangle } from "lucide-react"

type SearchErrorProps = {
  message?: string
  onRetry: () => void
}

export function SearchError({
  message = "Search failed. Please try again.",
  onRetry,
}: SearchErrorProps) {
  return (
    <div className="flex min-h-[300px] items-center justify-center p-16">
      <div className="flex flex-col items-center text-center">
        <AlertTriangle className="mb-4 h-12 w-12 text-app-muted" />
        <p className="text-sm text-app-muted">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="btn-primary-app mt-6 px-5 py-2.5 text-sm"
        >
          Retry
        </button>
      </div>
    </div>
  )
}
