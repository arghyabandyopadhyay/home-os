"use client"

import React from "react"
import { Page } from "react-pdf"
import { computePagePairs } from "@/components/shared/document-reader/types"

type TwoPageScrollViewProps = {
  numPages: number
  pageWidth: number | undefined
}

/**
 * Renders PDF pages in a two-page spread layout.
 * Page 1 is alone on the first row, then pages are paired (2,3), (4,5), etc.
 * If the document has an odd number of pages (> 1), the last page is alone.
 *
 * Each page wrapper has a data-page-number attribute for IntersectionObserver targeting.
 * The container ref is forwarded so the parent can attach scroll/intersection tracking.
 */
export const TwoPageScrollView = React.forwardRef<
  HTMLDivElement,
  TwoPageScrollViewProps
>(function TwoPageScrollView({ numPages, pageWidth }, ref) {
  const pairs = computePagePairs(numPages)

  return (
    <div
      ref={ref}
      className="flex-1 overflow-y-auto"
    >
      <div className="flex flex-col items-center gap-6 py-6">
        {pairs.map((pair) => (
          <div
            key={pair[0]}
            className="flex flex-row items-start justify-center gap-4"
          >
            {pair.map((pageNumber) => (
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
            ))}
          </div>
        ))}
      </div>
    </div>
  )
})
