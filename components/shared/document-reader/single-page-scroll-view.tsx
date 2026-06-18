"use client"

import React from "react"
import { Page } from "react-pdf"

type SinglePageScrollViewProps = {
  numPages: number
  pageWidth: number | undefined
}

/**
 * Renders all PDF pages in a vertical scrollable column.
 * Each page wrapper has a data-page-number attribute for IntersectionObserver targeting.
 * The container ref is forwarded so the parent can attach scroll/intersection tracking.
 */
export const SinglePageScrollView = React.forwardRef<
  HTMLDivElement,
  SinglePageScrollViewProps
>(function SinglePageScrollView({ numPages, pageWidth }, ref) {
  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto"
    >
      <div className="flex flex-col items-center gap-6 py-6">
        {Array.from({ length: numPages }, (_, i) => {
          const pageNumber = i + 1
          return (
            <div
              key={pageNumber}
              data-page-number={pageNumber}
            >
              <Page
                pageNumber={pageNumber}
                width={pageWidth}
                renderTextLayer={true}
                renderAnnotationLayer={true}
                className="shadow-lg"
              />
            </div>
          )
        })}
      </div>
    </div>
  )
})
