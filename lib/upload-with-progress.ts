/**
 * Upload a file to Supabase Storage with real progress tracking via XMLHttpRequest.
 * The Supabase JS client doesn't support onUploadProgress, so we use XHR directly
 * against the Supabase Storage REST API.
 */

type UploadWithProgressOptions = {
  /** Supabase storage bucket name */
  bucket: string
  /** File path within the bucket */
  path: string
  /** The file to upload */
  file: File
  /** Content type override (defaults to file.type) */
  contentType?: string
  /** Whether to upsert (overwrite existing file) */
  upsert?: boolean
  /** Progress callback: receives a value between 0 and 100 */
  onProgress: (percent: number) => void
  /** Auth token (JWT) for the request */
  token: string
}

type UploadResult = {
  error: Error | null
}

export function uploadWithProgress({
  bucket,
  path,
  file,
  contentType,
  upsert = false,
  onProgress,
  token,
}: UploadWithProgressOptions): Promise<UploadResult> {
  return new Promise((resolve) => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      resolve({ error: new Error("Supabase URL not configured") })
      return
    }

    const url = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100)
        onProgress(percent)
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100)
        resolve({ error: null })
      } else {
        let message = "Upload failed"
        try {
          const body = JSON.parse(xhr.responseText)
          message = body.message || body.error || message
        } catch {
          // ignore parse errors
        }
        resolve({ error: new Error(message) })
      }
    })

    xhr.addEventListener("error", () => {
      resolve({ error: new Error("Network error during upload") })
    })

    xhr.addEventListener("abort", () => {
      resolve({ error: new Error("Upload was cancelled") })
    })

    xhr.open("POST", url)
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.setRequestHeader("x-upsert", upsert ? "true" : "false")
    if (contentType || file.type) {
      xhr.setRequestHeader("Content-Type", contentType || file.type)
    }

    xhr.send(file)
  })
}
