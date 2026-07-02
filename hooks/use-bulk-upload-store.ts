"use client"

import { create } from "zustand"

export type UploadQueueItem = {
  id: string
  file: File
  status: "queued" | "uploading" | "complete" | "failed"
  progress: number
  error: string | null
}

type BulkUploadState = {
  items: UploadQueueItem[]
  isMinimized: boolean
  addFiles: (files: File[]) => { accepted: boolean; error?: string }
  updateItem: (id: string, updates: Partial<UploadQueueItem>) => void
  removeItem: (id: string) => void
  setMinimized: (minimized: boolean) => void
  clearCompleted: () => void
  reset: () => void
}

const MAX_BATCH_SIZE = 10
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_MIME_TYPE = "application/pdf"

function validateFile(file: File): string | null {
  if (file.type !== ALLOWED_MIME_TYPE) {
    return `Invalid file type: expected PDF, got "${file.type || "unknown"}"`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `File too large: ${(file.size / (1024 * 1024)).toFixed(1)}MB exceeds 50MB limit`
  }
  return null
}

export const useBulkUploadStore = create<BulkUploadState>((set, get) => ({
  items: [],
  isMinimized: false,

  addFiles: (files) => {
    if (files.length > MAX_BATCH_SIZE) {
      return { accepted: false, error: "Maximum 10 files per upload batch" }
    }

    const newItems: UploadQueueItem[] = files.map((file) => {
      const error = validateFile(file)
      return {
        id: crypto.randomUUID(),
        file,
        status: error ? "failed" : "queued",
        progress: 0,
        error,
      }
    })

    set((state) => ({ items: [...state.items, ...newItems] }))
    return { accepted: true }
  },

  updateItem: (id, updates) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  removeItem: (id) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
    })),

  setMinimized: (minimized) => set({ isMinimized: minimized }),

  clearCompleted: () =>
    set((state) => ({
      items: state.items.filter((item) => item.status !== "complete"),
    })),

  reset: () => set({ items: [], isMinimized: false }),
}))

// Derived selectors
export const selectTotalCount = (state: BulkUploadState) => state.items.length

export const selectCompletedCount = (state: BulkUploadState) =>
  state.items.filter((item) => item.status === "complete").length

export const selectFailedCount = (state: BulkUploadState) =>
  state.items.filter((item) => item.status === "failed").length

export const selectIsActive = (state: BulkUploadState) =>
  state.items.some((item) => item.status === "queued" || item.status === "uploading")
