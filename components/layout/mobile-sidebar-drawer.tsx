"use client"

import { useCallback, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"

import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { useLowPerformance } from "@/hooks/use-low-performance"
import { DURATION, EASING } from "@/lib/motion"
import { Sidebar } from "./sidebar"
import { X } from "lucide-react"

// ─── Types ───────────────────────────────────────────────────────────────────

type MobileSidebarDrawerProps = {
  open: boolean
  onClose: () => void
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MobileSidebarDrawer({ open, onClose }: MobileSidebarDrawerProps) {
  const prefersReducedMotion = useReducedMotion()
  const isLowPerf = useLowPerformance()
  const shouldAnimate = !prefersReducedMotion && !isLowPerf
  const drawerRef = useRef<HTMLDivElement>(null)

  // Close on Escape key
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  // Trap focus inside drawer when open
  useEffect(() => {
    if (!open) return

    // Prevent body scroll when drawer is open
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  // Focus the drawer when it opens
  useEffect(() => {
    if (open && drawerRef.current) {
      drawerRef.current.focus()
    }
  }, [open])

  const handleBackdropClick = useCallback(() => {
    onClose()
  }, [onClose])

  const duration = shouldAnimate ? DURATION.normal : 0

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration, ease: EASING.entrance }}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            tabIndex={-1}
            className="fixed inset-y-0 left-0 z-50 w-[272px] shadow-2xl md:hidden outline-none"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{
              duration,
              ease: shouldAnimate ? EASING.entrance : undefined,
            }}
          >
            <Sidebar
              closeButton={
                <button
                  onClick={onClose}
                  aria-label="Close navigation menu"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-app-muted hover:bg-app-elevated hover:text-app transition-colors"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              }
              onNavigate={onClose}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
