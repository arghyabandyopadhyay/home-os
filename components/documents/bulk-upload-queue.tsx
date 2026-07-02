"use client"

import { useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  FileText,
  Clock,
} from "lucide-react"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import {
  useBulkUploadStore,
  selectTotalCount,
  selectCompletedCount,
  selectFailedCount,
  selectIsActive,
} from "@/hooks/use-bulk-upload-store"
import type { UploadQueueItem } from "@/hooks/use-bulk-upload-store"
import { DURATION, EASING } from "@/lib/motion"

function StatusIcon({
  status,
  reducedMotion,
}: {
  status: UploadQueueItem["status"]
  reducedMotion: boolean
}) {
  switch (status) {
    case "queued":
      return <Clock size={14} className="text-app-muted shrink-0" aria-hidden="true" />
    case "uploading":
      return (
        <Loader2
          size={14}
          className={`text-blue-600 dark:text-blue-400 shrink-0${reducedMotion ? "" : " animate-spin"}`}
          aria-hidden="true"
        />
      )
    case "complete":
      return (
        <CheckCircle2
          size={14}
          className="text-green-600 dark:text-green-400 shrink-0"
          aria-hidden="true"
        />
      )
    case "failed":
      return (
        <AlertTriangle
          size={14}
          className="text-red-600 dark:text-red-400 shrink-0"
          aria-hidden="true"
        />
      )
  }
}

function QueueItem({
  item,
  reducedMotion,
}: {
  item: UploadQueueItem
  reducedMotion: boolean
}) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 border-b border-app last:border-b-0"
      role="listitem"
    >
      <FileText size={14} className="text-app-muted shrink-0" aria-hidden="true" />
      <span className="text-xs text-app truncate flex-1" title={item.file.name}>
        {item.file.name}
      </span>
      <StatusIcon status={item.status} reducedMotion={reducedMotion} />
      {item.status === "uploading" && (
        <div className="w-12 h-1 rounded-full bg-app-elevated overflow-hidden shrink-0">
          <div
            className="h-full bg-blue-600 dark:bg-blue-400 rounded-full transition-all duration-200"
            style={{ width: `${item.progress}%` }}
          />
        </div>
      )}
    </div>
  )
}

export function BulkUploadQueue() {
  const reducedMotion = useReducedMotion()
  const items = useBulkUploadStore((s) => s.items)
  const isMinimized = useBulkUploadStore((s) => s.isMinimized)
  const setMinimized = useBulkUploadStore((s) => s.setMinimized)
  const reset = useBulkUploadStore((s) => s.reset)
  const updateItem = useBulkUploadStore((s) => s.updateItem)

  const totalCount = useBulkUploadStore(selectTotalCount)
  const completedCount = useBulkUploadStore(selectCompletedCount)
  const failedCount = useBulkUploadStore(selectFailedCount)
  const isActive = useBulkUploadStore(selectIsActive)

  // Determine if all uploads are done (summary state)
  const allDone = totalCount > 0 && !isActive

  const handleDismiss = useCallback(() => {
    reset()
  }, [reset])

  const handleMinimize = useCallback(() => {
    setMinimized(true)
  }, [setMinimized])

  const handleExpand = useCallback(() => {
    setMinimized(false)
  }, [setMinimized])

  const handleRetryFailed = useCallback(() => {
    const failedItems = items.filter((item) => item.status === "failed")
    for (const item of failedItems) {
      updateItem(item.id, { status: "queued", progress: 0, error: null })
    }
  }, [items, updateItem])

  // Keyboard handler for Escape to dismiss/minimize
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        if (allDone) {
          handleDismiss()
        } else {
          handleMinimize()
        }
      }
    },
    [allDone, handleDismiss, handleMinimize]
  )

  // Don't render when there are no items
  if (totalCount === 0) {
    return null
  }

  const panelVariants = reducedMotion
    ? {
        initial: { opacity: 1, y: 0 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 1, y: 0 },
      }
    : {
        initial: { opacity: 0, y: 20 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: DURATION.normal, ease: EASING.entrance },
        },
        exit: {
          opacity: 0,
          y: 20,
          transition: { duration: DURATION.fast, ease: EASING.exit },
        },
      }

  const badgeVariants = reducedMotion
    ? {
        initial: { opacity: 1, scale: 1 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 1, scale: 1 },
      }
    : {
        initial: { opacity: 0, scale: 0.9 },
        animate: {
          opacity: 1,
          scale: 1,
          transition: { duration: DURATION.fast, ease: EASING.entrance },
        },
        exit: {
          opacity: 0,
          scale: 0.9,
          transition: { duration: DURATION.fast, ease: EASING.exit },
        },
      }

  return (
    <div className="fixed bottom-6 right-6 z-50" onKeyDown={handleKeyDown}>
      <AnimatePresence mode="wait">
        {isMinimized ? (
          <motion.button
            key="badge"
            {...badgeVariants}
            onClick={handleExpand}
            className="card-app rounded-full px-3 py-1.5 text-sm text-app shadow-lg flex items-center gap-2 cursor-pointer hover:bg-app-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            aria-label={`${totalCount} files processing. Click to expand.`}
          >
            <Loader2
              size={14}
              className={`text-blue-600 dark:text-blue-400${reducedMotion ? "" : " animate-spin"}`}
              aria-hidden="true"
            />
            <span>{totalCount} files processing</span>
          </motion.button>
        ) : (
          <motion.div
            key="panel"
            {...panelVariants}
            className="card-app rounded-2xl shadow-lg w-80"
            role="region"
            aria-label="Upload queue"
            tabIndex={-1}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-app">
              <h3 className="text-sm font-semibold text-app">
                {allDone
                  ? `${completedCount} uploaded, ${failedCount} failed`
                  : `Uploading ${totalCount} files`}
              </h3>
              <div className="flex items-center gap-1">
                {!allDone && (
                  <button
                    onClick={handleMinimize}
                    className="p-1 rounded-md text-app-muted hover:bg-app-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                    aria-label="Minimize upload queue"
                  >
                    <Minus size={16} aria-hidden="true" />
                  </button>
                )}
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-md text-app-muted hover:bg-app-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                  aria-label="Dismiss upload queue"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Items list */}
            <div className="max-h-60 overflow-y-auto" role="list" aria-label="Upload items">
              {items.map((item) => (
                <QueueItem
                  key={item.id}
                  item={item}
                  reducedMotion={reducedMotion}
                />
              ))}
            </div>

            {/* Summary footer with retry */}
            {allDone && failedCount > 0 && (
              <div className="px-4 py-3 border-t border-app">
                <button
                  onClick={handleRetryFailed}
                  className="btn-primary-app w-full text-xs py-1.5 rounded-lg"
                >
                  Retry failed
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
