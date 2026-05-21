"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { Upload, FileText, X, RotateCcw, Tag, Grid, List } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Document } from "@/types/document"
import { toast } from "sonner"
import { v4 as uuid } from "uuid"
import {
  validateUploadFile,
  filterDocumentsByQuery,
  filterDocumentsByTag,
} from "@/lib/documents-utils"
import { uploadWithProgress } from "@/lib/upload-with-progress"

type ViewMode = "grid" | "list"

export function DocumentsView({
  documents: initialDocuments,
}: {
  documents: Document[]
}) {
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [documents, setDocuments] = useState(initialDocuments)
  const [search, setSearch] = useState("")
  const [activeTag, setActiveTag] = useState("")
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

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
      })

      if (uploadError) {
        throw uploadError
      }

      // Insert DB row
      const { data, error: dbError } = await supabase
        .from("documents")
        .insert({
          id: documentId,
          user_id: user.id,
          title: file.name.replace(/\.pdf$/i, ""),
          file_path: filePath,
          file_size: file.size,
        })
        .select()
        .single()

      if (dbError) {
        // Cleanup storage on DB failure
        await supabase.storage.from("documents").remove([filePath])
        throw dbError
      }

      setDocuments((prev) => [data as Document, ...prev])
      toast.success("Document uploaded successfully")
      setPendingFile(null)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Upload failed"
      toast.error(message)
      // Keep pendingFile for retry
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  async function handleRetry() {
    if (pendingFile) {
      await handleUpload(pendingFile)
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      handleUpload(file)
    }
    // Reset input so the same file can be re-selected
    e.target.value = ""
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      handleUpload(file)
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

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("documents")
      .remove([doc.file_path])

    if (storageError) {
      console.error("Storage delete error:", storageError)
    }

    // Delete from DB
    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", doc.id)

    if (dbError) {
      toast.error("Failed to delete document")
      setDocuments(prev)
      return
    }

    toast.success("Document deleted")
  }

  async function handleUpdateTitle(id: string, title: string) {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === id ? { ...doc, title } : doc))
    )

    await supabase
      .from("documents")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", id)
  }

  async function handleAddTag(id: string, tag: string) {
    const trimmed = tag.trim().toLowerCase()
    if (!trimmed) return

    const doc = documents.find((d) => d.id === id)
    if (!doc || (doc.tags ?? []).includes(trimmed)) return

    const newTags = [...(doc.tags ?? []), trimmed]
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, tags: newTags } : d))
    )

    await supabase
      .from("documents")
      .update({ tags: newTags, updated_at: new Date().toISOString() })
      .eq("id", id)
  }

  async function handleRemoveTag(id: string, tag: string) {
    const doc = documents.find((d) => d.id === id)
    if (!doc) return

    const newTags = (doc.tags ?? []).filter((t) => t !== tag)
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, tags: newTags } : d))
    )

    await supabase
      .from("documents")
      .update({ tags: newTags, updated_at: new Date().toISOString() })
      .eq("id", id)
  }

  return (
    <div className="space-y-6">
      {/* Upload zone */}
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
              onDelete={() => handleDelete(doc)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentCard({
  document: doc,
  onDelete,
  onUpdateTitle,
  onAddTag,
  onRemoveTag,
}: {
  document: Document
  onDelete: () => void
  onUpdateTitle: (title: string) => void
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
}) {
  const [editingTitle, setEditingTitle] = useState(false)
  const [title, setTitle] = useState(doc.title)
  const [tagInput, setTagInput] = useState("")

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
    <div className="card-app flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
          <FileText size={20} className="text-red-500" />
        </div>
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
              onClick={() => setEditingTitle(true)}
              className="w-full text-left text-sm font-semibold hover:text-blue-500"
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

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {(doc.tags ?? []).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-lg bg-app-elevated px-2 py-0.5 text-xs text-app-muted"
          >
            {tag}
            <button
              onClick={() => onRemoveTag(tag)}
              className="hover:text-red-500"
              aria-label={`Remove tag ${tag}`}
            >
              <X size={10} />
            </button>
          </span>
        ))}
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
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 border-t border-app pt-3">
        <Link
          href={`/documents/${doc.id}`}
          className="btn-primary-app px-3 py-1.5 text-xs"
        >
          Open
        </Link>
        <button
          onClick={onDelete}
          className="ml-auto text-xs text-red-500 hover:text-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function DocumentListItem({
  document: doc,
  onDelete,
}: {
  document: Document
  onDelete: () => void
}) {
  return (
    <div className="item-app flex items-center gap-4 rounded-xl px-4 py-3">
      <FileText size={18} className="shrink-0 text-red-500" />
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
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href={`/documents/${doc.id}`}
          className="rounded-lg px-3 py-1 text-xs text-app-muted hover:bg-app-elevated hover:text-app"
        >
          Open
        </Link>
        <button
          onClick={onDelete}
          className="text-xs text-red-500 hover:text-red-600"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
