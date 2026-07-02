import { createClient } from "@/lib/supabase/server"
import { DocumentReader } from "@/components/shared/document-reader"
import { DocumentDetailEnhanced } from "@/components/documents/document-detail-enhanced"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageShell } from "@/components/layout/page-shell"
import { ArrowLeft } from "lucide-react"
import type { Document, DocumentProcessingState } from "@/types/document"

export default async function DocumentReaderPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: document } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!document) {
    return (
      <PageShell title="Document not found">
        <div className="card-app flex flex-col items-center justify-center p-10 text-center">
          <p className="text-app-muted">
            This document doesn&apos;t exist or you don&apos;t have access.
          </p>
          <Link
            href="/documents"
            className="btn-primary-app mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Documents
          </Link>
        </div>
      </PageShell>
    )
  }

  const { data: signedUrlData } = await supabase.storage
    .from("documents")
    .createSignedUrl(document.file_path, 3600)

  const signedUrl = signedUrlData?.signedUrl || ""

  // Map the Supabase row to the Document type with processing state
  const defaultProcessing: DocumentProcessingState = {
    status: "ready",
    current_stage: null,
    completed_stages: ["scanning", "ocr", "text_extraction", "indexing"],
    failed_stage: null,
    error_message: null,
    started_at: null,
    completed_at: null,
  }

  const typedDocument: Document = {
    id: document.id,
    user_id: document.user_id,
    title: document.title,
    file_path: document.file_path,
    file_size: document.file_size ?? null,
    tags: document.tags ?? [],
    thumbnail_url: (document as Record<string, unknown>).thumbnail_url as string | null ?? null,
    processing: ((document as Record<string, unknown>).processing as DocumentProcessingState) ?? defaultProcessing,
    created_at: document.created_at,
    updated_at: document.updated_at,
  }

  return (
    <PageShell
      title={document.title}
      description="Document viewer"
      actions={
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-app-muted hover:bg-app-elevated hover:text-app"
          aria-label="Back to documents"
        >
          <ArrowLeft className="h-4 w-4" />
          Documents
        </Link>
      }
    >
      <div className="flex justify-center">
        <div className="w-full min-w-0 lg:w-[75%]">
          <div className="space-y-6">
            <DocumentDetailEnhanced document={typedDocument} />
            <div className="card-app h-[calc(100vh-280px)] overflow-hidden">
              <DocumentReader url={signedUrl} title={document.title} />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  )
}
