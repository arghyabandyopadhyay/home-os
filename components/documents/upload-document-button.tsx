"use client"

import { useRef } from "react"
import { Upload } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { v4 as uuid } from "uuid"
import { toast } from "sonner"
import { validateUploadFile } from "@/lib/documents-utils"
import { uploadWithProgress } from "@/lib/upload-with-progress"
import { useRouter } from "next/navigation"
import { createClientApiClient } from "@/lib/api-client"
import { useWorkspacePermissions } from "@/hooks/use-workspace-permissions"

const api = createClientApiClient()

/**
 * Client component button that handles document upload with progress.
 * Used in the page header and empty state.
 */
export function UploadDocumentButton({ variant = "primary" }: { variant?: "primary" | "inline" }) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const { isReadOnly } = useWorkspacePermissions()

  if (isReadOnly) return null

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input so the same file can be re-selected
    e.target.value = ""

    const validation = validateUploadFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    // File upload still uses Supabase Storage for the binary upload
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Not authenticated")
      return
    }

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) {
      toast.error("No auth session")
      return
    }

    const documentId = uuid()
    const filePath = `${user.id}/${documentId}.pdf`

    const uploadToast = toast.loading("Uploading document... 0%")

    try {
      const { error: uploadError } = await uploadWithProgress({
        bucket: "documents",
        path: filePath,
        file,
        contentType: "application/pdf",
        upsert: false,
        onProgress: (percent) => {
          toast.loading(`Uploading document... ${percent}%`, { id: uploadToast })
        },
        token,
      })

      if (uploadError) throw uploadError

      // Insert document metadata via API
      await api.post("/documents", {
        body: {
          id: documentId,
          title: file.name.replace(/\.pdf$/i, ""),
          file_path: filePath,
          file_size: file.size,
        },
        timeout: 120_000,
      })

      toast.success("Document uploaded", { id: uploadToast })
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed"
      toast.error(message, { id: uploadToast })
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Select PDF file to upload"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className={
          variant === "primary"
            ? "btn-primary-app inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-sm"
            : "btn-primary-app inline-flex cursor-pointer items-center gap-2 px-4 py-2 text-sm"
        }
        aria-label="Upload document"
      >
        <Upload className="h-4 w-4" aria-hidden="true" />
        Upload
      </button>
    </>
  )
}
