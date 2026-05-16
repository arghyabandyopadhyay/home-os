"use client"

import { useState, useCallback } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

type DocumentReaderProps = {
  url: string
  title: string
}

export function DocumentReader({ url, title }: DocumentReaderProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loadError, setLoadError] = useState(false)
  const [pageInput, setPageInput] = useState("1")

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages)
      setLoadError(false)
    },
    []
  )

  const onDocumentLoadError = useCallback(() => {
    setLoadError(true)
  }, [])

  function goToPage(page: number) {
    const clamped = Math.max(1, Math.min(page, numPages))
    setCurrentPage(clamped)
    setPageInput(String(clamped))
  }

  function handlePageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPageInput(e.target.value)
  }

  function handlePageInputSubmit(e: React.FormEvent) {
    e.preventDefault()
    const page = parseInt(pageInput, 10)
    if (!isNaN(page)) {
      goToPage(page)
    }
  }

  if (loadError || !url) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-app-muted">Failed to load PDF</p>
          {url && (
            <a
              href={url}
              download={`${title}.pdf`}
              className="btn-primary-app inline-flex items-center gap-2 px-4 py-2 text-sm"
            >
              <Download size={16} />
              Download instead
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-4 border-b border-app px-4 py-2">
        <button
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          className="rounded-lg p-2 text-app-muted hover:bg-app-elevated hover:text-app disabled:opacity-30"
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>

        <form
          onSubmit={handlePageInputSubmit}
          className="flex items-center gap-2 text-sm"
        >
          <input
            value={pageInput}
            onChange={handlePageInputChange}
            onBlur={() => {
              const page = parseInt(pageInput, 10)
              if (!isNaN(page)) goToPage(page)
              else setPageInput(String(currentPage))
            }}
            className="w-12 rounded-lg border border-app bg-app-elevated px-2 py-1 text-center text-sm outline-none"
            aria-label="Current page number"
          />
          <span className="text-app-muted">/ {numPages || "—"}</span>
        </form>

        <button
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= numPages}
          className="rounded-lg p-2 text-app-muted hover:bg-app-elevated hover:text-app disabled:opacity-30"
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>

        <a
          href={url}
          download={`${title}.pdf`}
          className="ml-4 rounded-lg p-2 text-app-muted hover:bg-app-elevated hover:text-app"
          aria-label="Download PDF"
        >
          <Download size={18} />
        </a>
      </div>

      {/* PDF content */}
      <div className="flex-1 overflow-auto">
        <div className="flex justify-center py-6">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center py-20">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              className="shadow-lg"
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </Document>
        </div>
      </div>
    </div>
  )
}
