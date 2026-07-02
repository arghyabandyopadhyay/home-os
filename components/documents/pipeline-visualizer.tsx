"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Circle, XCircle } from "lucide-react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { DocumentProcessingState, PipelineStage } from "@/types/document"

type PipelineVisualizerProps = {
  processing: DocumentProcessingState
}

const STAGES: PipelineStage[] = ["scanning", "ocr", "text_extraction", "indexing"]

const STAGE_LABELS: Record<PipelineStage, string> = {
  scanning: "Scanning",
  ocr: "OCR",
  text_extraction: "Text Extraction",
  indexing: "Indexing",
}

type StageStatus = "completed" | "active" | "future" | "failed" | "unreached"

function getStageStatus(
  stage: PipelineStage,
  processing: DocumentProcessingState
): StageStatus {
  const { completed_stages, current_stage, failed_stage } = processing

  if (completed_stages.includes(stage)) {
    return "completed"
  }

  if (failed_stage === stage) {
    return "failed"
  }

  if (current_stage === stage && processing.status === "processing") {
    return "active"
  }

  // If there's a failed stage, stages after it are "unreached"
  if (failed_stage) {
    const failedIndex = STAGES.indexOf(failed_stage)
    const currentIndex = STAGES.indexOf(stage)
    if (currentIndex > failedIndex) {
      return "unreached"
    }
  }

  return "future"
}

function formatElapsedTime(startedAt: string): string {
  const start = new Date(startedAt).getTime()
  const now = Date.now()
  const elapsed = Math.max(0, Math.floor((now - start) / 1000))

  if (elapsed < 60) {
    return `${elapsed}s`
  }

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  return `${minutes}m ${seconds}s`
}

export function PipelineVisualizer({ processing }: PipelineVisualizerProps) {
  const reducedMotion = useReducedMotion()
  const [elapsedTime, setElapsedTime] = useState<string>("")

  const completedCount = processing.completed_stages.length

  // Update elapsed time every second when processing is active
  useEffect(() => {
    if (processing.status !== "processing" || !processing.started_at) {
      setElapsedTime("")
      return
    }

    setElapsedTime(formatElapsedTime(processing.started_at))

    const interval = setInterval(() => {
      setElapsedTime(formatElapsedTime(processing.started_at!))
    }, 1000)

    return () => clearInterval(interval)
  }, [processing.status, processing.started_at])

  return (
    <div className="card-app p-6">
      <div
        role="progressbar"
        aria-valuenow={completedCount}
        aria-valuemax={4}
        aria-label={`Document processing: ${completedCount} of 4 stages completed`}
        className="flex items-start justify-between"
      >
        {STAGES.map((stage, index) => {
          const stageStatus = getStageStatus(stage, processing)

          return (
            <div key={stage} className="flex flex-1 items-start">
              {/* Stage node */}
              <div className="flex flex-col items-center">
                <StageIcon status={stageStatus} reducedMotion={reducedMotion} />
                <span
                  className={`mt-2 text-xs text-center ${
                    stageStatus === "completed"
                      ? "text-green-600 dark:text-green-400 font-medium"
                      : stageStatus === "active"
                        ? "text-blue-600 dark:text-blue-400 font-medium"
                        : stageStatus === "failed"
                          ? "text-red-600 dark:text-red-400 font-medium"
                          : stageStatus === "unreached"
                            ? "text-app-muted opacity-50"
                            : "text-app-muted"
                  }`}
                >
                  {STAGE_LABELS[stage]}
                </span>
                {stageStatus === "active" && elapsedTime && (
                  <span className="mt-1 text-[10px] text-blue-600 dark:text-blue-400">
                    {elapsedTime}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {index < STAGES.length - 1 && (
                <div className="flex-1 mt-3 mx-2">
                  <div
                    className={`h-px w-full ${
                      stageStatus === "completed"
                        ? "bg-green-600 dark:bg-green-400"
                        : stageStatus === "unreached"
                          ? "bg-border-app opacity-50"
                          : "bg-border-app"
                    }`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StageIcon({
  status,
  reducedMotion,
}: {
  status: StageStatus
  reducedMotion: boolean
}) {
  switch (status) {
    case "completed":
      return (
        <CheckCircle2
          size={20}
          className="text-green-600 dark:text-green-400"
          aria-hidden="true"
        />
      )
    case "active":
      return (
        <div className="relative flex h-5 w-5 items-center justify-center">
          {reducedMotion ? (
            <div className="h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-400" />
          ) : (
            <>
              <div className="absolute h-5 w-5 rounded-full bg-blue-600/20 dark:bg-blue-400/20 animate-[pulse-ring_1.5s_ease-in-out_infinite]" />
              <div className="relative h-3 w-3 rounded-full bg-blue-600 dark:bg-blue-400" />
            </>
          )}
        </div>
      )
    case "failed":
      return (
        <XCircle
          size={20}
          className="text-red-600 dark:text-red-400"
          aria-hidden="true"
        />
      )
    case "unreached":
      return (
        <Circle
          size={20}
          className="text-app-muted opacity-50"
          aria-hidden="true"
        />
      )
    case "future":
    default:
      return (
        <Circle size={20} className="text-app-muted" aria-hidden="true" />
      )
  }
}
