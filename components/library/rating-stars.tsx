"use client"

import { Star } from "lucide-react"

export function RatingStars({
  value,
  onChange,
}: {
  value: number
  onChange?: (rating: number) => void
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={!onChange}
        >
          <Star
            size={16}
            className={
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-zinc-600"
            }
          />
        </button>
      ))}
    </div>
  )
}