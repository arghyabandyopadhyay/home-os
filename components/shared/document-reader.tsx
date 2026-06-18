"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Document, pdfjs } from "react-pdf"
import { ChevronLeft, ChevronRight, Download } from "lucide-react"
import "react-pdf/dist/Page/AnnotationLayer.css"
import "react-pdf/dist/Page/TextLayer.css"

import { useViewMode } from "@/components/shared/document-reader/use-view-mode"
import { useFitToPage } from "@/components/shared/document-reader/use-fit-to-page"
import { usePageTracking } from "@/components/shared/document-reader/use-page-tracking"
import { validatePageInput } from "@/components/shared/document-reader/types"
import { ViewModeSelector } from "@/components/shared/document-reader/view-mode-selector"
import { FitToPageToggle } from "@/components/shared/document-reader/fit-to-page-toggle"
import { SinglePageView } from "@/components/shared/document-reader/single-page-view"
import { SinglePageScrollView } from "@/components/shared/document-reader/single-page-scroll-view"
import { TwoPageScrollView } from "@/components/shared/document-reader/two-page-scroll-view"

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString()

type DocumentReaderProps = {
  url: string
  title: string
}

export function DocumentReader({ url, title }: DocumentReaderProps) {
  const [numPages, setNumPages] = useState<number>(0)
  const [loadError, setLoadError] = useState(false)
  const [pageInput, setPageInput] = useState("1")

  const containerRef = useRef<HTMLDivElement>(null)

  // Hooks for view mode, fit-to-page, and page tracking
  const { viewMode, setViewMode } = useViewMode()
  const { fitToPage, toggleFitToPage, pageWidth } = useFitToPage(containerRef, viewMode)
  const { currentPage, displayLabel, scrollToPage, goToPage, nextPage, prevPage } =
    usePageTracking(viewMode, numPages, containerRef)

  // Sync pageInput from currentPage whenever it changes
  useEffect(() => {
    setPageInput(String(currentPage))
  }, [currentPage])

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

  function handlePageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPageInput(e.target.value)
  }

  function handlePageInputSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validated = validatePageInput(pageInput, numPages, currentPage)
    setPageInput(String(validated))
    if (viewMode === "single-page") {
      goToPage(validated)
    } else {
      scrollToPage(validated)
    }
  }

  function handlePageInputBlur() {
    const validated = validatePageInput(pageInput, numPages, currentPage)
    setPageInput(String(validated))
    if (viewMode === "single-page") {
      goToPage(validated)
    } else {
      scrollToPage(validated)
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

  // Determine if we should show a loading spinner (container width 0 with fit-to-page)
  const showLoadingSpinner = fitToPage && pageWidth === undefined

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div
        role="toolbar"
        aria-label="Document reader controls"
        className="flex items-center justify-center gap-2 border-b border-app px-4 py-2"
      >
        {/* View controls group: ViewModeSelector + FitToPageToggle */}
        <div className="flex items-center gap-1">
          <ViewModeSelector currentMode={viewMode} onModeChange={setViewMode} />
          <FitToPageToggle enabled={fitToPage} onToggle={toggleFitToPage} />
        </div>

        {/* Divider between view controls and navigation */}
        <div className="mx-2 h-6 w-px border-r border-app" aria-hidden="true" />

        {/* Navigation group: prev/next buttons + page input */}
        <div className="flex items-center gap-1">
          {viewMode === "single-page" && (
            <button
              onClick={prevPage}
              disabled={currentPage <= 1}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-app-muted hover:bg-app-elevated hover:text-app disabled:opacity-30"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
          )}

          <form
            onSubmit={handlePageInputSubmit}
            className="flex items-center gap-2 text-sm"
          >
            <input
              value={pageInput}
              onChange={handlePageInputChange}
              onBlur={handlePageInputBlur}
              className="h-11 w-12 rounded-lg border border-app bg-app-elevated px-2 text-center text-sm outline-none"
              aria-label="Current page number"
            />
            <span className="text-app-muted">/ {numPages || "—"}</span>
          </form>

          {viewMode === "single-page" && (
            <button
              onClick={nextPage}
              disabled={currentPage >= numPages}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-app-muted hover:bg-app-elevated hover:text-app disabled:opacity-30"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* Divider between navigation and download */}
        <div className="mx-2 h-6 w-px border-r border-app" aria-hidden="true" />

        {/* Download button */}
        <a
          href={url}
          download={`${title}.pdf`}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-app-muted hover:bg-app-elevated hover:text-app"
          aria-label="Download PDF"
        >
          <Download size={18} />
        </a>
      </div>

      {/* PDF content area */}
      <div ref={containerRef} className="flex-1 overflow-auto">
        {showLoadingSpinner ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        ) : (
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
            {viewMode === "single-page" && (
              <SinglePageView
                currentPage={currentPage}
                pageWidth={pageWidth}
              />
            )}
            {viewMode === "single-scroll" && (
              <SinglePageScrollView
                ref={containerRef}
                numPages={numPages}
                pageWidth={pageWidth}
              />
            )}
            {viewMode === "two-page-scroll" && (
              <TwoPageScrollView
                ref={containerRef}
                numPages={numPages}
                pageWidth={pageWidth}
              />
            )}
          </Document>
        )}
      </div>
    </div>
  )
}
