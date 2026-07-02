"use client"

import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { Upload, X, RotateCcw, Tag, Grid, List } from "lucide-react"
import { ProcessingIndicator } from "@/components/documents/processing-indicator"
import { DocumentThumbnail } from "@/components/documents/document-thumbnail"
import { BulkUploadQueue } from "@/components/documents/bulk-upload-queue"
import { DocumentSearchResultCard } from "@/components/documents/document-search-result-card"
import { useDocumentStatusPoller } from "@/hooks/use-document-status-poller"
import { useDocumentSearch } from "@/hooks/queries/use-document-search"

import Link from "next/link"
import { Document } from "@/types/document"
import { toast } from "sonner"
import { v4 as uuid } from "uuid"
import {
  validateUploadFile,
  filterDocumentsByQuery,
  filterDocumentsByTag,
} from "@/lib/documents-utils"
import { uploadWithProgress } from "@/lib/upload-with-progress"
import { createClient } from "@/lib/supabase/client"
import { createClientApiClient } from "@/lib/api-client"
import { useUpdateDocument, useDeleteDocument, useRetryDocumentProcessing, documentKeys } from "@/hooks/queries/use-documents"
import { useApiErrorHandler } from "@/hooks/use-api-error-handler"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"
import { useBulkUploadStore } from "@/hooks/use-bulk-upload-store"
import { useWorkspaceStore } from "@/hooks/use-workspace-store"
import { useQueryClient } from "@tanstack/react-query"
import type { ApiClientError } from "@/lib/api-client"

const api = createClientApiClient()

type ViewMode = "grid" | "list"

