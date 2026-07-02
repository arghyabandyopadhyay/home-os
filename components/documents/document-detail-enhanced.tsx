"use client"

import { PipelineVisualizer } from "@/components/documents/pipeline-visualizer"
import { ContentPreview } from "@/components/documents/content-preview"
import { useRetryDocumentProcessing } from "@/hooks/queries/use-documents"
import { RotateCcw, Loader2 } from "lucide-react"
import type { Document } from "@/types/document"

type DocumentDetailEnhancedProps = {
  document: Document
}

export function DocumentDetailEnhanced({ document: doc }: DocumentDetailEnhancedProps) {
  const retryMutation = useRetryDocumentProcessing()
  const { status } = doc.processing

  return (
    <div className="space-y-6">
      {/* Retry button for failed status */}
      {status === "failed" && (
        <div className="flex justify-end">
          <button
            onClick={() => retryMutation.mutate(doc.id)}
            disabled={retryMutation.isPending}
            className="btn-primary-app inline-flex items-center gap-2 px-4 py-2 text-sm"
            aria-label="Retry document processing"
          >
            {retryMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RotateCcw size={16} />
            )}
            Retry Processing
          </button>
        </div>
      )}

      {/* Pipeline visualizer shown for non-ready statuses */}
      {status !== "ready" && (
        <PipelineVisualizer processing={doc.processing} />
      )}

      {/* Content preview shown for ready status */}
      <ContentPreview documentId={doc.id} processingStatus={status} />
    </div>
  )
}
