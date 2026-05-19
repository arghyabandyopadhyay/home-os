"use client"

import { Phone } from "lucide-react"

type CallButtonProps = {
  phone: string
  contactName: string
}

function getAriaLabel(contactName: string): string {
  const label = `Call ${contactName}`
  if (label.length <= 100) {
    return label
  }
  return label.slice(0, 99) + "…"
}

export function CallButton({ phone, contactName }: CallButtonProps) {
  const ariaLabel = getAriaLabel(contactName)

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.stopPropagation()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLAnchorElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.stopPropagation()
    }
  }

  return (
    <a
      href={`tel:${phone}`}
      aria-label={ariaLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-app bg-app-surface text-app transition-all duration-[180ms] ease-out hover:scale-[1.03] hover:bg-app-elevated focus:scale-[1.03] focus:bg-app-elevated focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
    >
      <Phone className="h-5 w-5" aria-hidden="true" />
    </a>
  )
}
