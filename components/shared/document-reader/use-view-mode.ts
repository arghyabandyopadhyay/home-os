"use client"

import { useState } from "react"

import type { ViewMode } from "@/components/shared/document-reader/types"

export function useViewMode() {
  const [viewMode, setViewMode] = useState<ViewMode>("single-page")

  return { viewMode, setViewMode }
}
