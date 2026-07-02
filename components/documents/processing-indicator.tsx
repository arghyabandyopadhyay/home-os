"use client"

import { Clock, Loader2, CheckCircle2, AlertTriangle } from "lucide-react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { ProcessingStatus, PipelineStage } from "@/types/document"

type ProcessingIndicatorProps = {
  status: ProcessingStatus
  currentStage: PipelineStage | null
  onRetry?: () => void
  retryLoading?: boolean
}

function formatStage(stage: PipelineStage): string {
  switch (stage) {
    case "scanning":
      return "Scanning"
    case "ocr":
      return "OCR"
    case "text_extraction":
      return "Text Extraction"
    case "indexing":
      return "Indexing"
  }
}

function getAriaLabel(status: ProcessingStatus, currentStage: PipelineStage | null): string {
  if (status === "processing" && currentStage) {
    return `Processing status: Processing, stage: ${formatStage(currentStage)}`
  }
  const labels: Record<ProcessingStatus, string> = {
    pending: "Processing status: Pending",
    processing: "Processing status: Processing",
    ready: "Processing status: Ready",
    failed: "Processing status: Failed",
  }
  return labels[status]
}

export function ProcessingIndicator({
  status,
  currentStage,
  onRetry,
  retryLoading,
}: ProcessingIndicatorProps) {
  const reducedMotion = useReducedMotion()

  return (
    <div
      className="flex items-center gap-1.5"
      aria-label={getAriaLabel(status, currentStage)}
      role="status"
    >
      {status === "pending" && (
        <>
          <Clock size={14} className="text-app-muted" aria-hidden="true" />
          <span className="text-xs text-app-muted">Pending</span>
        </>
      )}

      {status === "processing" && (
        <>
          <Loader2
            size={14}
            className={`text-blue-600 dark:text-blue-400${reducedMotion ? "" : " animate-spin"}`}
            aria-hidden="true"
          />
          <span className="text-xs text-blue-600 dark:text-blue-400">
            Processing{currentStage ? ` · ${formatStage(currentStage)}` : ""}
          </span>
        </>
      )}

      {status === "ready" && (
        <>
          <CheckCircle2
            size={14}
            className="text-green-600 dark:text-green-400"
            aria-hidden="true"
          />
          <span className="text-xs text-green-600 dark:text-green-400">Ready</span>
        </>
      )}

      {status === "failed" && (
        <>
          <AlertTriangle
            size={14}
            className="text-red-600 dark:text-red-400"
            aria-hidden="true"
          />
          <span className="text-xs text-red-600 dark:text-red-400">Failed</span>
          {onRetry && (
            <button
              onClick={onRetry}
              disabled={retryLoading}
              className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium text-red-600 hover:bg-red-500/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500 disabled:opacity-50 dark:text-red-400"
            >
              {retryLoading && (
                <Loader2
                  size={12}
                  className={reducedMotion ? "" : "animate-spin"}
                  aria-hidden="true"
                />
              )}
              Retry
            </button>
          )}
        </>
      )}
    </div>
  )
}
