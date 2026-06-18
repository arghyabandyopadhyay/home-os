"use client"

import { Page } from "react-pdf"

type SinglePageViewProps = {
  currentPage: number
  pageWidth?: number
}

export function SinglePageView({
  currentPage,
  pageWidth,
}: SinglePageViewProps) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex justify-center" data-page-number={currentPage}>
        <Page
          pageNumber={currentPage}
          width={pageWidth}
          className="shadow-lg"
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </div>
    </div>
  )
}
