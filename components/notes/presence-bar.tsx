"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { DURATION, EASING } from "@/lib/motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import type { CollaboratorPresence } from "@/types/collaboration"

type PresenceBarProps = {
  collaborators: CollaboratorPresence[]
  maxVisible?: number
}

function getInitials(displayName: string): string {
  return displayName.charAt(0).toUpperCase()
}

export function PresenceBar({ collaborators, maxVisible = 5 }: PresenceBarProps) {
  const prefersReducedMotion = useReducedMotion()

  const visible = collaborators.slice(0, maxVisible)
  const overflow = collaborators.slice(maxVisible)
  const overflowCount = overflow.length

  const motionVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 1, y: 0 },
        visible: { opacity: 1, y: 0 },
        exit: { opacity: 1, y: 0 },
      }
    : {
        hidden: { opacity: 0, y: 12 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: DURATION.normal,
            ease: EASING.entrance,
          },
        },
        exit: {
          opacity: 0,
          y: 0,
          transition: {
            duration: DURATION.fast,
            ease: EASING.exit,
          },
        },
      }

  if (collaborators.length === 0) {
    return (
      <div
        role="status"
        aria-label="Collaborators"
        aria-live="polite"
      />
    )
  }

  return (
    <div
      role="status"
      aria-label="Collaborators"
      aria-live="polite"
      className="flex items-center gap-1"
    >
      <AnimatePresence mode="popLayout">
        {visible.map((collaborator) => (
          <motion.div
            key={collaborator.userId}
            variants={motionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative"
          >
            <div
              title={collaborator.displayName}
              className="flex h-8 w-8 items-center justify-center rounded-full overflow-hidden"
              style={{
                boxShadow: `0 0 0 2px ${collaborator.color}`,
              }}
            >
              {collaborator.avatarUrl ? (
                <Image
                  src={collaborator.avatarUrl}
                  alt={collaborator.displayName}
                  width={32}
                  height={32}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span
                  className="flex h-full w-full items-center justify-center rounded-full bg-app-elevated text-app text-xs font-semibold"
                  aria-hidden="true"
                >
                  {getInitials(collaborator.displayName)}
                </span>
              )}
            </div>
          </motion.div>
        ))}

        {overflowCount > 0 && (
          <motion.div
            key="overflow-badge"
            variants={motionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              title={overflow.map((c) => c.displayName).join(", ")}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-app-elevated text-app-muted text-xs font-semibold border border-app"
            >
              +{overflowCount}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
