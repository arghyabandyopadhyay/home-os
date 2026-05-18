import { getDocuments } from "@/lib/documents"
import { DocumentsView } from "@/components/documents/documents-view"
import { DocumentsEmptyState } from "@/components/documents/documents-empty-state"
import { ensureProfile } from "@/lib/create-profile"
import { redirect } from "next/navigation"
import { PageShell } from "@/components/layout/page-shell"
import { Upload } from "lucide-react"

export default async function DocumentsPage() {
  const user = await ensureProfile()

  if (!user) {
    redirect("/login")
  }

  const documents = await getDocuments()

  return (
    <PageShell
      title="Documents"
      description="Your private document library"
      actions={
        <label
          className="btn-primary-app inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-sm"
          aria-label="Upload document"
        >
          <Upload className="h-4 w-4" />
          Upload
          <input type="file" accept="application/pdf,.pdf" className="hidden" />
        </label>
      }
    >
      {documents.length === 0 ? (
        <DocumentsEmptyState />
      ) : (
        <DocumentsView documents={documents} />
      )}
    </PageShell>
  )
}
