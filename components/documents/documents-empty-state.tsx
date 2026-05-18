"use client"

import { useRef } from "react"
import { FileText } from "lucide-react"
import { EmptyState } from "@/components/shared/empty-state"

export function DocumentsEmptyState() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        aria-label="Select PDF file to upload"
      />
      <EmptyState
        module="documents"
        icon={FileText}
        heading="Your documents live here"
        body="Upload a PDF to start building your private document library."
        actionLabel="Upload a document"
        onAction={() => fileInputRef.current?.click()}
      />
    </>
  )
}
