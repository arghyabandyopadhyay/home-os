"use client"

import * as React from "react"
import { Dialog as DialogPrimitive } from "radix-ui"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { XIcon } from "@phosphor-icons/react"

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
} as const

type AppModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  size?: "sm" | "md"
  children: React.ReactNode
}

export function AppModal({
  open,
  onOpenChange,
  size = "md",
  children,
}: AppModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40",
            "backdrop-blur-[16px]",
            "data-open:animate-in data-open:fade-in-0",
            "data-closed:animate-out data-closed:fade-out-0",
            "duration-200"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
            "max-w-[calc(100%-2rem)]",
            sizeClasses[size],
            "panel-app p-6",
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
            "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            "duration-200",
            "outline-none"
          )}
        >
          {children}
          <DialogPrimitive.Close asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-4 right-4"
              aria-label="Close"
            >
              <XIcon />
            </Button>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
