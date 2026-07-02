"use client"

import { useState } from "react"
import { useDocumentContent } from "@/hooks/queries/use-document-content"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ProcessingStatus } from "@/types/document"

type ContentPreviewProps = {
  documentId: string
  processingStatus: ProcessingStatus
}

const PAGE_SIZE = 5000

function ContentSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-4 w-full rounded bg-app-elevated animate-pulse" />
      <div className="h-4 w-4/5 rounded bg-app-elevated animate-pulse" />
      <div className="h-4 w-3/5 rounded bg-app-elevated animate-pulse" />
    </div>
  )
}

function PaginatedText({ text }: { text: string }) {
  const [visibleChars, setVisibleChars] = useState(PAGE_SIZE)

  const displayedText = text.slice(0, visibleChars)
  const hasMore = text.length > visibleChars

  return (
    <div>
      <div className="max-h-96 overflow-y-auto rounded-xl bg-app-elevated p-4 font-mono text-sm">
        <pre className="whitespace-pre-wrap break-words">{displayedText}</pre>
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setVisibleChars((prev) => prev + PAGE_SIZE)}
          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Show more
        </button>
      )}
    </div>
  )
}

export function ContentPreview({ documentId, processingStatus }: ContentPreviewProps) {
  const isReady = processingStatus === "ready"
  const { data: content, isLoading } = useDocumentContent(documentId, isReady)

  if (!isReady) {
    return (
      <div className="card-app p-6">
        <p className="text-app-muted text-sm">Content available after processing</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="card-app p-6">
        <ContentSkeleton />
      </div>
    )
  }

  const extractedText = content?.extracted_text ?? ""
  const ocrText = content?.ocr_text ?? ""

  return (
    <div className="card-app p-6">
      <Tabs defaultValue="text">
        <TabsList>
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="ocr">OCR</TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          {extractedText ? (
            <PaginatedText text={extractedText} />
          ) : (
            <p className="text-app-muted text-sm">No text content found</p>
          )}
        </TabsContent>

        <TabsContent value="ocr">
          {ocrText ? (
            <PaginatedText text={ocrText} />
          ) : (
            <p className="text-app-muted text-sm">No OCR content found</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
