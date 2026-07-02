"use client"

import { useState } from "react"
import Image from "next/image"
import { FileText } from "lucide-react"

type DocumentThumbnailProps = {
  thumbnailUrl: string | null
  title: string
  size: "card" | "list" // card = 3:2 aspect, list = 40x40
}

const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88P/BfwAJhAPkQ0rHRgAAAABJRU5ErkJggg=="

export function DocumentThumbnail({ thumbnailUrl, title, size }: DocumentThumbnailProps) {
  const [hasError, setHasError] = useState(false)

  const showFallback = !thumbnailUrl || hasError

  if (size === "list") {
    if (showFallback) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-app-elevated">
          <FileText size={20} className="text-app-muted" aria-hidden="true" />
        </div>
      )
    }

    return (
      <Image
        src={thumbnailUrl}
        alt={`Thumbnail for ${title}`}
        width={40}
        height={40}
        loading="lazy"
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        className="h-10 w-10 rounded-lg object-cover"
        onError={() => setHasError(true)}
      />
    )
  }

  // Card size: 3:2 aspect ratio
  if (showFallback) {
    return (
      <div className="flex aspect-[3/2] w-full items-center justify-center rounded-xl bg-app-elevated">
        <FileText size={32} className="text-app-muted" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl">
      <Image
        src={thumbnailUrl}
        alt={`Thumbnail for ${title}`}
        fill
        loading="lazy"
        placeholder="blur"
        blurDataURL={BLUR_DATA_URL}
        className="object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  )
}
