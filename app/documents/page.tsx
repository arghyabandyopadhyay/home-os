import { getDocuments } from "@/lib/documents"
import { DocumentsView } from "@/components/documents/documents-view"
import { ensureProfile } from "@/lib/create-profile"
import { redirect } from "next/navigation"
import { PageShell } from "@/components/layout/page-shell"

export default async function DocumentsPage() {
  const user = await ensureProfile()

  if (!user) {
    redirect("/login")
  }

  const documents = await getDocuments()

  return (
    <PageShell title="Documents" description="Your private document library">
      <DocumentsView documents={documents} />
    </PageShell>
  )
}
