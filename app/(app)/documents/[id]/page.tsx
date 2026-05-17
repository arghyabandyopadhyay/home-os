import { createClient } from "@/lib/supabase/server"
import { DocumentReader } from "@/components/documents/document-reader"
import { redirect } from "next/navigation"
import Link from "next/link"

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
      <div className="flex min-h-screen items-center justify-center bg-app text-app">
        <div className="text-center">
          <p className="text-xl">Document not found</p>
          <Link
            href="/documents"
            className="mt-4 inline-block text-blue-500 hover:underline"
          >
            Back to Documents
          </Link>
        </div>
      </div>
    )
  }

  const { data: signedUrlData } = await supabase.storage
    .from("documents")
    .createSignedUrl(document.file_path, 3600)

  const signedUrl = signedUrlData?.signedUrl || ""

  return (
    <div className="flex h-screen flex-col bg-app text-app">
      <header className="flex items-center gap-4 border-b border-app px-6 py-3">
        <Link
          href="/documents"
          className="text-sm text-app-muted hover:text-app"
        >
          ← Documents
        </Link>
        <h1 className="truncate text-sm font-semibold">{document.title}</h1>
      </header>
      <div className="flex-1">
        <DocumentReader url={signedUrl} title={document.title} />
      </div>
    </div>
  )
}