export function DocumentsView({
  documents: initialDocuments,
}: {
  documents: Document[]
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const [documents, setDocuments] = useState(initialDocuments)
  const [search, setSearch] = useState("")
  const [activeTag, setActiveTag] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState("")

  const updateDocMutation = useUpdateDocument()
  const deleteDocMutation = useDeleteDocument()
  const handleError = useApiErrorHandler()
  const { isReadOnly } = useWorkspacePermissions()
  const queryClient = useQueryClient()
  const { activeWorkspaceId } = useWorkspaceStore()
  const { items: bulkItems, addFiles, updateItem } = useBulkUploadStore()
  const bulkProcessingRef = useRef(false)

  // Debounce search input by 300ms before passing to API search hook
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // API-powered content search
  const { data: searchResults, isLoading: isSearching } = useDocumentSearch(debouncedSearch)

  // Status polling for documents in pending/processing state
  const { isPollPaused } = useDocumentStatusPoller(documents)

  // Track previous statuses to detect transitions to "ready"
  const prevStatusesRef = useRef<Record<string, string>>({})

  useEffect(() => {
    const prevStatuses = prevStatusesRef.current
    for (const doc of documents) {
      const prev = prevStatuses[doc.id]
      if (prev && prev !== "ready" && doc.processing.status === "ready") {
        const title = doc.title.length > 40 ? doc.title.slice(0, 37) + "..." : doc.title
        toast.success(`Document "${title}" is ready`)
      }
    }
    prevStatusesRef.current = Object.fromEntries(
      documents.map((d) => [d.id, d.processing.status])
    )
  }, [documents])

  // Collect all unique tags from documents
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    documents.forEach((doc) => (doc.tags ?? []).forEach((t) => tagSet.add(t)))
    return Array.from(tagSet).sort()
  }, [documents])

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    let result = documents
    if (activeTag) {
      result = filterDocumentsByTag(result, activeTag)
    }
    if (search.length >= 2) {
      result = filterDocumentsByQuery(result, search)
    }
    return result
  }, [documents, search, activeTag])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value)
  }, [])

  async function handleUpload(file: File) {
    const validation = validateUploadFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    // File upload still uses Supabase Storage directly for the binary upload
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Not authenticated")
      return
    }

    setUploading(true)
    setUploadProgress(0)
    setPendingFile(file)

    const controller = new AbortController()
    abortControllerRef.current = controller

    const documentId = uuid()
    const filePath = `${user.id}/${documentId}.pdf`

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        throw new Error("No auth session")
      }

      const { error: uploadError } = await uploadWithProgress({
        bucket: "documents",
        path: filePath,
        file,
        contentType: "application/pdf",
        upsert: false,
        onProgress: (percent) => setUploadProgress(percent),
        token,
        signal: controller.signal,
      })

      if (uploadError) {
        throw uploadError
      }

      // Insert DB row via API
      const data = await api.post<Document>("/documents", {
        body: {
          id: documentId,
          title: file.name.replace(/\.pdf$/i, ""),
          file_path: filePath,
          file_size: file.size,
        },
        timeout: 120_000,
      })

      setDocuments((prev) => [data, ...prev])
      toast.success("Document uploaded · Processing started", {
        action: {
          label: "View",
          onClick: () => {
            window.location.href = `/documents/${documentId}`
          },
        },
      })
      setPendingFile(null)
    } catch (error) {
      // If the upload was cancelled via AbortController, don't show an error
      if (error instanceof Error && error.name === "AbortError") {
        setPendingFile(null)
      } else {
        const message =
          error instanceof Error ? error.message : "Upload failed"
        toast.error(message)
        // Keep pendingFile for retry
      }
    } finally {
      abortControllerRef.current = null
      setUploading(false)
      setUploadProgress(0)
    }
  }

  async function handleRetry() {
    if (pendingFile) {
      await handleUpload(pendingFile)
    }
  }

  function handleCancelUpload() {
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setUploading(false)
    setUploadProgress(0)
    setPendingFile(null)
  }

  const processBulkUpload = useCallback(async () => {
    if (bulkProcessingRef.current) return
    bulkProcessingRef.current = true

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Not authenticated")
      bulkProcessingRef.current = false
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      toast.error("No auth session")
      bulkProcessingRef.current = false
      return
    }

    // Get current queued items from the store
    const queuedItems = useBulkUploadStore.getState().items.filter(
      (item) => item.status === "queued"
    )

    for (const item of queuedItems) {
      // Mark as uploading
      updateItem(item.id, { status: "uploading", progress: 0 })

      const documentId = uuid()
      const filePath = `${user.id}/${documentId}.pdf`

      try {
        const { error: uploadError } = await uploadWithProgress({
          bucket: "documents",
          path: filePath,
          file: item.file,
          contentType: "application/pdf",
          upsert: false,
          onProgress: (percent) => {
            updateItem(item.id, { progress: percent })
          },
          token,
        })

        if (uploadError) {
          throw uploadError
        }

        // Create document entry via API
        const data = await api.post<Document>("/documents", {
          body: {
            id: documentId,
            title: item.file.name.replace(/\.pdf$/i, ""),
            file_path: filePath,
            file_size: item.file.size,
          },
          timeout: 120_000,
        })

        // Mark as complete in store
        updateItem(item.id, { status: "complete", progress: 100 })

        // Update local documents state
        setDocuments((prev) => [data, ...prev])

        // Invalidate documents query cache
        if (activeWorkspaceId) {
          queryClient.invalidateQueries({
            queryKey: documentKeys.all(activeWorkspaceId),
          })
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Upload failed"
        updateItem(item.id, { status: "failed", error: message })
      }
    }

    bulkProcessingRef.current = false
  }, [updateItem, activeWorkspaceId, queryClient])

  // Trigger bulk processing when new queued items appear
  useEffect(() => {
    const hasQueued = bulkItems.some((item) => item.status === "queued")
    if (hasQueued && !bulkProcessingRef.current) {
      processBulkUpload()
    }
  }, [bulkItems, processBulkUpload])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (files.length === 1) {
      // Single file: use existing upload flow
      handleUpload(files[0])
    } else {
      // Multiple files: use bulk upload store
      const fileArray = Array.from(files)
      const result = addFiles(fileArray)
      if (!result.accepted) {
        toast.error(result.error ?? "Bulk upload failed")
      }
    }

    // Reset input so the same file can be re-selected
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    if (files.length === 1) {
      // Single file: use existing upload flow
      handleUpload(files[0])
    } else {
      // Multiple files: use bulk upload store
      const fileArray = Array.from(files)
      const result = addFiles(fileArray)
      if (!result.accepted) {
        toast.error(result.error ?? "Bulk upload failed")
      }
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
  }

  async function handleDelete(doc: Document) {
    if (!confirm("Are you sure you want to delete this document?")) return

    const prev = documents
    setDocuments((d) => d.filter((item) => item.id !== doc.id))

    // Delete from storage via Supabase (binary file)
    const supabase = createClient()
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([doc.file_path])

    if (storageError) {
      console.error("Storage delete error:", storageError)
    }

    // Delete from DB via API
    deleteDocMutation.mutate(doc.id, {
      onError: (error) => {
        handleError(error as unknown as ApiClientError)
        setDocuments(prev)
      },
    })
  }

  function handleUpdateTitle(id: string, title: string) {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, title } : doc))
    )

    updateDocMutation.mutate(
      { id, title },
      {
        onError: (error) => {
          handleError(error as unknown as ApiClientError)
        },
      },
    )
  }

  function handleAddTag(id: string, tag: string) {
    const trimmed = tag.trim().toLowerCase()
    if (!trimmed) return

    const doc = documents.find((d) => d.id === id)
    if (!doc || (doc.tags ?? []).includes(trimmed)) return

    const newTags = [...(doc.tags ?? []), trimmed]
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, tags: newTags } : d))
    )

    updateDocMutation.mutate(
      { id, tags: newTags },
      {
        onError: (error) => {
          handleError(error as unknown as ApiClientError)
        },
      },
    )
  }

  function handleRemoveTag(id: string, tag: string) {
    const doc = documents.find((d) => d.id === id)
    if (!doc) return

    const newTags = (doc.tags ?? []).filter((t) => t !== tag)
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, tags: newTags } : d))
    )

    updateDocMutation.mutate(
      { id, tags: newTags },
      {
        onError: (error) => {
          handleError(error as unknown as ApiClientError)
        },
      },
    )
  }

  return (
    <div className="space-y-6">
      {/* ARIA live region for status change announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {documents
          .filter((doc) => doc.processing.status === "ready")
          .map((doc) => (
            <span key={doc.id}>Document {doc.title} is ready.</span>
          ))}
      </div>

      {/* Status updates paused banner */}
      {isPollPaused && (
        <div className="rounded-xl bg-yellow-500/10 px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400">
          Status updates paused — check your connection
        </div>
      )}

      {/* Upload zone */}
      {!isReadOnly && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            dragOver
              ? "border-blue-500 bg-blue-500/5"
              : "border-app hover:border-blue-500/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            aria-label="Select PDF file to upload"
          />

          {uploading ? (
            <div className="space-y-3">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <p className="text-sm text-app-muted">
                Uploading... {uploadProgress}%
              </p>
              <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-app-elevated">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <button
                onClick={handleCancelUpload}
                className="text-sm text-app-muted hover:text-red-500"
                aria-label="Cancel upload"
              >
                Cancel
              </button>
            </div>
          ) : pendingFile ? (
            <div className="space-y-3">
              <p className="text-sm text-red-500">Upload failed</p>
              <button
                onClick={handleRetry}
                className="btn-primary-app inline-flex items-center gap-2 px-4 py-2 text-sm"
                aria-label="Retry upload"
              >
                <RotateCcw size={16} />
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload size={32} className="mx-auto text-app-muted" />
              <p className="text-sm text-app-muted">
                Drag and drop a PDF here, or{" "}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-500 underline hover:text-blue-600"
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-app-muted">PDF only, max 50 MB</p>
            </div>
          )}
        </div>
      )}

      {/* Search and filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search documents..."
          className="input-app w-full sm:max-w-xs"
          aria-label="Search documents"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded-lg p-2 ${
              viewMode === "grid"
                ? "bg-app-elevated text-app"
                : "text-app-muted hover:text-app"
            }`}
            aria-label="Grid view"
          >
            <Grid size={18} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded-lg p-2 ${
              viewMode === "list"
                ? "bg-app-elevated text-app"
                : "text-app-muted hover:text-app"
            }`}
            aria-label="List view"
          >
            <List size={18} />
          </button>
        </div>
      </div>

      {/* Tag filter bar */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag("")}
            className={`rounded-xl px-3 py-1 text-xs transition ${
              !activeTag
                ? "bg-app-elevated text-app"
                : "text-app-muted hover:bg-app-elevated hover:text-app"
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? "" : tag)}
              className={`rounded-xl px-3 py-1 text-xs transition ${
                activeTag === tag
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                  : "text-app-muted hover:bg-app-elevated hover:text-app"
              }`}
            >
              <Tag size={12} className="mr-1 inline" />
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Empty state - handled at page level, this is a fallback */}
      {documents.length === 0 && (
        <div className="card-app p-16 text-center text-app-muted">
          No documents yet. Upload a PDF to get started.
        </div>
      )}

      {/* API-powered search results */}
      {debouncedSearch.trim().length >= 2 ? (
        isSearching ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="item-app animate-pulse rounded-xl px-4 py-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 h-[18px] w-[18px] rounded bg-app-elevated" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-app-elevated" />
                    <div className="h-3 w-full rounded bg-app-elevated" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : searchResults && searchResults.length > 0 ? (
          <div className="space-y-2">
            {searchResults.map((result) => (
              <DocumentSearchResultCard key={result.document.id} result={result} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-app p-8 text-center text-app-muted">
            No documents match your search.
          </div>
        )
      ) : (
        <>
          {/* No results */}
          {documents.length > 0 && filteredDocuments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-app p-8 text-center text-app-muted">
              No documents match your search.
            </div>
          )}

          {/* Document grid/list */}
          {viewMode === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDocuments.map((doc) => (
                <DocumentCard
                  key={doc.id}
                  document={doc}
                  isReadOnly={isReadOnly}
                  onDelete={() => handleDelete(doc)}
                  onUpdateTitle={(title) => handleUpdateTitle(doc.id, title)}
                  onAddTag={(tag) => handleAddTag(doc.id, tag)}
                  onRemoveTag={(tag) => handleRemoveTag(doc.id, tag)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((doc) => (
                <DocumentListItem
                  key={doc.id}
                  document={doc}
                  isReadOnly={isReadOnly}
                  onDelete={() => handleDelete(doc)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <BulkUploadQueue />
    </div>
  )
}

function DocumentCard({
  document: doc,
  isReadOnly,
  onDelete,
  onUpdateTitle,
  onAddTag,
  onRemoveTag,
}: {
  document: Document
  isReadOnly: boolean
  onDelete: () => void
  onUpdateTitle: (title: string) => void
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
}) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(doc.title)
  const [tagInput, setTagInput] = useState("")
  const retryMutation = useRetryDocumentProcessing()

  function handleTitleBlur() {
    setEditingTitle(false)
    if (title.trim() && title !== doc.title) {
      onUpdateTitle(title.trim())
    } else {
      setTitle(doc.title)
    }
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (tagInput.trim()) {
        onAddTag(tagInput)
        setTagInput("")
      }
    }
  }

  return (
    <div className="card-app flex flex-col gap-3 overflow-hidden">
      {/* Thumbnail header */}
      <DocumentThumbnail
        thumbnailUrl={doc.thumbnail_url}
        title={doc.title}
        size="card"
      />

      <div className="flex flex-col gap-3 px-4 pb-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            {editingTitle ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
                autoFocus
                className="w-full bg-transparent text-sm font-semibold outline-none"
              />
            ) : (
              <button
                onClick={() => !isReadOnly && setEditingTitle(true)}
                disabled={isReadOnly}
                className="w-full text-left text-sm font-semibold hover:text-blue-500 disabled:hover:text-inherit"
              >
                {doc.title}
              </button>
            )}
            <p className="text-xs text-app-muted" suppressHydrationWarning>
              {doc.file_size
                ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB`
                : ""}{" "}
              · {new Date(doc.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
            </p>
          </div>
        </div>

        {/* Processing indicator */}
        <ProcessingIndicator
          status={doc.processing.status}
          currentStage={doc.processing.current_stage}
          onRetry={() => retryMutation.mutate(doc.id)}
          retryLoading={retryMutation.isPending}
        />

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {(doc.tags ?? []).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-lg bg-app-elevated px-2 py-0.5 text-xs text-app-muted"
            >
              {tag}
              {!isReadOnly && (
                <button
                  onClick={() => onRemoveTag(tag)}
                  className="hover:text-red-500"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X size={10} />
                </button>
              )}
            </span>
          ))}
          {!isReadOnly && (
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={() => {
                if (tagInput.trim()) {
                  onAddTag(tagInput)
                  setTagInput("")
                }
              }}
              placeholder="+ tag"
              className="w-16 bg-transparent text-xs text-app-muted outline-none placeholder:text-app-muted/50"
              aria-label="Add tag"
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 border-t border-app pt-3">
          <Link
            href={`/documents/${doc.id}`}
            className="btn-primary-app px-3 py-1.5 text-xs"
          >
            Open
          </Link>
          {!isReadOnly && (
            <button
              onClick={onDelete}
              className="ml-auto text-xs text-red-500 hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function DocumentListItem({
  document: doc,
  isReadOnly,
  onDelete,
}: {
  document: Document
  isReadOnly: boolean
  onDelete: () => void
}) {
  const retryMutation = useRetryDocumentProcessing()

  return (
    <div className="item-app flex items-center gap-4 rounded-xl px-4 py-3">
      <DocumentThumbnail
        thumbnailUrl={doc.thumbnail_url}
        title={doc.title}
        size="list"
      />
      <div className="min-w-0 flex-1">
        <Link
          href={`/documents/${doc.id}`}
          className="block truncate text-sm font-medium hover:text-blue-500"
        >
          {doc.title}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-app-muted" suppressHydrationWarning>
            {new Date(doc.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
          </span>
          {(doc.tags ?? []).length > 0 && (
            <span className="text-xs text-app-muted">
              · {(doc.tags ?? []).join(", ")}
            </span>
          )}
          <ProcessingIndicator
            status={doc.processing.status}
            currentStage={doc.processing.current_stage}
            onRetry={() => retryMutation.mutate(doc.id)}
            retryLoading={retryMutation.isPending}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/documents/${doc.id}`}
          className="rounded-lg px-3 py-1 text-xs text-app-muted hover:bg-app-elevated hover:text-app"
        >
          Open
        </Link>
        {!isReadOnly && (
          <button
            onClick={onDelete}
            className="text-xs text-red-500 hover:text-red-600"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
