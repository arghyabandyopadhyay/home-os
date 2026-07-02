"use client"

import { useRef, useEffect } from "react"
import { Search } from "lucide-react"

type SearchInputProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search notes, tasks, documents...",
  autoFocus = false,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  return (
    <div className="relative">
      <Search
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-app-muted"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        aria-label="Search Home OS"
        className="input-app pl-10 w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}
